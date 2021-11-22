import { Condition } from 'dynamoose';
import {Dates} from "../../utils/dates";

export const getInsertCondition = (id: string) => {
  const now = parseInt(Dates.getTimestamp(), 10);
  return new Condition({
    ConditionExpression: '#key <> :key OR (#key = :key AND #expire < :now)',
    ExpressionAttributeNames: {
      '#expire': 'timestamp',
      '#key': 'id',
    },

    ExpressionAttributeValues: {
      ':key': id,
      ':now': now,
    },
  });
};
