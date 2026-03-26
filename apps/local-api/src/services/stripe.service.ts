/**
 * Stripe integration service (Phase 20).
 *
 * Wraps the Stripe SDK to create PaymentIntents and verify webhook signatures.
 * Amount is provided in LKR (Sri Lankan Rupees). Stripe expects the smallest
 * currency unit — for LKR that is cents (1 LKR = 100 cents).
 */

import Stripe from 'stripe';
import { getEnv } from '../config/env.js';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;
  const env = getEnv();
  stripeInstance = new Stripe(env.STRIPE_SECRET_KEY);
  return stripeInstance;
}

export type CreateIntentParams = {
  amountRs: number;
  description: string;
  metadata: Record<string, string>;
};

/**
 * Create a Stripe PaymentIntent.
 * Returns the client_secret needed by the frontend to confirm payment.
 */
export async function createPaymentIntent(
  params: CreateIntentParams
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: params.amountRs * 100, // LKR cents
    currency: 'lkr',
    description: params.description,
    metadata: params.metadata,
    automatic_payment_methods: { enabled: true },
  });

  if (!intent.client_secret) {
    throw new Error('Stripe did not return a client secret');
  }

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}

/**
 * Verify Stripe webhook signature and parse the event.
 */
export function constructWebhookEvent(
  rawBody: Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const env = getEnv();
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

export const stripeService = { createPaymentIntent, constructWebhookEvent };
