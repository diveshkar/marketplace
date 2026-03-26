import { randomUUID } from 'node:crypto';
import type {
  Promotion,
  PromotionPlan,
  PromotionType,
  SubscriptionPlan,
  SubscriptionUpgradePlan,
} from '@marketplace/shared-types';
import { promotionRepository } from '../repositories/promotion.repository.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { paymentService, type PaymentRequest } from './payment.service.js';

// ── Pricing plans ────────────────────────────────────────────────

const PROMOTION_PLANS: PromotionPlan[] = [
  {
    type: 'BUMP',
    label: 'Bump Up',
    description: 'Push your listing to the top of search results instantly.',
    priceRs: 150,
    durationDays: 1,
  },
  {
    type: 'FEATURED',
    label: 'Featured Ad',
    description: 'Highlighted in search results with a "Featured" badge for 7 days.',
    priceRs: 500,
    durationDays: 7,
  },
  {
    type: 'TOP_AD',
    label: 'Top Ad',
    description: 'Pinned at the top of category pages for 14 days.',
    priceRs: 1000,
    durationDays: 14,
  },
];

const SUBSCRIPTION_UPGRADE_PLANS: SubscriptionUpgradePlan[] = [
  {
    plan: 'SILVER',
    label: 'Silver Plan',
    priceRs: 999,
    period: 'month',
    features: [
      'See seller phone numbers',
      'Up to 20 active listings',
      'Priority in search results',
    ],
  },
  {
    plan: 'GOLD',
    label: 'Gold Plan',
    priceRs: 1999,
    period: 'month',
    features: [
      'Everything in Silver',
      'Unlimited active listings',
      'See seller email addresses',
      'Featured seller badge',
    ],
  },
];

// ── Queries ──────────────────────────────────────────────────────

function getPromotionPlans(): PromotionPlan[] {
  return PROMOTION_PLANS;
}

function getSubscriptionUpgradePlans(): SubscriptionUpgradePlan[] {
  return SUBSCRIPTION_UPGRADE_PLANS;
}

function getPlanByType(type: PromotionType): PromotionPlan | undefined {
  return PROMOTION_PLANS.find((p) => p.type === type);
}

async function listByUser(userId: string): Promise<Promotion[]> {
  const promos = await promotionRepository.listByUser(userId);
  return promos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function listByListing(listingId: string): Promise<Promotion[]> {
  return promotionRepository.listByListing(listingId);
}

// ── Purchase promotion (Stripe flow) ─────────────────────────────

/**
 * Step 1: Validate and create a Stripe PaymentIntent.
 * The promotion is NOT created yet — it will be created in the webhook
 * callback after payment succeeds.
 */
async function initiatePromotionPurchase(
  userId: string,
  listingId: string,
  type: PromotionType
): Promise<{ clientSecret: string; paymentId: string }> {
  const plan = getPlanByType(type);
  if (!plan) throw new Error('Invalid promotion type');

  const listing = await listingRepository.getById(listingId);
  if (!listing) throw new Error('Listing not found');
  if (listing.userId !== userId) throw new Error('You do not own this listing');
  if (listing.status !== 'ACTIVE') throw new Error('Listing must be ACTIVE to promote');

  const existing = await promotionRepository.listByListing(listingId);
  const activeConflict = existing.find(
    (p) => p.type === type && p.status === 'ACTIVE' && new Date(p.expiresAt) > new Date()
  );
  if (activeConflict) throw new Error(`Listing already has an active ${type} promotion`);

  const payReq: PaymentRequest = {
    userId,
    purpose: 'PROMOTION',
    referenceId: `${type}:${listingId}`,
    amountRs: plan.priceRs,
    method: 'stripe',
    description: `${plan.label} for listing "${listing.title}"`,
  };

  const { payment, clientSecret } = await paymentService.createPaymentIntent(payReq);
  return { clientSecret, paymentId: payment.paymentId };
}

/**
 * Step 2 (webhook callback): Create the promotion after payment confirmed.
 * referenceId format: "TYPE:listingId"
 */
async function fulfilPromotion(userId: string, referenceId: string): Promise<void> {
  const [typeStr, listingId] = referenceId.split(':');
  const type = typeStr as PromotionType;
  const plan = getPlanByType(type);
  if (!plan || !listingId) return;

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

  const promotion: Promotion = {
    promotionId: randomUUID(),
    listingId,
    userId,
    type,
    status: 'ACTIVE',
    priceRs: plan.priceRs,
    startAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  await promotionRepository.create(promotion);
  await updateListingActivePromotion(listingId);
}

// ── Subscription upgrade (Stripe flow) ───────────────────────────

async function initiateSubscriptionUpgrade(
  userId: string,
  targetPlan: SubscriptionPlan
): Promise<{ clientSecret: string; paymentId: string }> {
  const upgradePlan = SUBSCRIPTION_UPGRADE_PLANS.find((p) => p.plan === targetPlan);
  if (!upgradePlan) throw new Error('Invalid subscription plan');

  const payReq: PaymentRequest = {
    userId,
    purpose: 'SUBSCRIPTION_UPGRADE',
    referenceId: targetPlan,
    amountRs: upgradePlan.priceRs,
    method: 'stripe',
    description: `Upgrade to ${upgradePlan.label}`,
  };

  const { payment, clientSecret } = await paymentService.createPaymentIntent(payReq);
  return { clientSecret, paymentId: payment.paymentId };
}

// ── Helpers ──────────────────────────────────────────────────────

async function updateListingActivePromotion(listingId: string): Promise<void> {
  const promos = await promotionRepository.listByListing(listingId);
  const now = new Date();
  const active = promos.filter((p) => p.status === 'ACTIVE' && new Date(p.expiresAt) > now);

  const priority: PromotionType[] = ['TOP_AD', 'FEATURED', 'BUMP'];
  let best: PromotionType | undefined;
  for (const t of priority) {
    if (active.some((p) => p.type === t)) {
      best = t;
      break;
    }
  }

  await listingRepository.setActivePromotion(listingId, best);
}

async function expirePromotions(): Promise<number> {
  return 0;
}

export const promotionService = {
  getPromotionPlans,
  getSubscriptionUpgradePlans,
  listByUser,
  listByListing,
  initiatePromotionPurchase,
  fulfilPromotion,
  initiateSubscriptionUpgrade,
  purchasePromotion: initiatePromotionPurchase,
  purchaseSubscriptionUpgrade: initiateSubscriptionUpgrade,
  expirePromotions,
  updateListingActivePromotion,
};
