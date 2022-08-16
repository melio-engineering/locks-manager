export interface LocksManagerOptions {
  tableName?: string;
  lockTimeoutInSec?: number;
  maxAllowedTriesNumber?: number;
  lockRetryIntervalInMs?: number;
  dynamoInstanceEndpoint?: string;
}
