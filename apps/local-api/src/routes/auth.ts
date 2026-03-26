import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';

export const authRouter = Router();

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(200),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  const parsed = registerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    return;
  }
  try {
    const out = await authService.register(parsed.data);
    res.status(201).json({
      accessToken: out.accessToken,
      tokenType: 'Bearer',
      user: out.user,
    });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'EMAIL_IN_USE') {
      res.status(409).json({ error: err.message, code: err.code });
      return;
    }
    next(e);
  }
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    return;
  }
  try {
    const out = await authService.login(parsed.data);
    res.json({
      accessToken: out.accessToken,
      tokenType: 'Bearer',
      user: out.user,
    });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: err.message, code: err.code });
      return;
    }
    next(e);
  }
});
