import type { Request, Response } from 'express';
import { Router } from 'express';
import { CATEGORIES, PROVINCES } from '@marketplace/shared-utils';
import { taxonomyService } from '../services/taxonomy.service.js';

export const taxonomyRouter = Router();

/** GET /taxonomy/categories — full category tree (from DynamoDB, fallback to hardcoded) */
taxonomyRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const dbCategories = await taxonomyService.listCategories();
    if (dbCategories.length > 0) {
      res.json(
        dbCategories.map((c) => ({
          slug: c.slug,
          name: c.name,
          icon: c.icon,
          subcategories: c.subcategories,
        }))
      );
      return;
    }
  } catch {
    // fall through to hardcoded
  }
  res.json(CATEGORIES);
});

/** GET /taxonomy/locations — full province/district/city tree (from DynamoDB, fallback to hardcoded) */
taxonomyRouter.get('/locations', async (_req: Request, res: Response) => {
  try {
    const dbLocations = await taxonomyService.listLocations();
    if (dbLocations.length > 0) {
      res.json(
        dbLocations.map((l) => ({
          slug: l.slug,
          name: l.name,
          districts: l.districts,
        }))
      );
      return;
    }
  } catch {
    // fall through to hardcoded
  }
  res.json(PROVINCES);
});
