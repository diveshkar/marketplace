import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Favorite } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

export const favoriteRepository = {
  async put(fav: Favorite): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({ TableName: env.DYNAMODB_TABLE_FAVORITES, Item: fav })
    );
  },

  async delete(userId: string, listingId: string): Promise<boolean> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    try {
      await doc.send(
        new DeleteCommand({
          TableName: env.DYNAMODB_TABLE_FAVORITES,
          Key: { userId, listingId },
          ConditionExpression: 'attribute_exists(userId)',
        })
      );
      return true;
    } catch (e) {
      if (e instanceof ConditionalCheckFailedException) return false;
      throw e;
    }
  },

  async listByUserId(userId: string): Promise<Favorite[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: Favorite[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new QueryCommand({
          TableName: env.DYNAMODB_TABLE_FAVORITES,
          KeyConditionExpression: 'userId = :u',
          ExpressionAttributeValues: { ':u': userId },
          ExclusiveStartKey: startKey,
        })
      );
      for (const item of res.Items ?? []) out.push(item as Favorite);
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out;
  },

  async exists(userId: string, listingId: string): Promise<boolean> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: env.DYNAMODB_TABLE_FAVORITES,
        KeyConditionExpression: 'userId = :u AND listingId = :l',
        ExpressionAttributeValues: { ':u': userId, ':l': listingId },
        Limit: 1,
        Select: 'COUNT',
      })
    );
    return (res.Count ?? 0) > 0;
  },
};
