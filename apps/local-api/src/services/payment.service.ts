import { randomUUID } from 'node:crypto';
import type { Payment, PaymentPurpose, PaymentStatus } from '@marketplace/shared-types';
import { paymentRepository } from '../repositories/payment.repository.js';
import { stripeService } from './stripe.service.js';

/**
 * Payment service — Stripe integration (Phase 20).
 *
 * Flow:
 * 1. Frontend calls create-intent → we create a PENDING Payment + Stripe PaymentIntent.
 * 2. Frontend confirms payment with Stripe Elements (card never touches our server).
 * 3. Stripe webhook fires → we mark Payment COMPLETED and fulfil the order.
 */

export type PaymentRequest = {
  userId: string;
  purpose: PaymentPurpose;
  referenceId: string;
  amountRs: number;
  method: string;
  description: string;
};

export type PaymentResult = {
  payment: Payment;
  clientSecret: string;
};

/**
 * Create a PENDING payment record and a Stripe PaymentIntent.
 * Returns the clientSecret so the frontend can confirm the payment.
 */
async function createPaymentIntent(req: PaymentRequest): Promise<PaymentResult> {
  const now = new Date().toISOString();

  // Create Stripe PaymentIntent
  const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent({
    amountRs: req.amountRs,
    description: req.description,
    metadata: {
      userId: req.userId,
      purpose: req.purpose,
      referenceId: req.referenceId,
    },
  });

  // Create PENDING payment record
  const payment: Payment = {
    paymentId: randomUUID(),
    userId: req.userId,
    purpose: req.purpose,
    referenceId: req.referenceId,
    amountRs: req.amountRs,
    status: 'PENDING' as PaymentStatus,
    method: req.method,
    description: req.description,
    createdAt: now,
    stripePaymentIntentId: paymentIntentId,
  };

  await paymentRepository.create(payment);
  return { payment, clientSecret };
}

/**
 * Called by the Stripe webhook when payment succeeds.
 * Marks the payment COMPLETED.
 */
async function completePaymentByIntentId(stripePaymentIntentId: string): Promise<Payment | null> {
  const payment = await paymentRepository.getByStripeIntentId(stripePaymentIntentId);
  if (!payment) return null;
  if (payment.status === 'COMPLETED') return payment;

  const now = new Date().toISOString();
  await paymentRepository.updateStatus(payment.paymentId, 'COMPLETED', now);
  payment.status = 'COMPLETED';
  payment.completedAt = now;
  return payment;
}

/**
 * Called by the Stripe webhook when payment fails.
 */
async function failPaymentByIntentId(stripePaymentIntentId: string): Promise<Payment | null> {
  const payment = await paymentRepository.getByStripeIntentId(stripePaymentIntentId);
  if (!payment) return null;

  await paymentRepository.updateStatus(payment.paymentId, 'FAILED');
  payment.status = 'FAILED';
  return payment;
}

async function listByUser(userId: string): Promise<Payment[]> {
  const payments = await paymentRepository.listByUser(userId);
  return payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function getById(paymentId: string): Promise<Payment | null> {
  return paymentRepository.getById(paymentId);
}

export const paymentService = {
  createPaymentIntent,
  completePaymentByIntentId,
  failPaymentByIntentId,
  listByUser,
  getById,
};
