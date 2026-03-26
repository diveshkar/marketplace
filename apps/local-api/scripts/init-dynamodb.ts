import {
  CreateTableCommand,
  DynamoDBClient,
  ListTablesCommand,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb';
import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
loadDotenv({ path: path.join(repoRoot, '.env') });
loadDotenv({ path: path.join(process.cwd(), '.env') });

const envSchema = z.object({
  AWS_REGION: z.string().min(1).default('ap-south-1'),
  DYNAMODB_ENDPOINT: z.string().url(),
  DYNAMODB_TABLE_USERS: z.string().min(1),
  DYNAMODB_TABLE_LISTINGS: z.string().min(1),
  DYNAMODB_TABLE_FAVORITES: z.string().min(1),
  DYNAMODB_TABLE_INQUIRIES: z.string().min(1),
  DYNAMODB_TABLE_REPORTS: z.string().min(1),
  DYNAMODB_TABLE_SUBSCRIPTIONS: z.string().min(1),
  DYNAMODB_TABLE_NOTIFICATIONS: z.string().min(1),
  DYNAMODB_TABLE_CONVERSATIONS: z.string().min(1),
  DYNAMODB_TABLE_MESSAGES: z.string().min(1),
  DYNAMODB_TABLE_PROMOTIONS: z.string().min(1),
  DYNAMODB_TABLE_PAYMENTS: z.string().min(1),
  DYNAMODB_TABLE_ACTIVITY_LOGS: z.string().min(1),
  DYNAMODB_TABLE_CATEGORIES: z.string().min(1),
  DYNAMODB_TABLE_LOCATIONS: z.string().min(1),
});

function client() {
  const env = envSchema.parse(process.env);
  return new DynamoDBClient({
    region: env.AWS_REGION,
    endpoint: env.DYNAMODB_ENDPOINT,
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  });
}

async function ensureUsersTable(dynamo: DynamoDBClient, name: string) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'email', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'email-index',
            KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log(`Created table ${name} (with email-index GSI)`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(`Table ${name} already exists (if created before Phase 3, delete it locally to add email-index)`);
      return;
    }
    throw e;
  }
}

async function ensureListingsTable(dynamo: DynamoDBClient, name: string) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [{ AttributeName: 'listingId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'listingId', AttributeType: 'S' },
          { AttributeName: 'userId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'userId-index',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' },
              { AttributeName: 'listingId', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log(`Created table ${name} (with userId-index GSI)`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(
        `Table ${name} already exists (if created before Phase 4, delete it locally to add userId-index)`
      );
      return;
    }
    throw e;
  }
}

async function ensureTable(
  dynamo: DynamoDBClient,
  name: string,
  keySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[],
  attributeDefinitions: { AttributeName: string; AttributeType: 'S' | 'N' | 'B' }[]
) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        KeySchema: keySchema,
        AttributeDefinitions: attributeDefinitions,
        BillingMode: 'PAY_PER_REQUEST',
      })
    );
    console.log(`Created table ${name}`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(`Table ${name} already exists`);
      return;
    }
    throw e;
  }
}

