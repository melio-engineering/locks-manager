export class Timers {
  static delay = (ms: number) => new Promise(fn => setTimeout(fn, ms));
}
