import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Promotion } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

export const promotionRepository = {
  async create(promotion: Promotion): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_PROMOTIONS,
        Item: promotion,
        ConditionExpression: 'attribute_not_exists(promotionId)',
      })
    );
  },

  async getById(promotionId: string): Promise<Promotion | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new GetCommand({
        TableName: env.DYNAMODB_TABLE_PROMOTIONS,
        Key: { promotionId },
      })
    );
    return (res.Item as Promotion) ?? null;
  },

  async listByUser(userId: string): Promise<Promotion[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: env.DYNAMODB_TABLE_PROMOTIONS,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': userId },
      })
    );
    return (res.Items as Promotion[]) ?? [];
  },

  async listByListing(listingId: string): Promise<Promotion[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: env.DYNAMODB_TABLE_PROMOTIONS,
        IndexName: 'listingId-index',
        KeyConditionExpression: 'listingId = :l',
        ExpressionAttributeValues: { ':l': listingId },
      })
    );
    return (res.Items as Promotion[]) ?? [];
  },

  async updateStatus(promotionId: string, status: Promotion['status']): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_PROMOTIONS,
        Key: { promotionId },
        UpdateExpression: 'SET #s = :s',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':s': status },
      })
    );
  },
};
