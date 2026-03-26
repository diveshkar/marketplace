import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Notification } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

export const notificationRepository = {
  async create(notification: Notification): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_NOTIFICATIONS,
        Item: notification,
      })
    );
  },

  async listByUserId(userId: string, limit = 50): Promise<Notification[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: env.DYNAMODB_TABLE_NOTIFICATIONS,
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': userId },
        ScanIndexForward: false,
        Limit: limit,
      })
    );
    return (res.Items ?? []) as Notification[];
  },

  async markRead(userId: string, notificationId: string): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_NOTIFICATIONS,
        Key: { userId, notificationId },
        UpdateExpression: 'SET #r = :t',
        ExpressionAttributeNames: { '#r': 'read' },
        ExpressionAttributeValues: { ':t': true },
      })
    );
  },

  async markAllRead(userId: string): Promise<void> {
    const items = await this.listByUserId(userId);
    const unread = items.filter((n) => !n.read);
    for (const n of unread) {
      await this.markRead(userId, n.notificationId);
    }
  },
};
