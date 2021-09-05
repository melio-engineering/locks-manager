import { Condition } from 'dynamoose';

export const getDeleteCondition = (owner: string) => new Condition({
  ConditionExpression: '#owner = :owner',
  ExpressionAttributeNames: {
    '#owner': 'owner',
  },

  ExpressionAttributeValues: {
    ':owner': owner,
  },
});
