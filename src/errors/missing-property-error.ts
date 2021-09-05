export class MissingPropertyError extends Error {
  private ignoreBySentry: boolean;

  constructor(private properties: Array<string>) {
    super();
    this.message = 'Missing properties';
    this.ignoreBySentry = true;
  }
}
