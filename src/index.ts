import retry from 'async-retry';
import config from 'config';
import * as dynamoose from 'dynamoose';
import Logger from 'log4js';
import moment from 'moment';
import { Dynamodb } from './dynamodb';
import { getDeleteCondition } from './dynamodb/conditions/delete';
import { getInsertCondition } from './dynamodb/conditions/insert';
import { Lock } from './dynamodb/models/lock';
import { LockResponse } from './dynamodb/types/lock-response';
import { CanOnlyInitOnceError } from './errors/can-only-init-once-error';
import { CouldNotAcquireLockError } from './errors/could-not-acquire-lock-error';
import { LockTimeoutTooShortError } from './errors/lock-timeout-too-short-error';
import { MissingPropertyError } from './errors/missing-property-error';
import { NotInitializedError } from './errors/not-initialized-error';
import { LocksManagerOptions } from './types/locks-manager-options';
import { addSecondsOnTimestamp, getUtcTimeHandler, getUtcTimestamp } from './utils/timestamp';

export class LocksManager {
  // Due to DynamoDb r/w latency we do not allow lock time shorter than 30 sec
  private readonly MINIMAL_ALLOWED_TIMEOUT_IN_SEC = 3;

  private readonly DEFAULT_LOCK_TIMEOUT_IN_SEC = 15 * 60;

  private readonly DEFAULT_LOCK_RETRY_INTERVAL_IN_MS = 1000;

  private readonly DEFAULT_MAX_ALLOWED_TRIES_NUMBER = 9;

  private static readonly CONDITION_FAILED_ERROR_CODE = 'ConditionalCheckFailedException';

  private readonly lockTimeoutInSec: number;

  private readonly lockRetryIntervalInMs: number;

  private readonly maxAllowedTriesNumber: number;

  private static instance: LocksManager;

  private readonly logger;

  private constructor(options?: LocksManagerOptions) {
    const tableName: string = options?.tableName || config.get('locks-manager.dynamodb.table_name');
    this.maxAllowedTriesNumber = options?.maxAllowedTriesNumber || this.DEFAULT_MAX_ALLOWED_TRIES_NUMBER;
    this.lockRetryIntervalInMs = options?.lockRetryIntervalInMs || this.DEFAULT_LOCK_RETRY_INTERVAL_IN_MS;
    this.lockTimeoutInSec = options?.lockTimeoutInSec || this.DEFAULT_LOCK_TIMEOUT_IN_SEC;
    this.logger = Logger.getLogger('locks-manager');

    this.validateMinimalAllowedTimeOut(this.lockTimeoutInSec);
    Dynamodb.setTableName(tableName);
  }

  private validateMinimalAllowedTimeOut(timeoutInSec: number) {
    if (timeoutInSec < this.MINIMAL_ALLOWED_TIMEOUT_IN_SEC) {
      throw new LockTimeoutTooShortError(
        timeoutInSec, this.MINIMAL_ALLOWED_TIMEOUT_IN_SEC,
      );
    }
  }

  private getLockTtlUtcTimestamp(lockHoldTime: number): number {
    const utcTimestamp: moment.Moment = getUtcTimeHandler();
    return addSecondsOnTimestamp(utcTimestamp, lockHoldTime);
  }

  static init(options?: LocksManagerOptions) {
    if (!LocksManager.instance) {
      LocksManager.instance = new LocksManager(options);
      dynamoose.aws.ddb();
      return LocksManager;
    }

    throw new CanOnlyInitOnceError();
  }

  static getInstance() {
    if (!LocksManager.instance) {
      throw new NotInitializedError();
    }

    return LocksManager.instance;
  }

  acquireWithRetry(
    id: string,
    lockTimeoutInSec?: number,
    maxRetries?: number,
  ): Promise<LockResponse> {
    const retryOptions = {
      maxTimeout: this.lockRetryIntervalInMs,
      retries: maxRetries || this.maxAllowedTriesNumber,
    };

    return retry<LockResponse>(  (_, attempt) => {
      this.logger.debug('Attempting to lock', { attempt });
      return this.acquire(id, lockTimeoutInSec);
    }, retryOptions);
  }

  async acquire(
    id: string,
    lockTimeoutInSec?: number,
  ): Promise<LockResponse> {
    let lock;
    try {
      lock = await this.acquireLock(id, lockTimeoutInSec);
    } catch (e) {
      throw new CouldNotAcquireLockError(e.message, e.code);
    }

    return lock;
  }

  private async acquireLock(
    id: string,
    lockTimeoutInSec?: number,
  ): Promise<LockResponse> {
    const lockHoldTimeInSec = lockTimeoutInSec || this.lockTimeoutInSec;
    this.validateMinimalAllowedTimeOut(lockHoldTimeInSec);
    const expire = this.getLockTtlUtcTimestamp(lockHoldTimeInSec);
    const condition = getInsertCondition(id);

    const lock = await Dynamodb.createLock({
      id,
      timestamp: expire,
      ttl: this.getLockTtlUtcTimestamp(lockHoldTimeInSec + 1),
    }, {
      condition,
      overwrite: true,
    });

    this.logger.debug('Got lock', {
      id,
      lock,
    });

    return {
      id: lock.id,
      owner: lock.owner,
    };
  }


  async release(lock: LockResponse): Promise<void> {
    if (!lock.owner || !lock.id) {
      throw new MissingPropertyError(['id', 'owner']);
    }

    this.logger.debug('Releasing lock', { id: lock });

    const condition = getDeleteCondition(lock.owner);
    await Dynamodb.releaseLock(lock.id, { condition });
  }

  async isLocked(id: string): Promise<boolean> {
    const lock: Lock  = await Dynamodb.getById(id);
    if (!lock) {
      return false;
    }

    return lock.timestamp > getUtcTimestamp();
  }

  /**
   * For beta testing only
   */
  getRaceConditionErrorMessage() {
    return LocksManager.CONDITION_FAILED_ERROR_CODE;
  }
}
