export class CouldNotAcquireLockError extends Error {
  private ignoreBySentry: boolean;

  constructor(message = '') {
    super();
    this.message = message || 'Could not acquire lock';
    this.ignoreBySentry = true;
  }
}
