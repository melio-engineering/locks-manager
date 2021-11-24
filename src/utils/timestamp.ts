import moment from 'moment';

const FORMAT_TIMESTAMP_IN_SECONDS = 'X';

export class Timestamp {
  static get = (): number =>
    parseInt(
      Timestamp.getMomentUtcTimestamp()
        .format(FORMAT_TIMESTAMP_IN_SECONDS),
      10);

  static getLockTtl = (lockHoldTime: number): number =>
    parseInt(
      Timestamp.getMomentUtcTimestamp()
        .add(lockHoldTime, 'seconds')
        .format(FORMAT_TIMESTAMP_IN_SECONDS),
      10);

  private static getMomentUtcTimestamp() {
    return moment().utc();
  }
}
