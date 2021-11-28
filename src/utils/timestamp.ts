import moment from 'moment';

const FORMAT_TIMESTAMP_IN_SECONDS = 'X';

export function getUctTimestamp(): number {
  return parseInt(
    getUtcTimestamp()
      .format(FORMAT_TIMESTAMP_IN_SECONDS),
    10);
}

export function getLockTtlUtcTimestamp(lockHoldTime: number): number {
  const utcTimestamp: moment.Moment = getUtcTimestamp();
  return parseInt(
    utcTimestamp
      .add(lockHoldTime, 'seconds')
      .format(FORMAT_TIMESTAMP_IN_SECONDS),
    10);
}

export function getDynamoTtlUtcTimestamp(lockHoldTimeInSec: number): number {
  const dynamoRecordTtlIsSec = lockHoldTimeInSec + 1;
  const utcTimestamp: moment.Moment = getUtcTimestamp();
  return parseInt(
    utcTimestamp
      .add(dynamoRecordTtlIsSec, 'seconds')
      .format(FORMAT_TIMESTAMP_IN_SECONDS),
    10);
}

function getUtcTimestamp(): moment.Moment {
  return moment().utc();
}
