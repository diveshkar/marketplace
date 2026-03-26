import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Message } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { getDynamoDbDocumentClient } from '../db/dynamodb-client.js';

export const messageRepository = {
  async create(message: Message): Promise<void> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    await doc.send(
      new PutCommand({
        TableName: env.DYNAMODB_TABLE_MESSAGES,
        Item: message,
      })
    );
  },

  async listByConversation(conversationId: string): Promise<Message[]> {
    const env = getEnv();
    const doc = getDynamoDbDocumentClient();
    const out: Message[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await doc.send(
        new QueryCommand({
          TableName: env.DYNAMODB_TABLE_MESSAGES,
          KeyConditionExpression: 'conversationId = :c',
          ExpressionAttributeValues: { ':c': conversationId },
          ScanIndexForward: true,
          ExclusiveStartKey: startKey,
        })
      );
      for (const item of res.Items ?? []) {
        out.push(item as Message);
      }
      startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);
    return out;
  },
};
