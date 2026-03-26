import type { Express } from 'express';
import { adminRouter } from './admin.js';
import { authRouter } from './auth.js';
import { favoritesRouter } from './favorites.js';
import { healthRouter } from './health.js';
import { inquiriesRouter } from './inquiries.js';
import { listingsRouter } from './listings.js';
import { meRouter } from './me.js';
import { notificationsRouter } from './notifications.js';
import { reportsRouter } from './reports.js';
import { searchRouter } from './search.js';
import { subscriptionsRouter } from './subscriptions.js';
import { conversationsRouter } from './conversations.js';
import { taxonomyRouter } from './taxonomy.js';
import { promotionsRouter } from './promotions.js';
import { sellersRouter } from './sellers.js';

/**
 * Domain route registration (PLAN_v2 — local route registration strategy).
 * Raw body upload (`PUT /uploads/local`) is registered in `index.ts` before `express.json()`.
 */
export function registerRoutes(app: Express): void {
  app.use(healthRouter);
  app.use('/auth', authRouter);
  app.use(meRouter);
  app.use('/listings', listingsRouter);
  app.use('/search', searchRouter);
  app.use('/taxonomy', taxonomyRouter);
  app.use(favoritesRouter);
  app.use(inquiriesRouter);
  app.use(subscriptionsRouter);
  app.use(reportsRouter);
  app.use(notificationsRouter);
  app.use(conversationsRouter);
  app.use(sellersRouter);
  app.use(promotionsRouter);
  app.use(adminRouter);
}
