import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Report, ReportStatus } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

export const reportRepository = {
  async create(report: Report): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_REPORTS,
        Item: report,
        ConditionExpression: 'attribute_not_exists(reportId)',
      })
    );
  },

  async getById(reportId: string): Promise<Report | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new GetCommand({
        TableName: env.DYNAMODB_TABLE_REPORTS,
        Key: { reportId },
      })
    );
    if (!res.Item) return null;
    return res.Item as Report;
  },

  async scanAll(): Promise<Report[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: Report[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new ScanCommand({
          TableName: env.DYNAMODB_TABLE_REPORTS,
          ExclusiveStartKey: startKey,
        })
      );
      for (const item of res.Items ?? []) {
        out.push(item as Report);
      }
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out;
  },

  async updateStatus(input: {
    reportId: string;
    status: ReportStatus;
    resolvedBy: string;
    now: string;
  }): Promise<Report | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_REPORTS,
        Key: { reportId: input.reportId },
        UpdateExpression: 'SET #s = :s, resolvedBy = :by, resolvedAt = :at',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': input.status,
          ':by': input.resolvedBy,
          ':at': input.now,
        },
        ConditionExpression: 'attribute_exists(reportId)',
        ReturnValues: 'ALL_NEW',
      })
    );
    if (!res.Attributes) return null;
    return res.Attributes as Report;
  },
};
