import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getEnv } from '../config/env.js';

let docClient: DynamoDBDocumentClient | null = null;

export function getDynamoDbDocumentClient(): DynamoDBDocumentClient {
  if (docClient) return docClient;
  const env = getEnv();
  const client = new DynamoDBClient({
    region: env.AWS_REGION,
    ...(env.DYNAMODB_ENDPOINT
      ? {
          endpoint: env.DYNAMODB_ENDPOINT,
          credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
        }
      : {}),
  });
  docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
  return docClient;
}

export async function dynamoPing(): Promise<void> {
  const { ListTablesCommand } = await import('@aws-sdk/client-dynamodb');
  const env = getEnv();
  const raw = new DynamoDBClient({
    region: env.AWS_REGION,
    ...(env.DYNAMODB_ENDPOINT
      ? {
          endpoint: env.DYNAMODB_ENDPOINT,
          credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
        }
      : {}),
  });
  await raw.send(new ListTablesCommand({ Limit: 1 }));
}
