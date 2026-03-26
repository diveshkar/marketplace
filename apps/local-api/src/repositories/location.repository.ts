import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

export type DistrictRecord = {
  slug: string;
  name: string;
  cities: { slug: string; name: string }[];
};

export type LocationRecord = {
  slug: string;
  name: string;
  districts: DistrictRecord[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export const locationRepository = {
  async put(loc: LocationRecord): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({ TableName: env.DYNAMODB_TABLE_LOCATIONS, Item: loc })
    );
  },

  async getBySlug(slug: string): Promise<LocationRecord | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new GetCommand({ TableName: env.DYNAMODB_TABLE_LOCATIONS, Key: { slug } })
    );
    return (res.Item as LocationRecord) ?? null;
  },

  async scanAll(): Promise<LocationRecord[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: LocationRecord[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new ScanCommand({ TableName: env.DYNAMODB_TABLE_LOCATIONS, ExclusiveStartKey: startKey })
      );
      for (const item of res.Items ?? []) out.push(item as LocationRecord);
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async delete(slug: string): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new DeleteCommand({ TableName: env.DYNAMODB_TABLE_LOCATIONS, Key: { slug } })
    );
  },
};
