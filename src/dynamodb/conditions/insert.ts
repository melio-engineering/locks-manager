import { Condition } from 'dynamoose';
import moment from 'moment';

export const FORMAT_TIMESTAMP_IN_SECONDS = 'X';

export const getInsertCondition = (id: string) => {
  const now = parseInt(moment().format(FORMAT_TIMESTAMP_IN_SECONDS), 10);
  return new Condition({
    ConditionExpression: '#key <> :key OR (#key = :key AND #expire > :now)',
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
