import moment from 'moment';

const FORMAT_TIMESTAMP_IN_SECONDS = 'X';

export class Dates {
  static getTimestamp = (): string => moment().format(FORMAT_TIMESTAMP_IN_SECONDS);

  static getLockTtlTimestamp = (lockHoldTime: number): string =>
    moment()
      .add(lockHoldTime, 'seconds')
      .format(FORMAT_TIMESTAMP_IN_SECONDS);
}
