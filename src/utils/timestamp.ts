import moment from 'moment';

const FORMAT_TIMESTAMP_IN_SECONDS = 'X';

export class Timestamp {
  static get = (): number =>
    parseInt(
      moment()
        .utc()
        .format(FORMAT_TIMESTAMP_IN_SECONDS),
      10);

  static getLockTtl = (lockHoldTime: number): number =>
    parseInt(
      moment()
        .utc()
        .add(lockHoldTime, 'seconds')
        .format(FORMAT_TIMESTAMP_IN_SECONDS),
      10);
}
