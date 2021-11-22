import moment from 'moment';

const FORMAT_TIMESTAMP_IN_SECONDS = 'X';

export class Dates {
  static getTimestamp = (): number =>
      parseInt(
          moment().format(FORMAT_TIMESTAMP_IN_SECONDS),
  10);

  static getLockTtlTimestamp = (lockHoldTime: number): number =>
    parseInt(
      moment()
      .add(lockHoldTime, 'seconds')
      .format(FORMAT_TIMESTAMP_IN_SECONDS)
  ,10);
}
