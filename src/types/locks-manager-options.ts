export interface LocksManagerOptions {
  tableName?: string;
  lockTimeoutInSec?: number;
  maxAllowedTriesNumber?: number;
  lockRetryIntervalInMs?: number;
  isTestMode?: boolean;
  localDynamoInstanceUrl?: string;
}
