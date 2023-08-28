import * as dynamoose from 'dynamoose';
import { ModelType } from 'dynamoose/dist/General';
import { MissingTableNameError } from '../errors/missing-table-name-error';
import { Lock } from './models/lock';
import { schema } from './schema';
import { schemaOptions } from './schema-options';
import { ItemSaveSettings } from "dynamoose/dist/Item";

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

  static async createLock(document: Partial<Lock>, options: ItemSaveSettings): Promise<Lock> {
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
}
