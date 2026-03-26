import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Conversation } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

export const conversationRepository = {
  async create(conversation: Conversation): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_CONVERSATIONS,
        Item: conversation,
        ConditionExpression: 'attribute_not_exists(conversationId)',
      })
    );
  },

  async getById(conversationId: string): Promise<Conversation | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new GetCommand({
        TableName: env.DYNAMODB_TABLE_CONVERSATIONS,
        Key: { conversationId },
      })
    );
    return (res.Item as Conversation) ?? null;
  },

  async listByBuyer(buyerUserId: string): Promise<Conversation[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: env.DYNAMODB_TABLE_CONVERSATIONS,
        IndexName: 'buyerUserId-index',
        KeyConditionExpression: 'buyerUserId = :u',
        ExpressionAttributeValues: { ':u': buyerUserId },
      })
    );
    return (res.Items as Conversation[]) ?? [];
  },

  async listBySeller(sellerUserId: string): Promise<Conversation[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: env.DYNAMODB_TABLE_CONVERSATIONS,
        IndexName: 'sellerUserId-index',
        KeyConditionExpression: 'sellerUserId = :u',
        ExpressionAttributeValues: { ':u': sellerUserId },
      })
    );
    return (res.Items as Conversation[]) ?? [];
  },

  async findByListingAndBuyer(listingId: string, buyerUserId: string): Promise<Conversation | null> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: env.DYNAMODB_TABLE_CONVERSATIONS,
        IndexName: 'listingId-index',
        KeyConditionExpression: 'listingId = :l',
        FilterExpression: 'buyerUserId = :b',
        ExpressionAttributeValues: { ':l': listingId, ':b': buyerUserId },
      })
    );
    return ((res.Items as Conversation[]) ?? [])[0] ?? null;
  },

  async updateLastMessage(
    conversationId: string,
    body: string,
    now: string,
    senderIsBuyer: boolean
  ): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const unreadField = senderIsBuyer ? 'sellerUnread' : 'buyerUnread';
    await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_CONVERSATIONS,
        Key: { conversationId },
        UpdateExpression: `SET lastMessageAt = :t, lastMessageBody = :b, ${unreadField} = ${unreadField} + :one`,
        ExpressionAttributeValues: { ':t': now, ':b': body, ':one': 1 },
      })
    );
  },

  async clearUnread(conversationId: string, isBuyer: boolean): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const field = isBuyer ? 'buyerUnread' : 'sellerUnread';
    await doc.send(
      new UpdateCommand({
        TableName: env.DYNAMODB_TABLE_CONVERSATIONS,
        Key: { conversationId },
        UpdateExpression: `SET ${field} = :zero`,
        ExpressionAttributeValues: { ':zero': 0 },
      })
    );
  },

  async setBlockedBy(conversationId: string, userId: string | undefined): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    if (userId) {
      await doc.send(
        new UpdateCommand({
          TableName: env.DYNAMODB_TABLE_CONVERSATIONS,
          Key: { conversationId },
          UpdateExpression: 'SET blockedBy = :u',
          ExpressionAttributeValues: { ':u': userId },
        })
      );
    } else {
      await doc.send(
        new UpdateCommand({
          TableName: env.DYNAMODB_TABLE_CONVERSATIONS,
          Key: { conversationId },
          UpdateExpression: 'REMOVE blockedBy',
        })
      );
    }
  },
};
