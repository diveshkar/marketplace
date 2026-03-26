import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { PublicUser, SubscriptionPlan, SubscriptionStatus, UserAccountStatus, UserRole } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

const EMAIL_INDEX = 'email-index';

export type UserRecord = PublicUser & { passwordHash: string };

function toPublic(u: UserRecord): PublicUser {
  return {
    userId: u.userId,
    email: u.email,
    name: u.name,
    ...(u.phone !== undefined ? { phone: u.phone } : {}),
    role: u.role,
    accountStatus: u.accountStatus,
    subscriptionPlan: u.subscriptionPlan,
    subscriptionStatus: u.subscriptionStatus,
    subscriptionStartAt: u.subscriptionStartAt,
    subscriptionEndAt: u.subscriptionEndAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export const userRepository = {
  async create(input: {
    userId: string;
    email: string;
    name: string;
    phone?: string;
    passwordHash: string;
    role: UserRole;
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    now: string;
  }): Promise<PublicUser> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const item: UserRecord = {
      userId: input.userId,
      email: input.email,
      name: input.name,
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      passwordHash: input.passwordHash,
      role: input.role,
      subscriptionPlan: input.subscriptionPlan,
      subscriptionStatus: input.subscriptionStatus,
      createdAt: input.now,
      updatedAt: input.now,
    };
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_USERS,
        Item: item,
        ConditionExpression: 'attribute_not_exists(userId)',
      })
    );
    return toPublic(item);
  },

  async findByEmail(email: string): Promise<UserRecord | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: env.DYNAMODB_TABLE_USERS,
        IndexName: EMAIL_INDEX,
        KeyConditionExpression: 'email = :e',
        ExpressionAttributeValues: { ':e': email },
        Limit: 1,
      })
    );
    const row = res.Items?.[0] as UserRecord | undefined;
    return row ?? null;
  },

  async getById(userId: string): Promise<UserRecord | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new GetCommand({
        TableName: env.DYNAMODB_TABLE_USERS,
        Key: { userId },
      })
    );
    if (!res.Item) return null;
    return res.Item as UserRecord;
  },

  async updateSubscription(input: {
    userId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    now: string;
  }): Promise<PublicUser | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_USERS,
        Key: { userId: input.userId },
        UpdateExpression:
          'SET subscriptionPlan = :p, subscriptionStatus = :s, subscriptionStartAt = :start, updatedAt = :u',
        ExpressionAttributeValues: {
          ':p': input.plan,
          ':s': input.status,
          ':start': input.now,
          ':u': input.now,
        },
        ConditionExpression: 'attribute_exists(userId)',
        ReturnValues: 'ALL_NEW',
      })
    );
    if (!res.Attributes) return null;
    return toPublic(res.Attributes as UserRecord);
  },

  async updateProfile(input: {
    userId: string;
    name: string;
    now: string;
  }): Promise<PublicUser | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_USERS,
        Key: { userId: input.userId },
        UpdateExpression: 'SET #n = :name, updatedAt = :u',
        ExpressionAttributeNames: { '#n': 'name' },
        ExpressionAttributeValues: { ':name': input.name, ':u': input.now },
        ConditionExpression: 'attribute_exists(userId)',
        ReturnValues: 'ALL_NEW',
      })
    );
    if (!res.Attributes) return null;
    return toPublic(res.Attributes as UserRecord);
  },

  /** Full table scan — admin only, low-traffic MVP. */
  async scanAll(): Promise<PublicUser[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: PublicUser[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new ScanCommand({
          TableName: env.DYNAMODB_TABLE_USERS,
          ExclusiveStartKey: startKey,
        })
      );
      for (const item of res.Items ?? []) {
        out.push(toPublic(item as UserRecord));
      }
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out;
  },

  async updateAccountStatus(input: {
    userId: string;
    accountStatus: UserAccountStatus;
    now: string;
  }): Promise<PublicUser | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_USERS,
        Key: { userId: input.userId },
        UpdateExpression: 'SET accountStatus = :s, updatedAt = :u',
        ExpressionAttributeValues: { ':s': input.accountStatus, ':u': input.now },
        ConditionExpression: 'attribute_exists(userId)',
        ReturnValues: 'ALL_NEW',
      })
    );
    if (!res.Attributes) return null;
    return toPublic(res.Attributes as UserRecord);
  },
};
