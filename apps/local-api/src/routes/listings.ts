import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../middleware/optional-auth.js';
import { requireActive } from '../middleware/require-active.js';
import { requireAuth } from '../middleware/require-auth.js';
import { ListingServiceError, listingService } from '../services/listing.service.js';
import { searchService } from '../services/search.service.js';
import { UploadServiceError, uploadService } from '../services/upload.service.js';

export const listingsRouter = Router();

const conditionEnum = z.enum(['new', 'used', 'reconditioned']);

const createBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).default(''),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  city: z.string().min(1).max(100),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  price: z.number().nonnegative(),
  negotiable: z.boolean().optional(),
  condition: conditionEnum.optional(),
  imageKeys: z.array(z.string()).max(20).optional(),
});

const patchBody = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(10000).optional(),
    category: z.string().min(1).max(100).optional(),
    subcategory: z.string().max(100).optional(),
    city: z.string().min(1).max(100).optional(),
    district: z.string().max(100).optional(),
    province: z.string().max(100).optional(),
    price: z.number().nonnegative().optional(),
    negotiable: z.boolean().optional(),
    condition: conditionEnum.optional(),
    imageKeys: z.array(z.string()).max(20).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field required' });

function handleListingError(err: unknown, next: NextFunction): void {
  if (err instanceof ListingServiceError || err instanceof UploadServiceError) {
    next(err);
    return;
  }
  next(err);
}

const uploadUrlBody = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
});

const uploadCompleteBody = z.object({
  key: z.string().min(1).max(512),
});

listingsRouter.get('/mine', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await listingService.listMine(req.auth!.userId);
    res.json(rows);
  } catch (e) {
    handleListingError(e, next);
  }
});

listingsRouter.post('/', requireAuth, requireActive, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    const listing = await listingService.create(req.auth!.userId, parsed.data);
    res.status(201).json(listing);
  } catch (e) {
    handleListingError(e, next);
  }
});

listingsRouter.post('/:listingId/upload-url', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = uploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    const out = await uploadService.createUploadUrl(req.auth!.userId, req.params.listingId, parsed.data.contentType);
    res.json(out);
  } catch (e) {
    handleListingError(e, next);
  }
});

listingsRouter.post('/:listingId/upload-complete', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = uploadCompleteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    const listing = await uploadService.completeUpload(req.auth!.userId, req.params.listingId, parsed.data.key);
    res.json(listing);
  } catch (e) {
    handleListingError(e, next);
  }
});

/** POST /listings/:listingId/view — increment view counter */
listingsRouter.post('/:listingId/view', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingRepository } = await import('../repositories/listing.repository.js');
    await listingRepository.incrementViews(req.params.listingId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

listingsRouter.get('/:listingId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const detail = await searchService.getDetail(req.params.listingId, req.auth?.subscriptionPlan);
    if (!detail) {
      res.status(404).json({ error: 'Listing not found', code: 'LISTING_NOT_FOUND' });
      return;
    }
    res.json(detail);
  } catch (e) {
    next(e);
  }
});

listingsRouter.patch('/:listingId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = patchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    const listing = await listingService.update(req.auth!.userId, req.params.listingId, parsed.data);
    res.json(listing);
  } catch (e) {
    handleListingError(e, next);
  }
});

listingsRouter.post('/:listingId/submit', requireAuth, requireActive, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await listingService.submit(req.auth!.userId, req.params.listingId);
    res.status(204).send();
  } catch (e) {
    handleListingError(e, next);
  }
});

listingsRouter.post('/:listingId/sold', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await listingService.markSold(req.auth!.userId, req.params.listingId);
    res.status(204).send();
  } catch (e) {
    handleListingError(e, next);
  }
});

listingsRouter.delete('/:listingId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await listingService.delete(req.auth!.userId, req.params.listingId);
    res.status(204).send();
  } catch (e) {
    handleListingError(e, next);
  }
});
