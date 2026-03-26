import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import type { SellerProfile, ListingSearchHit } from '@marketplace/shared-types';
import { clipImageKeysForViewerPlan } from '@marketplace/shared-subscriptions';
import { optionalAuth } from '../middleware/optional-auth.js';
import { userRepository } from '../repositories/user.repository.js';
import { listingRepository } from '../repositories/listing.repository.js';

export const sellersRouter = Router();

/** GET /sellers/:userId — public seller profile + their ACTIVE listings */
sellersRouter.get(
  '/sellers/:userId',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userRepository.getById(req.params.userId);
      if (!user) {
        res.status(404).json({ error: 'Seller not found' });
        return;
      }

      const allListings = await listingRepository.listByUserId(req.params.userId);
      const activeListings = allListings.filter((l) => l.status === 'ACTIVE');
      activeListings.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

      const viewerPlan = req.auth?.subscriptionPlan ?? 'FREE';

      const profile: SellerProfile = {
        userId: user.userId,
        name: user.name,
        memberSince: user.createdAt,
        totalActiveListings: activeListings.length,
      };

      const listings: ListingSearchHit[] = activeListings.map((l) => ({
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
        imageKeys: clipImageKeysForViewerPlan(l.imageKeys, viewerPlan),
        publishedAt: l.publishedAt,
        createdAt: l.createdAt,
        sellerName: user.name,
      }));

      res.json({ profile, listings });
    } catch (e) {
      next(e);
    }
  }
);
