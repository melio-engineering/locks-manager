import * as dynamoose from 'dynamoose';
import { v4 as uuidv4 } from 'uuid';

export const schema = new dynamoose.Schema({
  id: {
    type: String,
  },
  owner: {
    default: uuidv4(),
    type: String,
  },
  timestamp: {
    type: Number,
  },
  ttl: {
    type: Number,
  },
}, {
  saveUnknown: false,
});
