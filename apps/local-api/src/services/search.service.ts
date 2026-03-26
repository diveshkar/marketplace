import {
  canRevealSellerEmail,
  canRevealSellerPhone,
  clipImageKeysForViewerPlan,
} from '@marketplace/shared-subscriptions';
import type {
  Listing,
  ListingDetailResponse,
  ListingSearchHit,
  ListingSellerSnapshot,
  SubscriptionPlan,
} from '@marketplace/shared-types';
import { listingRepository } from '../repositories/listing.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export type SearchFilters = {
  category?: string;
  subcategory?: string;
  city?: string;
  district?: string;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  q?: string;
};

const DEFAULT_VIEWER_PLAN: SubscriptionPlan = 'FREE';

function matchesFilters(listing: Listing, filters: SearchFilters): boolean {
  if (filters.category && listing.category.toLowerCase() !== filters.category.toLowerCase()) {
    return false;
  }
  if (filters.subcategory && (listing.subcategory ?? '').toLowerCase() !== filters.subcategory.toLowerCase()) {
    return false;
  }
  if (filters.province && (listing.province ?? '').toLowerCase() !== filters.province.toLowerCase()) {
    return false;
  }
  if (filters.district && (listing.district ?? '').toLowerCase() !== filters.district.toLowerCase()) {
    return false;
  }
  if (filters.city && listing.city.toLowerCase() !== filters.city.toLowerCase()) {
    return false;
  }
  if (filters.condition && (listing.condition ?? '') !== filters.condition) {
    return false;
  }
  if (filters.minPrice !== undefined && listing.price < filters.minPrice) {
    return false;
  }
  if (filters.maxPrice !== undefined && listing.price > filters.maxPrice) {
    return false;
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack = `${listing.title} ${listing.description}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export const searchService = {
  /**
   * Browse ACTIVE listings with optional filters.
   * Image keys are clipped based on viewer subscription plan (PLAN_v2 §7).
   */
  async search(
    filters: SearchFilters,
    viewerPlan: SubscriptionPlan | undefined
  ): Promise<ListingSearchHit[]> {
    const plan = viewerPlan ?? DEFAULT_VIEWER_PLAN;
    const all = await listingRepository.scanAll();
    const active = all.filter((l) => l.status === 'ACTIVE');
    const filtered = active.filter((l) => matchesFilters(l, filters));

    // Sort: TOP_AD first, then FEATURED, then BUMP, then by date newest first
    const promoOrder = (l: Listing): number => {
      if (l.activePromotion === 'TOP_AD') return 0;
      if (l.activePromotion === 'FEATURED') return 1;
      if (l.activePromotion === 'BUMP') return 2;
      return 3;
    };
    filtered.sort((a, b) => {
      const pa = promoOrder(a);
      const pb = promoOrder(b);
      if (pa !== pb) return pa - pb;
      return (a.publishedAt ?? a.createdAt) < (b.publishedAt ?? b.createdAt) ? 1 : -1;
    });

    // Batch-fetch seller names
    const userIds = [...new Set(filtered.map((l) => l.userId))];
    const userMap = new Map<string, string>();
    await Promise.all(
      userIds.map(async (uid) => {
        const u = await userRepository.getById(uid);
        if (u) userMap.set(uid, u.name);
      })
    );

    return filtered.map((l) => ({
      listingId: l.listingId,
      userId: l.userId,
      title: l.title,
      category: l.category,
      subcategory: l.subcategory,
      city: l.city,
      district: l.district,
      province: l.province,
      price: l.price,
      negotiable: l.negotiable,
      condition: l.condition,
      views: l.views,
      activePromotion: l.activePromotion,
      imageKeys: clipImageKeysForViewerPlan(l.imageKeys, plan),
      publishedAt: l.publishedAt,
      createdAt: l.createdAt,
      sellerName: userMap.get(l.userId) ?? 'Unknown',
    }));
  },

  /**
   * Get a single listing detail with seller info masked by viewer plan (PLAN_v2 §7).
   */
  async getDetail(
    listingId: string,
    viewerPlan: SubscriptionPlan | undefined
  ): Promise<ListingDetailResponse | null> {
    const plan = viewerPlan ?? DEFAULT_VIEWER_PLAN;
    const listing = await listingRepository.getById(listingId);
    if (!listing) return null;

    // Clip images for viewer
    const maskedListing: Listing = {
      ...listing,
      imageKeys: clipImageKeysForViewerPlan(listing.imageKeys, plan),
    };

    // Build seller snapshot
    const seller = await userRepository.getById(listing.userId);
    let sellerSnapshot: ListingSellerSnapshot | null = null;
    if (seller) {
      sellerSnapshot = {
        userId: seller.userId,
        name: seller.name,
        phone: canRevealSellerPhone(plan) && seller.phone ? seller.phone : undefined,
        email: canRevealSellerEmail(plan) ? seller.email : undefined,
      };
    }

    return {
      listing: maskedListing,
      seller: sellerSnapshot,
      viewer: { subscriptionPlan: plan },
    };
  },

  /** Return distinct filter values from active listings. */
  async facets(): Promise<{
    categories: string[];
    subcategories: string[];
    cities: string[];
    districts: string[];
    provinces: string[];
  }> {
    const all = await listingRepository.scanAll();
    const active = all.filter((l) => l.status === 'ACTIVE');
    const categories = [...new Set(active.map((l) => l.category))].sort();
    const subcategories = [...new Set(active.map((l) => l.subcategory).filter(Boolean) as string[])].sort();
    const cities = [...new Set(active.map((l) => l.city))].sort();
    const districts = [...new Set(active.map((l) => l.district).filter(Boolean) as string[])].sort();
    const provinces = [...new Set(active.map((l) => l.province).filter(Boolean) as string[])].sort();
    return { categories, subcategories, cities, districts, provinces };
  },
};
