import { Condition } from 'dynamoose';
import { getUtcTimestamp } from '../../utils/timestamp';

export const getInsertCondition = (id: string) => {
  const now = getUtcTimestamp();
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
