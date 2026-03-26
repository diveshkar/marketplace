import { Router } from 'express';
import { dynamoPing } from '../db/dynamodb-client.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  try {
    await dynamoPing();
    res.json({ ok: true, dynamodb: 'ok' as const });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    res.status(503).json({ ok: false, dynamodb: 'error' as const, error: message });
  }
});
