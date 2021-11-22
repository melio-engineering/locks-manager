import { Condition } from 'dynamoose';
import { Dates } from '../../utils/dates';

export const getInsertCondition = (id: string) => {
  const now = Dates.getTimestamp();
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
