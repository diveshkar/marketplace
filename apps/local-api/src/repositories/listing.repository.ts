import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Listing, PromotionType } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

const USER_ID_INDEX = 'userId-index';

export const listingRepository = {
  async create(listing: Listing): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_LISTINGS,
        Item: listing,
        ConditionExpression: 'attribute_not_exists(listingId)',
      })
    );
  },

  async getById(listingId: string): Promise<Listing | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new GetCommand({
        TableName: env.DYNAMODB_TABLE_LISTINGS,
        Key: { listingId },
      })
    );
    if (!res.Item) return null;
    return res.Item as Listing;
  },

  async listByUserId(userId: string): Promise<Listing[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: Listing[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new QueryCommand({
          TableName: env.DYNAMODB_TABLE_LISTINGS,
          IndexName: USER_ID_INDEX,
          KeyConditionExpression: 'userId = :u',
          ExpressionAttributeValues: { ':u': userId },
          ExclusiveStartKey: startKey,
        })
      );
      for (const item of res.Items ?? []) {
        out.push(item as Listing);
      }
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out;
  },

  async put(listing: Listing): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_LISTINGS,
        Item: listing,
        ConditionExpression: 'userId = :u AND listingId = :id',
        ExpressionAttributeValues: { ':u': listing.userId, ':id': listing.listingId },
      })
    );
  },

  async transitionStatus(input: {
    listingId: string;
    userId: string;
    from: Listing['status'];
    to: Listing['status'];
    now: string;
    publishedAt?: string;
  }): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    if (input.publishedAt) {
      await doc.send(
        new UpdateCommand({
          TableName: env.DYNAMODB_TABLE_LISTINGS,
          Key: { listingId: input.listingId },
          UpdateExpression: 'SET #s = :to, updatedAt = :now, publishedAt = :p',
          ConditionExpression: 'userId = :u AND #s = :from',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':to': input.to,
            ':from': input.from,
            ':u': input.userId,
            ':now': input.now,
            ':p': input.publishedAt,
          },
        })
      );
      return;
    }
    await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_LISTINGS,
        Key: { listingId: input.listingId },
        UpdateExpression: 'SET #s = :to, updatedAt = :now',
        ConditionExpression: 'userId = :u AND #s = :from',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':to': input.to,
          ':from': input.from,
          ':u': input.userId,
          ':now': input.now,
        },
      })
    );
  },

  /** Admin status transition — no ownership check (Phase 9). */
  async transitionStatusAdmin(input: {
    listingId: string;
    from: Listing['status'];
    to: Listing['status'];
    now: string;
    publishedAt?: string;
  }): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const updateExpr = input.publishedAt
      ? 'SET #s = :to, updatedAt = :now, publishedAt = :p'
      : 'SET #s = :to, updatedAt = :now';
    const values: Record<string, unknown> = {
      ':to': input.to,
      ':from': input.from,
      ':now': input.now,
    };
    if (input.publishedAt) values[':p'] = input.publishedAt;
    await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_LISTINGS,
        Key: { listingId: input.listingId },
        UpdateExpression: updateExpr,
        ConditionExpression: '#s = :from',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: values,
      })
    );
  },

  /** Full table scan (Phase 6 browse MVP; low-traffic / local DynamoDB). */
  async scanAll(): Promise<Listing[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: Listing[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new ScanCommand({
          TableName: env.DYNAMODB_TABLE_LISTINGS,
          ExclusiveStartKey: startKey,
        })
      );
      for (const item of res.Items ?? []) {
        out.push(item as Listing);
      }
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out;
  },

  async delete(listingId: string, userId: string): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new DeleteCommand({
        TableName: env.DYNAMODB_TABLE_LISTINGS,
        Key: { listingId },
        ConditionExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': userId },
      })
    );
  },

  async incrementViews(listingId: string): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_LISTINGS,
        Key: { listingId },
        UpdateExpression: 'SET #v = if_not_exists(#v, :zero) + :one',
        ExpressionAttributeNames: { '#v': 'views' },
        ExpressionAttributeValues: { ':zero': 0, ':one': 1 },
      })
    );
  },

  async setActivePromotion(listingId: string, type?: PromotionType): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    if (type) {
      await doc.send(
        new UpdateCommand({
          TableName: env.DYNAMODB_TABLE_LISTINGS,
          Key: { listingId },
          UpdateExpression: 'SET activePromotion = :t, updatedAt = :now',
          ExpressionAttributeValues: { ':t': type, ':now': new Date().toISOString() },
        })
      );
    } else {
      await doc.send(
        new UpdateCommand({
          TableName: env.DYNAMODB_TABLE_LISTINGS,
          Key: { listingId },
          UpdateExpression: 'REMOVE activePromotion SET updatedAt = :now',
          ExpressionAttributeValues: { ':now': new Date().toISOString() },
        })
      );
    }
  },

  async appendImageKey(input: {
    listingId: string;
    userId: string;
    key: string;
    maxAllowed: number;
  }): Promise<Listing | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const now = new Date().toISOString();
    try {
      const res = await doc.send(
        new UpdateCommand({
          TableName: env.DYNAMODB_TABLE_LISTINGS,
          Key: { listingId: input.listingId },
          UpdateExpression:
            'SET imageKeys = list_append(if_not_exists(imageKeys, :empty), :one), updatedAt = :now',
          ConditionExpression:
            'userId = :u AND (attribute_not_exists(imageKeys) OR size(imageKeys) < :max)',
          ExpressionAttributeValues: {
            ':empty': [],
            ':one': [input.key],
            ':u': input.userId,
            ':max': input.maxAllowed,
            ':now': now,
          },
          ReturnValues: 'ALL_NEW',
        })
      );
      return (res.Attributes as Listing) ?? null;
    } catch (e) {
      if (e instanceof ConditionalCheckFailedException) {
        return null;
      }
      throw e;
    }
  },
};
