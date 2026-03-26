import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock repositories & stripe ──────────────────────────────────

const mockPaymentRepo = {
  create: vi.fn(),
  getById: vi.fn(),
  listByUser: vi.fn(),
  updateStatus: vi.fn(),
  getByStripeIntentId: vi.fn(),
  listAll: vi.fn(),
};

const mockCreatePaymentIntent = vi.fn();

vi.mock('../repositories/payment.repository.js', () => ({
  paymentRepository: mockPaymentRepo,
}));

vi.mock('../services/stripe.service.js', () => ({
  stripeService: {
    createPaymentIntent: (...args: unknown[]) => mockCreatePaymentIntent(...args),
    constructWebhookEvent: vi.fn(),
  },
}));

const { paymentService } = await import('../services/payment.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('payment.service', () => {
  describe('createPaymentIntent', () => {
    it('should create a PENDING payment and return clientSecret', async () => {
      mockCreatePaymentIntent.mockResolvedValue({
        clientSecret: 'pi_test_secret',
        paymentIntentId: 'pi_test_123',
      });
      mockPaymentRepo.create.mockResolvedValue(undefined);

      const result = await paymentService.createPaymentIntent({
        userId: 'user-1',
        purpose: 'PROMOTION',
        referenceId: 'BUMP:listing-1',
        amountRs: 150,
        method: 'stripe',
        description: 'Bump Up for listing "Test"',
      });

      expect(result.clientSecret).toBe('pi_test_secret');
      expect(result.payment.status).toBe('PENDING');
      expect(result.payment.stripePaymentIntentId).toBe('pi_test_123');
      expect(result.payment.userId).toBe('user-1');
      expect(result.payment.amountRs).toBe(150);
      expect(mockPaymentRepo.create).toHaveBeenCalledOnce();
    });

    it('should pass correct metadata to Stripe', async () => {
      mockCreatePaymentIntent.mockResolvedValue({
        clientSecret: 'secret',
        paymentIntentId: 'pi_456',
      });
      mockPaymentRepo.create.mockResolvedValue(undefined);

      await paymentService.createPaymentIntent({
        userId: 'user-2',
        purpose: 'SUBSCRIPTION_UPGRADE',
        referenceId: 'GOLD',
        amountRs: 1999,
        method: 'stripe',
        description: 'Upgrade to Gold Plan',
      });

      expect(mockCreatePaymentIntent).toHaveBeenCalledWith({
        amountRs: 1999,
        description: 'Upgrade to Gold Plan',
        metadata: {
          userId: 'user-2',
          purpose: 'SUBSCRIPTION_UPGRADE',
          referenceId: 'GOLD',
        },
      });
    });
  });

  describe('completePaymentByIntentId', () => {
    it('should mark a PENDING payment as COMPLETED', async () => {
      const payment = {
        paymentId: 'pay-1',
        userId: 'user-1',
        status: 'PENDING',
        stripePaymentIntentId: 'pi_test_123',
      };
      mockPaymentRepo.getByStripeIntentId.mockResolvedValue(payment);
      mockPaymentRepo.updateStatus.mockResolvedValue(undefined);

      const result = await paymentService.completePaymentByIntentId('pi_test_123');

      expect(result).not.toBeNull();
      expect(result!.status).toBe('COMPLETED');
      expect(result!.completedAt).toBeDefined();
      expect(mockPaymentRepo.updateStatus).toHaveBeenCalledWith(
        'pay-1',
        'COMPLETED',
        expect.any(String)
      );
    });

    it('should return null if payment not found', async () => {
      mockPaymentRepo.getByStripeIntentId.mockResolvedValue(null);

      const result = await paymentService.completePaymentByIntentId('pi_unknown');
      expect(result).toBeNull();
    });

    it('should not update an already COMPLETED payment', async () => {
      const payment = {
        paymentId: 'pay-1',
        status: 'COMPLETED',
        stripePaymentIntentId: 'pi_test_123',
      };
      mockPaymentRepo.getByStripeIntentId.mockResolvedValue(payment);

      const result = await paymentService.completePaymentByIntentId('pi_test_123');
      expect(result!.status).toBe('COMPLETED');
      expect(mockPaymentRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('failPaymentByIntentId', () => {
    it('should mark a payment as FAILED', async () => {
      const payment = {
        paymentId: 'pay-2',
        status: 'PENDING',
        stripePaymentIntentId: 'pi_fail',
      };
      mockPaymentRepo.getByStripeIntentId.mockResolvedValue(payment);
      mockPaymentRepo.updateStatus.mockResolvedValue(undefined);

      const result = await paymentService.failPaymentByIntentId('pi_fail');

      expect(result!.status).toBe('FAILED');
      expect(mockPaymentRepo.updateStatus).toHaveBeenCalledWith('pay-2', 'FAILED');
    });

    it('should return null if payment not found', async () => {
      mockPaymentRepo.getByStripeIntentId.mockResolvedValue(null);

      const result = await paymentService.failPaymentByIntentId('pi_unknown');
      expect(result).toBeNull();
    });
  });

  describe('listByUser', () => {
    it('should return payments sorted by date descending', async () => {
      mockPaymentRepo.listByUser.mockResolvedValue([
        { paymentId: 'a', createdAt: '2025-01-01' },
        { paymentId: 'b', createdAt: '2025-03-01' },
        { paymentId: 'c', createdAt: '2025-02-01' },
      ]);

      const result = await paymentService.listByUser('user-1');
      expect(result.map((p) => p.paymentId)).toEqual(['b', 'c', 'a']);
    });
  });
});
