export interface LocksManagerOptions {
  tableName?: string;
  lockTimeoutInSec?: number;
  maxAllowedTriesNumber?: number;
  lockRetryIntervalInMs?: number;
  useLocalInstance?: boolean;
  localDynamoInstanceUrl?: string;
}
