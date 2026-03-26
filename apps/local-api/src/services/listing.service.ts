import { randomUUID } from 'node:crypto';
import {
  canCreateListing,
  listingStatusCountsTowardLimit,
  maxImagesForPlan,
  maxListingsForPlan,
} from '@marketplace/shared-subscriptions';
import type { Listing, ListingStatus } from '@marketplace/shared-types';
import { listingRepository } from '../repositories/listing.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export class ListingServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ListingServiceError';
  }
}

function assertOwner(listing: Listing, userId: string): void {
  if (listing.userId !== userId) {
    throw new ListingServiceError('Forbidden', 403, 'NOT_OWNER');
  }
}

const EDITABLE_STATUSES: ListingStatus[] = ['DRAFT', 'PENDING'];

export const listingService = {
  async create(
    userId: string,
    input: {
      title: string;
      description: string;
      category: string;
      subcategory?: string;
      city: string;
      district?: string;
      province?: string;
      price: number;
      negotiable?: boolean;
      condition?: 'new' | 'used' | 'reconditioned';
      imageKeys?: string[];
    }
  ): Promise<Listing> {
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new ListingServiceError('User not found', 404, 'USER_NOT_FOUND');
    }
    const existing = await listingRepository.listByUserId(userId);
    const toward = existing.filter((l) => listingStatusCountsTowardLimit(l.status)).length;
    if (!canCreateListing(user.subscriptionPlan, toward)) {
      throw new ListingServiceError(
        `Listing limit reached for ${user.subscriptionPlan} (max ${maxListingsForPlan(user.subscriptionPlan)})`,
        403,
        'LISTING_LIMIT'
      );
    }
    const maxImg = maxImagesForPlan(user.subscriptionPlan);
    if (input.imageKeys && input.imageKeys.length > maxImg) {
      throw new ListingServiceError(
        `At most ${maxImg} images for ${user.subscriptionPlan}`,
        400,
        'IMAGE_LIMIT'
      );
    }
    const now = new Date().toISOString();
    const listing: Listing = {
      listingId: randomUUID(),
      userId,
      title: input.title,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory,
      city: input.city,
      district: input.district,
      province: input.province,
      price: input.price,
      negotiable: input.negotiable,
      condition: input.condition,
      views: 0,
      status: 'DRAFT',
      imageKeys: input.imageKeys ?? [],
      isFeatured: false,
      visibilityTier: 'STANDARD',
      createdAt: now,
      updatedAt: now,
    };
    await listingRepository.create(listing);
    return listing;
  },

  async getById(listingId: string): Promise<Listing | null> {
    return listingRepository.getById(listingId);
  },

  async listMine(userId: string): Promise<Listing[]> {
    const rows = await listingRepository.listByUserId(userId);
    rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return rows;
  },

  async update(
    userId: string,
    listingId: string,
    patch: Partial<{
      title: string;
      description: string;
      category: string;
      subcategory: string;
      city: string;
      district: string;
      province: string;
      price: number;
      negotiable: boolean;
      condition: 'new' | 'used' | 'reconditioned';
      imageKeys: string[];
    }>
  ): Promise<Listing> {
    const listing = await listingRepository.getById(listingId);
    if (!listing) {
      throw new ListingServiceError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    assertOwner(listing, userId);
    if (!EDITABLE_STATUSES.includes(listing.status)) {
      throw new ListingServiceError('Listing cannot be edited in this status', 400, 'INVALID_STATUS');
    }
    if (patch.imageKeys !== undefined) {
      const user = await userRepository.getById(userId);
      if (!user) {
        throw new ListingServiceError('User not found', 404, 'USER_NOT_FOUND');
      }
      const maxImg = maxImagesForPlan(user.subscriptionPlan);
      if (patch.imageKeys.length > maxImg) {
        throw new ListingServiceError(
          `At most ${maxImg} images for ${user.subscriptionPlan}`,
          400,
          'IMAGE_LIMIT'
        );
      }
    }
    const next: Listing = {
      ...listing,
      ...patch,
      listingId: listing.listingId,
      userId: listing.userId,
      status: listing.status,
      updatedAt: new Date().toISOString(),
    };
    await listingRepository.put(next);
    return next;
  },

  async submit(userId: string, listingId: string): Promise<void> {
    const listing = await listingRepository.getById(listingId);
    if (!listing) {
      throw new ListingServiceError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    assertOwner(listing, userId);
    if (listing.status !== 'DRAFT') {
      throw new ListingServiceError('Only DRAFT listings can be submitted', 400, 'INVALID_TRANSITION');
    }
    const now = new Date().toISOString();
    await listingRepository.transitionStatus({
      listingId,
      userId,
      from: 'DRAFT',
      to: 'PENDING',
      now,
    });
  },

  async delete(userId: string, listingId: string): Promise<void> {
    const listing = await listingRepository.getById(listingId);
    if (!listing) {
      throw new ListingServiceError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    assertOwner(listing, userId);
    const deletable: ListingStatus[] = ['DRAFT', 'REJECTED', 'SOLD'];
    if (!deletable.includes(listing.status)) {
      throw new ListingServiceError(
        'Only DRAFT, REJECTED, or SOLD listings can be deleted',
        400,
        'INVALID_STATUS'
      );
    }
    await listingRepository.delete(listingId, userId);
  },

  async markSold(userId: string, listingId: string): Promise<void> {
    const listing = await listingRepository.getById(listingId);
    if (!listing) {
      throw new ListingServiceError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    assertOwner(listing, userId);
    if (listing.status !== 'ACTIVE') {
      throw new ListingServiceError('Only ACTIVE listings can be marked sold', 400, 'INVALID_TRANSITION');
    }
    const now = new Date().toISOString();
    await listingRepository.transitionStatus({
      listingId,
      userId,
      from: 'ACTIVE',
      to: 'SOLD',
      now,
    });
  },
};
