export class CanOnlyInitOnceError extends Error {
  private ignoreBySentry: boolean;

  constructor() {
    super();
    this.message = 'Locks manager was already initialized';
    this.ignoreBySentry = true;
  }
}
