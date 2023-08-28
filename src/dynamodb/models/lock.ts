import { Item } from 'dynamoose/dist/Item';
import { Model } from 'dynamoose/dist/Model';

export interface Lock extends Item {
  id: string | null;
  timestamp: number | undefined;
  ttl: number;
  owner: string;
}
