import config from 'config';
import * as dynamoose from 'dynamoose';
import Logger from 'log4js';
import { Dynamodb } from './dynamodb';
import { getDeleteCondition } from './dynamodb/conditions/delete';
import { getInsertCondition } from './dynamodb/conditions/insert';
import { LockResponse } from './dynamodb/types/lock-response';
import { CanOnlyInitOnceError } from './errors/can-only-init-once-error';
import { CouldNotAcquireLockError } from './errors/could-not-acquire-lock-error';
import { LockTimeoutTooShortError } from './errors/lock-timeout-too-short-error';
import { MissingPropertyError } from './errors/missing-property-error';
import { NotInitializedError } from './errors/not-initialized-error';
import { LocksManagerOptions } from './types/locks-manager-options';
import { Dates } from './utils/dates';
import { Timers } from './utils/timers';

export class LocksManager {
  // Due to DynamoDb r/w latency we do not allow lock time shorter than 30 sec
  private readonly MINIMAL_ALLOWED_TIMEOUT_IN_SEC = 30;

  private readonly DEFAULT_LOCK_TIMEOUT_IN_SEC = 15 * 60;

  private readonly DEFAULT_LOCK_RETRY_INTERVAL_IN_MS = 1000;

  private readonly DEFAULT_MAX_ALLOWED_TRIES_NUMBER = 10;

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

  async acquire(id: string, lockTimeoutIsSec?: number): Promise<LockResponse> {
    const lockHoldTime = lockTimeoutIsSec || this.lockTimeoutInSec;
    this.validateMinimalAllowedTimeOut(lockHoldTime);
    const expire = parseInt(Dates.getLockTtlTimestamp(lockHoldTime), 10);
    const condition = getInsertCondition(id);
    const lock = await Dynamodb.createLock({
      id,
      timestamp: expire,
    }, {
      condition,
      overwrite: true,
    });

    this.logger.debug('Got lock', {
      id,
    });

    return {
      id: lock.id,
      owner: lock.owner,
    };
  }

  async acquireWithRetry(
    id: string, tryNumber = 1, lockTimeout?: number,
  ): Promise<LockResponse> {
    let lock;
    try {
      lock = await this.acquire(id, lockTimeout);
    } catch (e: any) {
      if (
        e.code === LocksManager.CONDITION_FAILED_ERROR_CODE
        && tryNumber <= this.maxAllowedTriesNumber
      ) {
        await Timers.delay(this.lockRetryIntervalInMs);
        return this.acquireWithRetry(id, tryNumber + 1, lockTimeout);
      }

      throw new CouldNotAcquireLockError(e.message, e.code);
    }

    lock.try = tryNumber;
    return lock;
  }

  async release(lock: LockResponse): Promise<void> {
    if (!lock.owner || !lock.id) {
      throw new MissingPropertyError(['id', 'owner']);
    }

    this.logger.debug('Releasing lock', {
      id: lock,
    });

    const condition = getDeleteCondition(lock.owner);
    await Dynamodb.releaseLock(lock.id, { condition });
  }

  async withLock(id: string, cb: any): Promise<boolean> {
    const lock = await this.acquire(id);

    if (lock) {
      await cb();
      await this.release(lock);
      return true;
    }

    return false;
  }

  async isLocked(id: string): Promise<boolean> {
    const lock = await Dynamodb.getLockedItem(id);
    return !!lock.count;
  }

  /**
   * For beta testing only
   */
  getRaceConditionErrorMessage() {
    return LocksManager.CONDITION_FAILED_ERROR_CODE;
  }
}
