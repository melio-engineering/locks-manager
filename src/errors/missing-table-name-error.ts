export class MissingTableNameError extends Error {
  private ignoreBySentry: boolean;

  constructor() {
    super();
    this.message = 'Table name is not set, please use Dynamodb.setTableName';
    this.ignoreBySentry = true;
  }
}
