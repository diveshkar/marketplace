import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { apiFetch } from './api-client';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Lazy-load the Stripe.js instance.
 * Fetches the publishable key from the API on first call.
 */
export function getStripe(): Promise<Stripe | null> {
  if (stripePromise) return stripePromise;

  stripePromise = apiFetch('/payments/config')
    .then((res) => res.json())
    .then((data: { publishableKey: string }) => loadStripe(data.publishableKey));

  return stripePromise;
}
