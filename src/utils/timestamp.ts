import moment from 'moment';

const FORMAT_TIMESTAMP_IN_SECONDS = 'X';

export function getUtcTimestamp(): number {
  return parseInt(
    getUtcTimeHandler()
      .format(FORMAT_TIMESTAMP_IN_SECONDS),
    10);
}

export function addSecondsOnTimestamp(utcTimestamp: moment.Moment, lockHoldTime: number) {
  return parseInt(
    utcTimestamp
      .add(lockHoldTime, 'seconds')
      .format(FORMAT_TIMESTAMP_IN_SECONDS),
    10);
}

export function getUtcTimeHandler(): moment.Moment {
  return moment().utc();
}
