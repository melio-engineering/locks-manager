import * as dynamoose from 'dynamoose';
import { DocumentSaveSettings } from 'dynamoose/dist/Document';
import { ModelType } from 'dynamoose/dist/General';
import { MissingTableNameError } from '../errors/missing-table-name-error';
import { Dates } from '../utils/dates';
import { Lock } from './models/lock';
import { schema } from './schema';
import { schemaOptions } from './schema-options';

export class Dynamodb {
  static tableName: string;

  static setTableName(table: string) {
    if (!table) {
      throw new MissingTableNameError();
    }

    Dynamodb.tableName = table;
  }

  static getModel(): ModelType<Lock> {
    return dynamoose.model<Lock>(Dynamodb.tableName, schema, schemaOptions);
  }

  static async createLock(document: Partial<Lock>, options: DocumentSaveSettings): Promise<Lock> {
    const lockModel: ModelType<Lock> = Dynamodb.getModel();
    return lockModel.create(document, options);
  }

  static releaseLock(document: string, options?: any) {
    const lockModel = Dynamodb.getModel();
    return lockModel.delete(document, options);
  }

  static getById(id: string): Promise<Lock | undefined> {
    return Dynamodb.getModel().get(id);
  }

  static async getLockedItem(id: string): Promise<{ count: number, scannedCount: number }> {
    const lockModel: ModelType<Lock> = Dynamodb.getModel();
    const condition = new dynamoose.Condition().where('id').eq(id).and().where('timestamp').lt(Dates.getTimestamp());
    return lockModel
      .scan(condition)
      .count()
      .exec();
  }
}
