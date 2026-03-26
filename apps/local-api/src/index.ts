import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import { getEnv } from './config/env.js';
import { registerRoutes } from './routes/register-routes.js';
import { registerUploadLocalRoute } from './routes/uploads-local.js';
import { registerStripeWebhook } from './routes/stripe-webhook.js';
import { AdminServiceError } from './services/admin.service.js';
import { FavoriteServiceError } from './services/favorite.service.js';
import { InquiryServiceError } from './services/inquiry.service.js';
import { ListingServiceError } from './services/listing.service.js';
import { SubscriptionServiceError } from './services/subscription.service.js';
import { UploadServiceError } from './services/upload.service.js';
import { startNotificationWorker } from './workers/notification.worker.js';

const env = getEnv();
const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Upload-Token'],
  })
);

registerUploadLocalRoute(app);
registerStripeWebhook(app);
app.use(express.json());

registerRoutes(app);

app.use(
  '/uploads/public',
  express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), { index: false, fallthrough: false })
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express error handler arity
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ListingServiceError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof UploadServiceError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof FavoriteServiceError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof InquiryServiceError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof SubscriptionServiceError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof AdminServiceError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start async workers (Phase 10)
startNotificationWorker();

app.listen(env.PORT, () => {
  console.log(`Local API listening on http://localhost:${env.PORT}`);
});