async function ensureInquiriesTable(dynamo: DynamoDBClient, name: string) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [{ AttributeName: 'inquiryId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'inquiryId', AttributeType: 'S' },
          { AttributeName: 'buyerUserId', AttributeType: 'S' },
          { AttributeName: 'listingId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'buyerUserId-index',
            KeySchema: [
              { AttributeName: 'buyerUserId', KeyType: 'HASH' },
              { AttributeName: 'inquiryId', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
          {
            IndexName: 'listingId-index',
            KeySchema: [
              { AttributeName: 'listingId', KeyType: 'HASH' },
              { AttributeName: 'inquiryId', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log(`Created table ${name} (with buyerUserId-index and listingId-index GSIs)`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(
        `Table ${name} already exists (if created before Phase 7, delete it locally to add GSIs, then db:init)`
      );
      return;
    }
    throw e;
  }
}

async function ensureConversationsTable(dynamo: DynamoDBClient, name: string) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [{ AttributeName: 'conversationId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'conversationId', AttributeType: 'S' },
          { AttributeName: 'buyerUserId', AttributeType: 'S' },
          { AttributeName: 'sellerUserId', AttributeType: 'S' },
          { AttributeName: 'listingId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'buyerUserId-index',
            KeySchema: [
              { AttributeName: 'buyerUserId', KeyType: 'HASH' },
              { AttributeName: 'conversationId', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
          {
            IndexName: 'sellerUserId-index',
            KeySchema: [
              { AttributeName: 'sellerUserId', KeyType: 'HASH' },
              { AttributeName: 'conversationId', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
          {
            IndexName: 'listingId-index',
            KeySchema: [
              { AttributeName: 'listingId', KeyType: 'HASH' },
              { AttributeName: 'conversationId', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log(`Created table ${name} (with buyer/seller/listing GSIs)`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(`Table ${name} already exists`);
      return;
    }
    throw e;
  }
}

async function ensureMessagesTable(dynamo: DynamoDBClient, name: string) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          { AttributeName: 'conversationId', KeyType: 'HASH' },
          { AttributeName: 'messageId', KeyType: 'RANGE' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'conversationId', AttributeType: 'S' },
          { AttributeName: 'messageId', AttributeType: 'S' },
        ],
      })
    );
    console.log(`Created table ${name}`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(`Table ${name} already exists`);
      return;
    }
    throw e;
  }
}

async function ensurePromotionsTable(dynamo: DynamoDBClient, name: string) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [{ AttributeName: 'promotionId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'promotionId', AttributeType: 'S' },
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'listingId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'userId-index',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' },
              { AttributeName: 'promotionId', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
          {
            IndexName: 'listingId-index',
            KeySchema: [
              { AttributeName: 'listingId', KeyType: 'HASH' },
              { AttributeName: 'promotionId', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log(`Created table ${name} (with userId/listingId GSIs)`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(`Table ${name} already exists`);
      return;
    }
    throw e;
  }
}

async function ensurePaymentsTable(dynamo: DynamoDBClient, name: string) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [{ AttributeName: 'paymentId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'paymentId', AttributeType: 'S' },
          { AttributeName: 'userId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'userId-index',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' },
              { AttributeName: 'paymentId', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log(`Created table ${name} (with userId GSI)`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(`Table ${name} already exists`);
      return;
    }
    throw e;
  }
}

async function ensureActivityLogsTable(dynamo: DynamoDBClient, name: string) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [{ AttributeName: 'logId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'logId', AttributeType: 'S' },
          { AttributeName: 'adminUserId', AttributeType: 'S' },
          { AttributeName: 'createdAt', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'adminUserId-createdAt-index',
            KeySchema: [
              { AttributeName: 'adminUserId', KeyType: 'HASH' },
              { AttributeName: 'createdAt', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log(`Created table ${name} (with adminUserId-createdAt GSI)`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(`Table ${name} already exists`);
      return;
    }
    throw e;
  }
}

async function ensureCategoriesTable(dynamo: DynamoDBClient, name: string) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [{ AttributeName: 'slug', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'slug', AttributeType: 'S' },
        ],
      })
    );
    console.log(`Created table ${name}`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(`Table ${name} already exists`);
      return;
    }
    throw e;
  }
}

async function ensureLocationsTable(dynamo: DynamoDBClient, name: string) {
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [{ AttributeName: 'slug', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'slug', AttributeType: 'S' },
        ],
      })
    );
    console.log(`Created table ${name}`);
  } catch (e) {
    if (e instanceof ResourceInUseException) {
      console.log(`Table ${name} already exists`);
      return;
    }
    throw e;
  }
}

async function main() {
  const env = envSchema.parse(process.env);
  const dynamo = client();
  const listed = await dynamo.send(new ListTablesCommand({}));
  console.log('Existing tables:', listed.TableNames?.join(', ') || '(none)');

  await ensureUsersTable(dynamo, env.DYNAMODB_TABLE_USERS);

  await ensureListingsTable(dynamo, env.DYNAMODB_TABLE_LISTINGS);

  await ensureTable(
    dynamo,
    env.DYNAMODB_TABLE_FAVORITES,
    [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'listingId', KeyType: 'RANGE' },
    ],
    [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'listingId', AttributeType: 'S' },
    ]
  );

  await ensureInquiriesTable(dynamo, env.DYNAMODB_TABLE_INQUIRIES);

  await ensureTable(
    dynamo,
    env.DYNAMODB_TABLE_REPORTS,
    [{ AttributeName: 'reportId', KeyType: 'HASH' }],
    [{ AttributeName: 'reportId', AttributeType: 'S' }]
  );

  await ensureTable(
    dynamo,
    env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    [{ AttributeName: 'subscriptionId', KeyType: 'HASH' }],
    [{ AttributeName: 'subscriptionId', AttributeType: 'S' }]
  );

  await ensureTable(
    dynamo,
    env.DYNAMODB_TABLE_NOTIFICATIONS,
    [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'notificationId', KeyType: 'RANGE' },
    ],
    [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'notificationId', AttributeType: 'S' },
    ]
  );

  await ensureConversationsTable(dynamo, env.DYNAMODB_TABLE_CONVERSATIONS);

  await ensureMessagesTable(dynamo, env.DYNAMODB_TABLE_MESSAGES);

  await ensurePromotionsTable(dynamo, env.DYNAMODB_TABLE_PROMOTIONS);

  await ensurePaymentsTable(dynamo, env.DYNAMODB_TABLE_PAYMENTS);

  await ensureActivityLogsTable(dynamo, env.DYNAMODB_TABLE_ACTIVITY_LOGS);
  await ensureCategoriesTable(dynamo, env.DYNAMODB_TABLE_CATEGORIES);
  await ensureLocationsTable(dynamo, env.DYNAMODB_TABLE_LOCATIONS);

  console.log('DynamoDB Local tables are ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
