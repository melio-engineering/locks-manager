export class CouldNotAcquireLockError extends Error {
  private ignoreBySentry: boolean;
  private code: string;

  constructor(message = '', code?: string) {
    super();
    this.message = message || 'Could not acquire lock';
    this.code = code || '423';
    this.ignoreBySentry = true;
  }
}
