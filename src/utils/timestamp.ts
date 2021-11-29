import moment from 'moment';

const FORMAT_TIMESTAMP_IN_SECONDS = 'X';

export function getUtcTimestamp(): number {
  return parseInt(
    getUtcTimeHandler()
      .format(FORMAT_TIMESTAMP_IN_SECONDS),
    10);
}

export function getLockTtlUtcTimestamp(lockHoldTime: number): number {
  const utcTimestamp: moment.Moment = getUtcTimeHandler();
  return addSecondsOnTimestamp(utcTimestamp, lockHoldTime);
}

export function getDynamoTtlUtcTimestamp(lockHoldTimeInSec: number): number {
  const dynamoRecordTtlIsSec = lockHoldTimeInSec + 1;
  const utcTimestamp: moment.Moment = getUtcTimeHandler();
  return addSecondsOnTimestamp(utcTimestamp, dynamoRecordTtlIsSec);
}

function addSecondsOnTimestamp(utcTimestamp: moment.Moment, lockHoldTime: number) {
  return parseInt(
    utcTimestamp
      .add(lockHoldTime, 'seconds')
      .format(FORMAT_TIMESTAMP_IN_SECONDS),
    10);
}

function getUtcTimeHandler(): moment.Moment {
  return moment().utc();
}
