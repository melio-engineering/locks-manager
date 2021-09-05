export class LockTimeoutTooShortError extends Error {
  private ignoreBySentry: boolean;

  constructor(private userTimeout: number, private minimalTimeout: number, message = '') {
    super();
    this.message = message || 'Lock timeout is too short, please use higher value';
    this.userTimeout = userTimeout;
    this.minimalTimeout = minimalTimeout;
    this.ignoreBySentry = true;
  }
}
