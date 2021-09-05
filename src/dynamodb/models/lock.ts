import { AnyDocument } from 'dynamoose/dist/Document';

export interface Lock extends AnyDocument {
  id: string | null;
  timestamp: number | undefined;
  owner: string;
}
