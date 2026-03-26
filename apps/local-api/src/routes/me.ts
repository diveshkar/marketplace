import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { userProfileService } from '../services/user-profile.service.js';

export const meRouter = Router();

const patchBody = z.object({
  name: z.string().min(1).max(200),
});

meRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth!.userId;
    const user = await userProfileService.getMe(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }
    res.json(user);
  } catch (e) {
    next(e);
  }
});

meRouter.patch('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = patchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    const userId = req.auth!.userId;
    const updated = await userProfileService.updateMe(userId, parsed.data);
    if (!updated) {
      res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }
    res.json(updated);
  } catch (e) {
    next(e);
  }
});
