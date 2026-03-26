import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Inquiry } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

const BUYER_INDEX = 'buyerUserId-index';
const LISTING_INDEX = 'listingId-index';

export const inquiryRepository = {
  async create(inquiry: Inquiry): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_INQUIRIES,
        Item: inquiry,
        ConditionExpression: 'attribute_not_exists(inquiryId)',
      })
    );
  },

  async listByBuyer(buyerUserId: string): Promise<Inquiry[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: Inquiry[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new QueryCommand({
          TableName: env.DYNAMODB_TABLE_INQUIRIES,
          IndexName: BUYER_INDEX,
          KeyConditionExpression: 'buyerUserId = :b',
          ExpressionAttributeValues: { ':b': buyerUserId },
          ExclusiveStartKey: startKey,
        })
      );
      for (const item of res.Items ?? []) out.push(item as Inquiry);
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out;
  },

  async listByListing(listingId: string): Promise<Inquiry[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: Inquiry[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new QueryCommand({
          TableName: env.DYNAMODB_TABLE_INQUIRIES,
          IndexName: LISTING_INDEX,
          KeyConditionExpression: 'listingId = :l',
          ExpressionAttributeValues: { ':l': listingId },
          ExclusiveStartKey: startKey,
        })
      );
      for (const item of res.Items ?? []) out.push(item as Inquiry);
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out;
  },

  /** Count inquiries sent by buyer on a specific date (YYYY-MM-DD). */
  async countByBuyerOnDate(buyerUserId: string, datePrefix: string): Promise<number> {
    const all = await this.listByBuyer(buyerUserId);
    return all.filter((i) => i.createdAt.startsWith(datePrefix)).length;
  },
};
