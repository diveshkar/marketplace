import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { promotionService } from '../services/promotion.service.js';
import { paymentService } from '../services/payment.service.js';
import { getEnv } from '../config/env.js';

export const promotionsRouter = Router();

const promotionTypeEnum = z.enum(['BUMP', 'FEATURED', 'TOP_AD']);
const subscriptionPlanEnum = z.enum(['SILVER', 'GOLD']);

/** GET /payments/config — expose Stripe publishable key to the frontend */
promotionsRouter.get('/payments/config', (_req: Request, res: Response) => {
  const env = getEnv();
  res.json({ publishableKey: env.STRIPE_PUBLISHABLE_KEY });
});

/** GET /promotions/plans — public promotion plan catalog */
promotionsRouter.get('/promotions/plans', (_req: Request, res: Response) => {
  res.json(promotionService.getPromotionPlans());
});

/** GET /promotions/subscription-plans — public subscription upgrade catalog */
promotionsRouter.get('/promotions/subscription-plans', (_req: Request, res: Response) => {
  res.json(promotionService.getSubscriptionUpgradePlans());
});

/**
 * POST /promotions/purchase — initiate promotion purchase.
 * Creates a Stripe PaymentIntent and returns clientSecret.
 */
promotionsRouter.post(
  '/promotions/purchase',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = z
        .object({
          listingId: z.string().min(1),
          type: promotionTypeEnum,
        })
        .safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }

      const result = await promotionService.initiatePromotionPurchase(
        req.auth!.userId,
        parsed.data.listingId,
        parsed.data.type
      );

      res.status(201).json(result);
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ error: e.message });
        return;
      }
      next(e);
    }
  }
);

/**
 * POST /promotions/upgrade-subscription — initiate subscription upgrade.
 * Creates a Stripe PaymentIntent and returns clientSecret.
 */
promotionsRouter.post(
  '/promotions/upgrade-subscription',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = z
        .object({
          plan: subscriptionPlanEnum,
        })
        .safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }

      const result = await promotionService.initiateSubscriptionUpgrade(
        req.auth!.userId,
        parsed.data.plan
      );

      res.status(201).json(result);
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json({ error: e.message });
        return;
      }
      next(e);
    }
  }
);

/** GET /me/promotions — list my promotions */
promotionsRouter.get(
  '/me/promotions',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const promos = await promotionService.listByUser(req.auth!.userId);
      res.json(promos);
    } catch (e) {
      next(e);
    }
  }
);

/** GET /me/payments — billing history */
promotionsRouter.get(
  '/me/payments',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payments = await paymentService.listByUser(req.auth!.userId);
      res.json(payments);
    } catch (e) {
      next(e);
    }
  }
);
