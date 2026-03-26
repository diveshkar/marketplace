import type { SubscriptionPlan, UserRole } from '@marketplace/shared-types';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        role: UserRole;
        subscriptionPlan: SubscriptionPlan;
      };
    }
  }
}

export {};
