import type { Request, Response } from 'express';
import express from 'express';
import { stripeService } from '../services/stripe.service.js';
import { paymentService } from '../services/payment.service.js';
import { promotionService } from '../services/promotion.service.js';
import { subscriptionService } from '../services/subscription.service.js';

/**
 * Stripe webhook endpoint (Phase 20).
 *
 * IMPORTANT: This route must be registered BEFORE express.json() middleware
 * because Stripe requires the raw request body for signature verification.
 */
export function registerStripeWebhook(app: express.Application): void {
  app.post(
    '/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const signature = req.headers['stripe-signature'];
      if (!signature || typeof signature !== 'string') {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
      }

      let event;
      try {
        event = stripeService.constructWebhookEvent(req.body as Buffer, signature);
      } catch (err) {
        console.error('[stripe-webhook] Signature verification failed:', err);
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }

      try {
        switch (event.type) {
          case 'payment_intent.succeeded': {
            const intent = event.data.object;
            const payment = await paymentService.completePaymentByIntentId(intent.id);
            if (payment) {
              console.log('[stripe-webhook] Payment completed:', payment.paymentId);
              await fulfilOrder(payment.purpose, payment.userId, payment.referenceId);
            }
            break;
          }

          case 'payment_intent.payment_failed': {
            const intent = event.data.object;
            const payment = await paymentService.failPaymentByIntentId(intent.id);
            if (payment) {
              console.log('[stripe-webhook] Payment failed:', payment.paymentId);
            }
            break;
          }

          default:
            // Ignore other events
            break;
        }
      } catch (err) {
        console.error('[stripe-webhook] Error processing event:', err);
      }

      // Always respond 200 to acknowledge receipt
      res.status(200).json({ received: true });
    }
  );
}

/**
 * Fulfil the order after payment succeeds.
 * Routes to the appropriate service based on payment purpose.
 */
async function fulfilOrder(purpose: string, userId: string, referenceId: string): Promise<void> {
  switch (purpose) {
    case 'PROMOTION':
      await promotionService.fulfilPromotion(userId, referenceId);
      console.log('[stripe-webhook] Promotion fulfilled:', referenceId);
      break;

    case 'SUBSCRIPTION_UPGRADE': {
      // referenceId is the target plan (SILVER or GOLD)
      const plan = referenceId as 'SILVER' | 'GOLD';
      await subscriptionService.upgrade(userId, plan);
      console.log('[stripe-webhook] Subscription upgraded to', plan, 'for user', userId);
      break;
    }

    default:
      console.warn('[stripe-webhook] Unknown payment purpose:', purpose);
  }
}
