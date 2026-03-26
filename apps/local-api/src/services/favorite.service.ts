import { canUseFavorites } from '@marketplace/shared-subscriptions';
import type { Favorite, Listing, SubscriptionPlan } from '@marketplace/shared-types';
import { favoriteRepository } from '../repositories/favorite.repository.js';
import { listingRepository } from '../repositories/listing.repository.js';

export class FavoriteServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'FavoriteServiceError';
  }
}

export const favoriteService = {
  async add(userId: string, listingId: string, plan: SubscriptionPlan): Promise<Favorite> {
    if (!canUseFavorites(plan)) {
      throw new FavoriteServiceError(
        'Favorites require SILVER or GOLD plan',
        403,
        'PLAN_RESTRICTION'
      );
    }
    const listing = await listingRepository.getById(listingId);
    if (!listing || listing.status !== 'ACTIVE') {
      throw new FavoriteServiceError('Listing not found or not active', 404, 'LISTING_NOT_FOUND');
    }
    const now = new Date().toISOString();
    const fav: Favorite = { userId, listingId, createdAt: now };
    await favoriteRepository.put(fav);
    return fav;
  },

  async remove(userId: string, listingId: string, plan: SubscriptionPlan): Promise<void> {
    if (!canUseFavorites(plan)) {
      throw new FavoriteServiceError(
        'Favorites require SILVER or GOLD plan',
        403,
        'PLAN_RESTRICTION'
      );
    }
    const deleted = await favoriteRepository.delete(userId, listingId);
    if (!deleted) {
      throw new FavoriteServiceError('Favorite not found', 404, 'NOT_FOUND');
    }
  },

  async listMine(
    userId: string
  ): Promise<(Favorite & { listing: Pick<Listing, 'title' | 'city' | 'price' | 'status'> | null })[]> {
    const favs = await favoriteRepository.listByUserId(userId);
    // Sort newest first
    favs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return Promise.all(
      favs.map(async (f) => {
        const listing = await listingRepository.getById(f.listingId);
        return {
          ...f,
          listing: listing
            ? { title: listing.title, city: listing.city, price: listing.price, status: listing.status }
            : null,
        };
      })
    );
  },

  async isFavorited(userId: string, listingId: string): Promise<boolean> {
    return favoriteRepository.exists(userId, listingId);
  },
};
