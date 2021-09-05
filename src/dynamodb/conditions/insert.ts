import { Condition } from 'dynamoose';
import moment from 'moment';

export const FORMAT_TIMESTAMP_IN_SECONDS = 'X';

export const getInsertCondition = (id: string, expirationTimeInSeconds: number) => {
  const expires = parseInt(moment().subtract(expirationTimeInSeconds, 'seconds')
    .format(FORMAT_TIMESTAMP_IN_SECONDS), 10);
  return new Condition({
    ConditionExpression: '#key <> :key OR (#key = :key AND #expire < :expire)',
    ExpressionAttributeNames: {
      '#expire': 'timestamp',
      '#key': 'id',
    },

    ExpressionAttributeValues: {
      ':expire': expires,
      ':key': id,
    },
  });
};
