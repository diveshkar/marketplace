import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { notificationRepository } from '../repositories/notification.repository.js';

export const notificationsRouter = Router();

/** GET /me/notifications — list current user's notifications (newest first) */
notificationsRouter.get(
  '/me/notifications',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await notificationRepository.listByUserId(req.auth!.userId);
      res.json(notifications);
    } catch (e) {
      next(e);
    }
  }
);

/** POST /me/notifications/:notificationId/read — mark one notification as read */
notificationsRouter.post(
  '/me/notifications/:notificationId/read',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await notificationRepository.markRead(req.auth!.userId, req.params.notificationId);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

/** POST /me/notifications/read-all — mark all notifications as read */
notificationsRouter.post(
  '/me/notifications/read-all',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await notificationRepository.markAllRead(req.auth!.userId);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);
