import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { requireActive } from '../middleware/require-active.js';
import { requireAuth } from '../middleware/require-auth.js';
import { adminService } from '../services/admin.service.js';

export const reportsRouter = Router();

const reportBodySchema = z.object({
  reason: z.string().min(5).max(500),
});

/** POST /listings/:listingId/report — any authenticated user can report a listing */
reportsRouter.post(
  '/listings/:listingId/report',
  requireAuth,
  requireActive,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = reportBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }
      const report = await adminService.createReport({
        listingId: req.params.listingId,
        reporterUserId: req.auth!.userId,
        reason: parsed.data.reason,
      });
      res.status(201).json(report);
    } catch (e) {
      next(e);
    }
  }
);
