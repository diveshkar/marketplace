import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/require-admin.js';
import { requireAuth } from '../middleware/require-auth.js';
import { AdminServiceError, adminService } from '../services/admin.service.js';
import { activityLogService } from '../services/activity-log.service.js';
import { taxonomyService } from '../services/taxonomy.service.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

function handleError(err: unknown, next: NextFunction): void {
  next(err);
}

// ── Listing moderation ───────────────────────────────────────────

/** GET /admin/listings/pending */
adminRouter.get(
  '/admin/listings/pending',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const listings = await adminService.listPendingListings();
      res.json(listings);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** GET /admin/listings/search?status=&category=&userId=&q= */
adminRouter.get(
  '/admin/listings/search',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listings = await adminService.searchListings({
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        userId: req.query.userId as string | undefined,
        q: req.query.q as string | undefined,
      });
      res.json(listings);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** POST /admin/listings/:listingId/approve */
adminRouter.post(
  '/admin/listings/:listingId/approve',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.approveListing(req.params.listingId);
      await activityLogService.log({
        adminUserId: req.auth!.userId,
        adminName: req.auth!.email,
        action: 'APPROVE_LISTING',
        targetType: 'LISTING',
        targetId: req.params.listingId,
        details: 'Approved listing',
      });
      res.json({ ok: true });
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** POST /admin/listings/:listingId/reject */
adminRouter.post(
  '/admin/listings/:listingId/reject',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.rejectListing(req.params.listingId);
      await activityLogService.log({
        adminUserId: req.auth!.userId,
        adminName: req.auth!.email,
        action: 'REJECT_LISTING',
        targetType: 'LISTING',
        targetId: req.params.listingId,
        details: 'Rejected listing',
      });
      res.json({ ok: true });
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** POST /admin/listings/bulk — { listingIds: string[], action: 'approve' | 'reject' } */
adminRouter.post(
  '/admin/listings/bulk',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = z
        .object({
          listingIds: z.array(z.string().min(1)).min(1).max(50),
          action: z.enum(['approve', 'reject']),
        })
        .safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }
      const result = await adminService.bulkModerateListings(
        parsed.data.listingIds,
        parsed.data.action
      );
      await activityLogService.log({
        adminUserId: req.auth!.userId,
        adminName: req.auth!.email,
        action: `BULK_${parsed.data.action.toUpperCase()}_LISTINGS`,
        targetType: 'LISTING',
        targetId: parsed.data.listingIds.join(','),
        details: `Bulk ${parsed.data.action}: ${result.success} succeeded, ${result.failed} failed`,
      });
      res.json(result);
    } catch (e) {
      handleError(e, next);
    }
  }
);

// ── User management ──────────────────────────────────────────────

/** GET /admin/users?q=&plan=&status=&role= */
adminRouter.get(
  '/admin/users',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await adminService.searchUsers({
        q: req.query.q as string | undefined,
        plan: req.query.plan as string | undefined,
        status: req.query.status as string | undefined,
        role: req.query.role as string | undefined,
      });
      res.json(users);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** GET /admin/users/:userId — user detail */
adminRouter.get(
  '/admin/users/:userId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const detail = await adminService.getUserDetail(req.params.userId);
      res.json(detail);
    } catch (e) {
      handleError(e, next);
    }
  }
);

const accountStatusSchema = z.object({
  accountStatus: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED']),
});

/** PATCH /admin/users/:userId/status */
adminRouter.patch(
  '/admin/users/:userId/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = accountStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }
      const updated = await adminService.setAccountStatus(
        req.params.userId,
        parsed.data.accountStatus
      );
      await activityLogService.log({
        adminUserId: req.auth!.userId,
        adminName: req.auth!.email,
        action: `SET_USER_${parsed.data.accountStatus}`,
        targetType: 'USER',
        targetId: req.params.userId,
        details: `Set user account status to ${parsed.data.accountStatus}`,
      });
      res.json(updated);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** POST /admin/users/bulk-status — { userIds: string[], accountStatus } */
adminRouter.post(
  '/admin/users/bulk-status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = z
        .object({
          userIds: z.array(z.string().min(1)).min(1).max(50),
          accountStatus: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED']),
        })
        .safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }
      const result = await adminService.bulkSetUserStatus(
        parsed.data.userIds,
        parsed.data.accountStatus
      );
      await activityLogService.log({
        adminUserId: req.auth!.userId,
        adminName: req.auth!.email,
        action: `BULK_SET_USER_${parsed.data.accountStatus}`,
        targetType: 'USER',
        targetId: parsed.data.userIds.join(','),
        details: `Bulk set ${parsed.data.accountStatus}: ${result.success} succeeded, ${result.failed} failed`,
      });
      res.json(result);
    } catch (e) {
      handleError(e, next);
    }
  }
);

