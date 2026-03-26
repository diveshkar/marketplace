import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { FavoriteServiceError, favoriteService } from '../services/favorite.service.js';

export const favoritesRouter = Router();

function handleError(err: unknown, next: NextFunction): void {
  if (err instanceof FavoriteServiceError) {
    next(err);
    return;
  }
  next(err);
}

/** POST /listings/:listingId/favorite */
favoritesRouter.post(
  '/listings/:listingId/favorite',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fav = await favoriteService.add(
        req.auth!.userId,
        req.params.listingId,
        req.auth!.subscriptionPlan
      );
      res.status(201).json(fav);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** DELETE /listings/:listingId/favorite */
favoritesRouter.delete(
  '/listings/:listingId/favorite',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await favoriteService.remove(
        req.auth!.userId,
        req.params.listingId,
        req.auth!.subscriptionPlan
      );
      res.status(204).send();
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** GET /me/favorites */
favoritesRouter.get(
  '/me/favorites',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await favoriteService.listMine(req.auth!.userId);
      res.json(list);
    } catch (e) {
      next(e);
    }
  }
);
