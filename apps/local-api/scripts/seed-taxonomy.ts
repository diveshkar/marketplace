/**
 * Seeds the categories and locations DynamoDB tables from the hardcoded shared-utils data.
 * Run: npx tsx apps/local-api/scripts/seed-taxonomy.ts
 */
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, PROVINCES } from '@marketplace/shared-utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
loadDotenv({ path: path.join(repoRoot, '.env') });
loadDotenv({ path: path.join(process.cwd(), '.env') });

const region = process.env.AWS_REGION ?? 'ap-south-1';
const endpoint = process.env.DYNAMODB_ENDPOINT!;
const categoriesTable = process.env.DYNAMODB_TABLE_CATEGORIES!;
const locationsTable = process.env.DYNAMODB_TABLE_LOCATIONS!;

const raw = new DynamoDBClient({
  region,
  endpoint,
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});
const doc = DynamoDBDocumentClient.from(raw);

async function seedCategories() {
  const now = new Date().toISOString();
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    await doc.send(
      new PutCommand({
        TableName: categoriesTable,
        Item: {
          slug: cat.slug,
          name: cat.name,
          icon: cat.icon,
          subcategories: cat.subcategories,
          sortOrder: i,
          createdAt: now,
          updatedAt: now,
        },
      })
    );
    console.log(`  Category: ${cat.name} (${cat.subcategories.length} subcategories)`);
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);
}

async function seedLocations() {
  const now = new Date().toISOString();
  for (let i = 0; i < PROVINCES.length; i++) {
    const prov = PROVINCES[i];
    await doc.send(
      new PutCommand({
        TableName: locationsTable,
        Item: {
          slug: prov.slug,
          name: prov.name,
          districts: prov.districts,
          sortOrder: i,
          createdAt: now,
          updatedAt: now,
        },
      })
    );
    const cityCount = prov.districts.reduce((sum, d) => sum + d.cities.length, 0);
    console.log(`  Province: ${prov.name} (${prov.districts.length} districts, ${cityCount} cities)`);
  }
  console.log(`Seeded ${PROVINCES.length} provinces.`);
}

async function main() {
  console.log('Seeding taxonomy tables...');
  console.log(`  Categories table: ${categoriesTable}`);
  console.log(`  Locations table: ${locationsTable}`);
  console.log();
  await seedCategories();
  console.log();
  await seedLocations();
  console.log('\nTaxonomy seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
