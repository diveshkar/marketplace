import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');

loadDotenv({ path: path.join(repoRoot, '.env') });
loadDotenv({ path: path.join(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['local', 'development', 'test', 'production']).default('local'),
  PORT: z.coerce.number().default(4000),
  AWS_REGION: z.string().min(1).default('ap-south-1'),
  DYNAMODB_ENDPOINT: z.string().url().optional(),
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
  UPLOAD_DIR: z.string().min(1),
  /** local: PUT binary to /uploads/local. s3: presigned PUT to bucket. */
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  S3_BUCKET: z.string().optional(),
  S3_UPLOAD_PREFIX: z.string().default('listings'),
  API_PUBLIC_URL: z.string().url().optional(),
  UPLOAD_MAX_BYTES: z.coerce.number().default(5_242_880),
  UPLOAD_URL_TTL_SEC: z.coerce.number().default(600),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('7d'),
  STRIPE_SECRET_KEY: z.string().min(1).default('sk_test_REPLACE_ME'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).default('whsec_REPLACE_ME'),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1).default('pk_test_REPLACE_ME'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  cached = parsed.data;
  return cached;
}
