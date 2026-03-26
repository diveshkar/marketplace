import { PutCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

export type ActivityLog = {
  logId: string;
  adminUserId: string;
  adminName: string;
  action: string;
  targetType: 'LISTING' | 'USER' | 'REPORT' | 'CATEGORY' | 'LOCATION';
  targetId: string;
  details: string;
  createdAt: string;
};

export const activityLogRepository = {
  async create(log: ActivityLog): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_ACTIVITY_LOGS,
        Item: log,
      })
    );
  },

  async listAll(): Promise<ActivityLog[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: ActivityLog[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new ScanCommand({
          TableName: env.DYNAMODB_TABLE_ACTIVITY_LOGS,
          ExclusiveStartKey: startKey,
        })
      );
      for (const item of res.Items ?? []) {
        out.push(item as ActivityLog);
      }
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listByAdmin(adminUserId: string): Promise<ActivityLog[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: env.DYNAMODB_TABLE_ACTIVITY_LOGS,
        IndexName: 'adminUserId-createdAt-index',
        KeyConditionExpression: 'adminUserId = :a',
        ExpressionAttributeValues: { ':a': adminUserId },
        ScanIndexForward: false,
      })
    );
    return (res.Items as ActivityLog[]) ?? [];
  },
};
