import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

export type CategoryRecord = {
  slug: string;
  name: string;
  icon: string;
  subcategories: { slug: string; name: string }[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export const categoryRepository = {
  async put(cat: CategoryRecord): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({ TableName: env.DYNAMODB_TABLE_CATEGORIES, Item: cat })
    );
  },

  async getBySlug(slug: string): Promise<CategoryRecord | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new GetCommand({ TableName: env.DYNAMODB_TABLE_CATEGORIES, Key: { slug } })
    );
    return (res.Item as CategoryRecord) ?? null;
  },

  async scanAll(): Promise<CategoryRecord[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: CategoryRecord[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new ScanCommand({ TableName: env.DYNAMODB_TABLE_CATEGORIES, ExclusiveStartKey: startKey })
      );
      for (const item of res.Items ?? []) out.push(item as CategoryRecord);
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async delete(slug: string): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new DeleteCommand({ TableName: env.DYNAMODB_TABLE_CATEGORIES, Key: { slug } })
    );
  },
};
