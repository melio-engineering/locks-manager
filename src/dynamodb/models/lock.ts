import { Item } from 'dynamoose/dist/Item';

export interface Lock extends Item {
  id: string | null;
  timestamp: number | undefined;
  ttl: number;
  owner: string;
}
