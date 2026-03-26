import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
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
});

async function putIfNotExists(
  doc: DynamoDBDocumentClient,
  table: string,
  item: Record<string, unknown>,
  keyAttr: string
) {
  try {
    await doc.send(
      new PutCommand({
        TableName: table,
        Item: item,
        ConditionExpression: `attribute_not_exists(${keyAttr})`,
      })
    );
    return true;
  } catch (e) {
    if (e instanceof ConditionalCheckFailedException) return false;
    throw e;
  }
}

async function main() {
  const env = envSchema.parse(process.env);
  const client = new DynamoDBClient({
    region: env.AWS_REGION,
    endpoint: env.DYNAMODB_ENDPOINT,
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  });
  const doc = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash('demo12345', 10);

  // --- Users ---
  const demoUser1 = {
    userId: 'demo-user-1',
    email: 'demo@example.local',
    name: 'Demo User',
    phone: '+94771234567',
    passwordHash,
    role: 'USER',
    subscriptionPlan: 'FREE',
    subscriptionStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  const silverUser = {
    userId: 'demo-user-silver',
    email: 'silver@example.local',
    name: 'Silver Seller',
    phone: '+94779876543',
    passwordHash,
    role: 'USER',
    subscriptionPlan: 'SILVER',
    subscriptionStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  const goldUser = {
    userId: 'demo-user-gold',
    email: 'gold@example.local',
    name: 'Gold Dealer',
    phone: '+94775551234',
    passwordHash,
    role: 'USER',
    subscriptionPlan: 'GOLD',
    subscriptionStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  const adminUser = {
    userId: 'demo-admin',
    email: 'admin@example.local',
    name: 'Admin',
    passwordHash,
    role: 'ADMIN',
    subscriptionPlan: 'GOLD',
    subscriptionStatus: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  for (const u of [demoUser1, silverUser, goldUser, adminUser]) {
    const created = await putIfNotExists(doc, env.DYNAMODB_TABLE_USERS, u, 'userId');
    console.log(created ? `Seeded user ${u.email}` : `User ${u.email} already exists`);
  }

  // --- Listings (ACTIVE so they appear in browse) ---
  const listings = [
    {
      listingId: 'seed-listing-1',
      userId: silverUser.userId,
      title: 'iPhone 14 Pro Max — Like New',
      description: 'Used for 3 months, comes with box and charger. No scratches.',
      category: 'Electronics',
      city: 'Colombo',
      price: 185000,
      status: 'ACTIVE',
      imageKeys: [],
      isFeatured: false,
      visibilityTier: 'STANDARD',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    },
    {
      listingId: 'seed-listing-2',
      userId: goldUser.userId,
      title: 'Toyota Aqua 2018 — Full Option',
      description: 'Well maintained, first owner. Low mileage 45,000 km.',
      category: 'Vehicles',
      city: 'Kandy',
      price: 7500000,
      status: 'ACTIVE',
      imageKeys: [],
      isFeatured: true,
      visibilityTier: 'PREMIUM',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    },
    {
      listingId: 'seed-listing-3',
      userId: silverUser.userId,
      title: '3-Bedroom House for Rent',
      description: 'Spacious house in quiet neighborhood. Close to schools and shops.',
      category: 'Property',
      city: 'Galle',
      price: 45000,
      status: 'ACTIVE',
      imageKeys: [],
      isFeatured: false,
      visibilityTier: 'STANDARD',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    },
    {
      listingId: 'seed-listing-4',
      userId: goldUser.userId,
      title: 'Gaming PC — RTX 4070, 32GB RAM',
      description: 'Custom built gaming rig. Runs all AAA titles at max settings.',
      category: 'Electronics',
      city: 'Colombo',
      price: 450000,
      status: 'ACTIVE',
      imageKeys: [],
      isFeatured: false,
      visibilityTier: 'STANDARD',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    },
    {
      listingId: 'seed-listing-5',
      userId: demoUser1.userId,
      title: 'Wooden Dining Table — 6 Seater',
      description: 'Teak wood, good condition. Selling due to relocation.',
      category: 'Furniture',
      city: 'Negombo',
      price: 35000,
      status: 'ACTIVE',
      imageKeys: [],
      isFeatured: false,
      visibilityTier: 'STANDARD',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    },
    {
      listingId: 'seed-listing-pending-1',
      userId: silverUser.userId,
      title: 'Samsung Galaxy S24 Ultra — Brand New',
      description: 'Sealed box. 512GB. International warranty.',
      category: 'Electronics',
      city: 'Colombo',
      price: 295000,
      status: 'PENDING',
      imageKeys: [],
      isFeatured: false,
      visibilityTier: 'STANDARD',
      createdAt: now,
      updatedAt: now,
    },
    {
      listingId: 'seed-listing-pending-2',
      userId: goldUser.userId,
      title: 'Honda Civic 2020 — Low Mileage',
      description: 'Single owner, full service history. 30,000 km only.',
      category: 'Vehicles',
      city: 'Kandy',
      price: 12500000,
      status: 'PENDING',
      imageKeys: [],
      isFeatured: false,
      visibilityTier: 'STANDARD',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const l of listings) {
    const created = await putIfNotExists(doc, env.DYNAMODB_TABLE_LISTINGS, l, 'listingId');
    console.log(created ? `Seeded listing "${l.title}"` : `Listing "${l.title}" already exists`);
  }

  // --- Sample favorite (silver user favorites listing 5) ---
  const sampleFav = {
    userId: silverUser.userId,
    listingId: 'seed-listing-5',
    createdAt: now,
  };
  await doc.send(new PutCommand({ TableName: env.DYNAMODB_TABLE_FAVORITES, Item: sampleFav }));
  console.log('Seeded sample favorite.');

  // --- Sample inquiry (demo user inquires on listing 1) ---
  const sampleInquiry = {
    inquiryId: `seed-inquiry-${randomUUID().slice(0, 8)}`,
    listingId: 'seed-listing-1',
    buyerUserId: demoUser1.userId,
    message: 'Hi, is this still available? Can you do a small discount?',
    createdAt: now,
  };
  await putIfNotExists(doc, env.DYNAMODB_TABLE_INQUIRIES, sampleInquiry, 'inquiryId');
  console.log('Seeded sample inquiry.');

  // --- Sample report (demo user reports listing 2 as suspicious) ---
  const sampleReport = {
    reportId: 'seed-report-1',
    listingId: 'seed-listing-2',
    reporterUserId: demoUser1.userId,
    reason: 'Price seems too low for this vehicle, might be a scam listing.',
    status: 'OPEN',
    createdAt: now,
  };
  await putIfNotExists(doc, env.DYNAMODB_TABLE_REPORTS, sampleReport, 'reportId');
  console.log('Seeded sample report.');

  console.log('\nSeed complete. Demo accounts (password: demo12345):');
  console.log('  FREE:   demo@example.local');
  console.log('  SILVER: silver@example.local');
  console.log('  GOLD:   gold@example.local');
  console.log('  ADMIN:  admin@example.local');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
