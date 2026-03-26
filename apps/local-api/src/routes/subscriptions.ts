import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/require-admin.js';
import { requireAuth } from '../middleware/require-auth.js';
import { SubscriptionServiceError, subscriptionService } from '../services/subscription.service.js';

export const subscriptionsRouter = Router();

const planEnum = z.enum(['FREE', 'SILVER', 'GOLD']);

function handleError(err: unknown, next: NextFunction): void {
  if (err instanceof SubscriptionServiceError) {
    next(err);
    return;
  }
  next(err);
}

/** GET /subscription/plans — public plan catalog */
subscriptionsRouter.get('/subscription/plans', (_req: Request, res: Response) => {
  res.json(subscriptionService.getPlans());
});

/** GET /me/subscription — current user subscription info */
subscriptionsRouter.get(
  '/me/subscription',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sub = await subscriptionService.getMySubscription(req.auth!.userId);
      res.json(sub);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** POST /subscription/upgrade — upgrade to a higher plan */
subscriptionsRouter.post(
  '/subscription/upgrade',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = z.object({ plan: planEnum }).safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }
      const updated = await subscriptionService.upgrade(req.auth!.userId, parsed.data.plan);
      res.json(updated);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** POST /subscription/cancel — downgrade to FREE */
subscriptionsRouter.post(
  '/subscription/cancel',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await subscriptionService.cancel(req.auth!.userId);
      res.json(updated);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** PATCH /admin/users/:userId/subscription — admin override plan */
subscriptionsRouter.patch(
  '/admin/users/:userId/subscription',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = z.object({ plan: planEnum }).safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }
      const updated = await subscriptionService.adminSetPlan(req.params.userId, parsed.data.plan);
      res.json(updated);
    } catch (e) {
      handleError(e, next);
    }
  }
);
