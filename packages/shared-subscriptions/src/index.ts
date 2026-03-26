import type { ListingStatus, SubscriptionPlan } from '@marketplace/shared-types';

/** Plan catalog returned by GET /subscription/plans (PLAN_v2 §7). */
export type PlanInfo = {
  plan: SubscriptionPlan;
  label: string;
  maxListings: number;
  maxImagesPerListing: number;
  dailyInquiries: number;
  favorites: boolean;
  sellerPhoneReveal: boolean;
  sellerEmailReveal: boolean;
  featuredListings: boolean;
  bumpListing: boolean;
};

export const PLAN_CATALOG: PlanInfo[] = [
  {
    plan: 'FREE',
    label: 'Free',
    maxListings: 3,
    maxImagesPerListing: 3,
    dailyInquiries: 3,
    favorites: false,
    sellerPhoneReveal: false,
    sellerEmailReveal: false,
    featuredListings: false,
    bumpListing: false,
  },
  {
    plan: 'SILVER',
    label: 'Silver',
    maxListings: 25,
    maxImagesPerListing: 8,
    dailyInquiries: 15,
    favorites: true,
    sellerPhoneReveal: true,
    sellerEmailReveal: false,
    featuredListings: false,
    bumpListing: true,
  },
  {
    plan: 'GOLD',
    label: 'Gold',
    maxListings: 100,
    maxImagesPerListing: 15,
    dailyInquiries: 50,
    favorites: true,
    sellerPhoneReveal: true,
    sellerEmailReveal: true,
    featuredListings: true,
    bumpListing: true,
  },
];

const PLAN_ORDER: Record<SubscriptionPlan, number> = { FREE: 0, SILVER: 1, GOLD: 2 };

export function isUpgrade(from: SubscriptionPlan, to: SubscriptionPlan): boolean {
  return PLAN_ORDER[to] > PLAN_ORDER[from];
}

export function isDowngrade(from: SubscriptionPlan, to: SubscriptionPlan): boolean {
  return PLAN_ORDER[to] < PLAN_ORDER[from];
}

/** Max listings in DRAFT + PENDING + ACTIVE (PLAN_v2 §7 — listing limits). */
export function maxListingsForPlan(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'FREE':
      return 3;
    case 'SILVER':
      return 25;
    case 'GOLD':
      return 100;
  }
}

export function listingStatusCountsTowardLimit(status: ListingStatus): boolean {
  return status === 'DRAFT' || status === 'PENDING' || status === 'ACTIVE';
}

export function canCreateListing(plan: SubscriptionPlan, currentCountTowardLimit: number): boolean {
  return currentCountTowardLimit < maxListingsForPlan(plan);
}

/** Max images per listing (PLAN_v2 §7 — Image Limits). */
export function maxImagesForPlan(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'FREE':
      return 3;
    case 'SILVER':
      return 8;
    case 'GOLD':
      return 15;
  }
}

export function canAddMoreImages(plan: SubscriptionPlan, currentImageCount: number): boolean {
  return currentImageCount < maxImagesForPlan(plan);
}

/** FREE viewers see at most 2 images on browse/detail (PLAN_v2 §7 — FREE listing view). */
export function clipImageKeysForViewerPlan(
  imageKeys: string[] | undefined,
  viewerPlan: SubscriptionPlan
): string[] {
  const keys = imageKeys ?? [];
  if (viewerPlan === 'FREE') return keys.slice(0, 2);
  return [...keys];
}

export function canRevealSellerPhone(viewerPlan: SubscriptionPlan): boolean {
  return viewerPlan === 'SILVER' || viewerPlan === 'GOLD';
}

export function canRevealSellerEmail(viewerPlan: SubscriptionPlan): boolean {
  return viewerPlan === 'GOLD';
}

/** Daily inquiry send limit (PLAN_v2 §7 — Inquiry/contact limits). */
export function maxDailyInquiriesForPlan(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'FREE':
      return 3;
    case 'SILVER':
      return 15;
    case 'GOLD':
      return 50;
  }
}

export function canSendInquiry(plan: SubscriptionPlan, todayCount: number): boolean {
  return todayCount < maxDailyInquiriesForPlan(plan);
}

/** Whether the plan allows using the favorites feature (PLAN_v2 §7 — SILVER+). */
export function canUseFavorites(plan: SubscriptionPlan): boolean {
  return plan === 'SILVER' || plan === 'GOLD';
}
