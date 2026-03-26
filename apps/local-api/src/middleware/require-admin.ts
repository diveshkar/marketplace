import type { NextFunction, Request, Response } from 'express';

/** Must be used AFTER requireAuth. Rejects non-ADMIN users. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' });
    return;
  }
  if (req.auth.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required', code: 'NOT_ADMIN' });
    return;
  }
  next();
}
