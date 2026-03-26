import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Payment } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

export const paymentRepository = {
  async create(payment: Payment): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_PAYMENTS,
        Item: payment,
        ConditionExpression: 'attribute_not_exists(paymentId)',
      })
    );
  },

  async getById(paymentId: string): Promise<Payment | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new GetCommand({
        TableName: env.DYNAMODB_TABLE_PAYMENTS,
        Key: { paymentId },
      })
    );
    return (res.Item as Payment) ?? null;
  },

  async listByUser(userId: string): Promise<Payment[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: env.DYNAMODB_TABLE_PAYMENTS,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': userId },
      })
    );
    return (res.Items as Payment[]) ?? [];
  },

  async updateStatus(paymentId: string, status: string, completedAt?: string): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const expr = completedAt
      ? 'SET #s = :s, completedAt = :c'
      : 'SET #s = :s';
    const vals: Record<string, string> = { ':s': status };
    if (completedAt) vals[':c'] = completedAt;
    await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_PAYMENTS,
        Key: { paymentId },
        UpdateExpression: expr,
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: vals,
      })
    );
  },

  async getByStripeIntentId(stripePaymentIntentId: string): Promise<Payment | null> {
    const all = await this.listAll();
    return all.find((p) => p.stripePaymentIntentId === stripePaymentIntentId) ?? null;
  },

  async listAll(): Promise<Payment[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: Payment[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new ScanCommand({
          TableName: env.DYNAMODB_TABLE_PAYMENTS,
          ExclusiveStartKey: startKey,
        })
      );
      for (const item of res.Items ?? []) out.push(item as Payment);
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out;
  },
};
