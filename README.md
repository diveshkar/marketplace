# Marketplace

A full-featured classifieds marketplace (similar to Ikman.lk) built as a monorepo with pnpm workspaces.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Express + TypeScript
- **Database:** DynamoDB (Local for dev, AWS for prod)
- **Payments:** Stripe (embedded CardElement + PaymentIntents)
- **Infra:** Terraform (AWS), GitHub Actions CI/CD

## Project Structure

```
apps/
  web/            # React frontend (port 5173)
  local-api/      # Express API (port 4000)
packages/
  shared-types/   # Shared TypeScript types
  shared-utils/   # Shared utilities (categories, locations)
  shared-subscriptions/  # Subscription plan definitions
infra/
  terraform/      # AWS infrastructure (staging + prod)
docker/
  dynamodb-local/ # Docker Compose for DynamoDB Local
```

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm@9`)
- **Java** 11+ (for DynamoDB Local JAR)
- **Docker** (optional, alternative for DynamoDB Local)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/diveshkar/marketplace.git
cd marketplace
pnpm install
```

### 2. Environment setup

```bash
cp .env.example .env
```

Edit `.env` and set your values. The defaults work for local development except for Stripe keys (optional for non-payment features):

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Any random string for signing tokens | Yes |
| `STRIPE_SECRET_KEY` | Stripe `sk_test_...` key | For payments |
| `STRIPE_PUBLISHABLE_KEY` | Stripe `pk_test_...` key | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe `whsec_...` key | For payments |

### 3. Start DynamoDB Local

**Option A: Using the bundled JAR (requires Java)**

```bash
java -Djava.library.path=./dynamoDbLocal/DynamoDBLocal_lib -jar ./dynamoDbLocal/DynamoDBLocal.jar -sharedDb -port 8000
```

**Option B: Using Docker**

```bash
pnpm docker:up
```

### 4. Initialize and seed the database

```bash
pnpm db:init
pnpm db:seed
```

To seed categories and locations:

```bash
pnpm --filter @marketplace/local-api db:seed-taxonomy
```

### 5. Run the app

```bash
pnpm dev:lite
```

This starts both:
- API at **http://localhost:4000**
- Web at **http://localhost:5173**

Or run everything (init + seed + dev) in one command:

```bash
pnpm local:up
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:lite` | Start API + Web concurrently |
| `pnpm dev:api` | Start API only |
| `pnpm dev:web` | Start Web only |
| `pnpm local:up` | Init DB + seed + start both |
| `pnpm db:init` | Create DynamoDB tables |
| `pnpm db:seed` | Seed sample data |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript check (API + Web) |
| `pnpm build:web` | Production build of frontend |
| `pnpm format` | Format code with Prettier |

## Stripe Testing (Local)

1. Get your test keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Add them to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. For webhook testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:4000/webhooks/stripe
   ```
   Copy the `whsec_...` secret it prints and set `STRIPE_WEBHOOK_SECRET` in `.env`.

4. Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## License

See [LICENSE.txt](LICENSE.txt) and [THIRD-PARTY-LICENSES.txt](THIRD-PARTY-LICENSES.txt).
