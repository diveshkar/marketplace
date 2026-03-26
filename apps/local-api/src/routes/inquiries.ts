import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { requireActive } from '../middleware/require-active.js';
import { requireAuth } from '../middleware/require-auth.js';
import { InquiryServiceError, inquiryService } from '../services/inquiry.service.js';

export const inquiriesRouter = Router();

const sendBody = z.object({
  message: z.string().min(1).max(2000),
});

function handleError(err: unknown, next: NextFunction): void {
  if (err instanceof InquiryServiceError) {
    next(err);
    return;
  }
  next(err);
}

/** POST /listings/:listingId/inquiry */
inquiriesRouter.post(
  '/listings/:listingId/inquiry',
  requireAuth,
  requireActive,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = sendBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }
      const inquiry = await inquiryService.send(
        req.auth!.userId,
        req.params.listingId,
        parsed.data.message,
        req.auth!.subscriptionPlan
      );
      res.status(201).json(inquiry);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** GET /me/inquiries */
inquiriesRouter.get(
  '/me/inquiries',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await inquiryService.listMine(req.auth!.userId);
      res.json(list);
    } catch (e) {
      next(e);
    }
  }
);

/** GET /me/inbox — inquiries received on seller's listings */
inquiriesRouter.get(
  '/me/inbox',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await inquiryService.listSellerInbox(req.auth!.userId);
      res.json(list);
    } catch (e) {
      next(e);
    }
  }
);
