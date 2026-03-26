import type { NextFunction, Request, Response } from 'express';
import { userRepository } from '../repositories/user.repository.js';

/**
 * Middleware that blocks SUSPENDED and BLOCKED users from performing write actions.
 * Must be used AFTER requireAuth.
 */
export async function requireActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.auth) {
    res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' });
    return;
  }

  const user = await userRepository.getById(req.auth.userId);
  if (!user) {
    res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    return;
  }

  const status = user.accountStatus ?? 'ACTIVE';
  if (status === 'BLOCKED') {
    res.status(403).json({
      error: 'Your account has been blocked. Contact support for assistance.',
      code: 'ACCOUNT_BLOCKED',
    });
    return;
  }
  if (status === 'SUSPENDED') {
    res.status(403).json({
      error: 'Your account is suspended. Some actions are restricted.',
      code: 'ACCOUNT_SUSPENDED',
    });
    return;
  }

  next();
}
