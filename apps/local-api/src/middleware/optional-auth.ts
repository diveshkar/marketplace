import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';

/**
 * Like requireAuth but does NOT reject unauthenticated requests.
 * Sets req.auth when a valid Bearer token is present; leaves it undefined otherwise.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const h = req.headers.authorization;
  if (!h || typeof h !== 'string') {
    next();
    return;
  }
  const [type, token] = h.split(' ');
  if (type !== 'Bearer' || !token) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(token.trim());
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      subscriptionPlan: payload.subscriptionPlan,
    };
  } catch {
    // invalid token — treat as anonymous
  }
  next();
}
