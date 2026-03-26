import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../middleware/optional-auth.js';
import { searchService } from '../services/search.service.js';

export const searchRouter = Router();

const searchQuery = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  condition: z.string().optional(),
});

searchRouter.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = searchQuery.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() });
      return;
    }
    const hits = await searchService.search(parsed.data, req.auth?.subscriptionPlan);
    res.json(hits);
  } catch (e) {
    next(e);
  }
});

searchRouter.get('/facets', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const facets = await searchService.facets();
    res.json(facets);
  } catch (e) {
    next(e);
  }
});
