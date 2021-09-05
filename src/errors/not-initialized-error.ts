export class NotInitializedError extends Error {
  private ignoreBySentry: boolean;

  constructor() {
    super();
    this.message = 'Locks manager must be initialized. Please use LocksManager.init()';
    this.ignoreBySentry = true;
  }
}