// ── Reports ──────────────────────────────────────────────────────

/** GET /admin/reports */
adminRouter.get(
  '/admin/reports',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const reports = await adminService.listReports();
      res.json(reports);
    } catch (e) {
      handleError(e, next);
    }
  }
);

const resolveReportSchema = z.object({
  status: z.enum(['REVIEWED', 'DISMISSED']),
});

/** PATCH /admin/reports/:reportId */
adminRouter.patch(
  '/admin/reports/:reportId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = resolveReportSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }
      const updated = await adminService.resolveReport(
        req.params.reportId,
        parsed.data.status,
        req.auth!.userId
      );
      await activityLogService.log({
        adminUserId: req.auth!.userId,
        adminName: req.auth!.email,
        action: `REPORT_${parsed.data.status}`,
        targetType: 'REPORT',
        targetId: req.params.reportId,
        details: `Marked report as ${parsed.data.status}`,
      });
      res.json(updated);
    } catch (e) {
      handleError(e, next);
    }
  }
);

// ── Usage stats ──────────────────────────────────────────────────

/** GET /admin/stats */
adminRouter.get(
  '/admin/stats',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await adminService.getUsageStats();
      res.json(stats);
    } catch (e) {
      handleError(e, next);
    }
  }
);

// ── Activity logs ────────────────────────────────────────────────

/** GET /admin/activity-logs */
adminRouter.get(
  '/admin/activity-logs',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await activityLogService.listAll();
      res.json(logs);
    } catch (e) {
      handleError(e, next);
    }
  }
);

// ── Taxonomy management ──────────────────────────────────────────

/** GET /admin/categories */
adminRouter.get('/admin/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await taxonomyService.listCategories());
  } catch (e) { handleError(e, next); }
});

const categoryBody = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  icon: z.string().max(10).default(''),
  subcategories: z.array(z.object({
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(100),
  })).default([]),
  sortOrder: z.coerce.number().int().default(0),
});

/** POST /admin/categories — create or update */
adminRouter.post('/admin/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = categoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    const cat = await taxonomyService.upsertCategory(parsed.data);
    await activityLogService.log({
      adminUserId: req.auth!.userId,
      adminName: req.auth!.email,
      action: 'UPSERT_CATEGORY',
      targetType: 'CATEGORY',
      targetId: parsed.data.slug,
      details: `Saved category "${parsed.data.name}"`,
    });
    res.json(cat);
  } catch (e) { handleError(e, next); }
});

/** DELETE /admin/categories/:slug */
adminRouter.delete('/admin/categories/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await taxonomyService.deleteCategory(req.params.slug);
    await activityLogService.log({
      adminUserId: req.auth!.userId,
      adminName: req.auth!.email,
      action: 'DELETE_CATEGORY',
      targetType: 'CATEGORY',
      targetId: req.params.slug,
      details: `Deleted category "${req.params.slug}"`,
    });
    res.json({ ok: true });
  } catch (e) { handleError(e, next); }
});

/** GET /admin/locations */
adminRouter.get('/admin/locations', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await taxonomyService.listLocations());
  } catch (e) { handleError(e, next); }
});

const locationBody = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  districts: z.array(z.object({
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(100),
    cities: z.array(z.object({
      slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
      name: z.string().min(1).max(100),
    })).default([]),
  })).default([]),
  sortOrder: z.coerce.number().int().default(0),
});

/** POST /admin/locations — create or update */
adminRouter.post('/admin/locations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = locationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    const loc = await taxonomyService.upsertLocation(parsed.data);
    await activityLogService.log({
      adminUserId: req.auth!.userId,
      adminName: req.auth!.email,
      action: 'UPSERT_LOCATION',
      targetType: 'LOCATION',
      targetId: parsed.data.slug,
      details: `Saved location "${parsed.data.name}"`,
    });
    res.json(loc);
  } catch (e) { handleError(e, next); }
});

/** DELETE /admin/locations/:slug */
adminRouter.delete('/admin/locations/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await taxonomyService.deleteLocation(req.params.slug);
    await activityLogService.log({
      adminUserId: req.auth!.userId,
      adminName: req.auth!.email,
      action: 'DELETE_LOCATION',
      targetType: 'LOCATION',
      targetId: req.params.slug,
      details: `Deleted location "${req.params.slug}"`,
    });
    res.json({ ok: true });
  } catch (e) { handleError(e, next); }
});
