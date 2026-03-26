import { isUpgrade, PLAN_CATALOG, type PlanInfo } from '@marketplace/shared-subscriptions';
import type { PublicUser, SubscriptionPlan } from '@marketplace/shared-types';
import { userRepository } from '../repositories/user.repository.js';

export class SubscriptionServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'SubscriptionServiceError';
  }
}

export const subscriptionService = {
  getPlans(): PlanInfo[] {
    return PLAN_CATALOG;
  },

  async getMySubscription(userId: string): Promise<PublicUser> {
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new SubscriptionServiceError('User not found', 404, 'USER_NOT_FOUND');
    }
    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartAt: user.subscriptionStartAt,
      subscriptionEndAt: user.subscriptionEndAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  async upgrade(userId: string, targetPlan: SubscriptionPlan): Promise<PublicUser> {
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new SubscriptionServiceError('User not found', 404, 'USER_NOT_FOUND');
    }
    if (user.subscriptionPlan === targetPlan) {
      throw new SubscriptionServiceError('Already on this plan', 400, 'SAME_PLAN');
    }
    if (!isUpgrade(user.subscriptionPlan, targetPlan)) {
      throw new SubscriptionServiceError(
        `Cannot upgrade from ${user.subscriptionPlan} to ${targetPlan}`,
        400,
        'NOT_AN_UPGRADE'
      );
    }
    // MVP: no billing — just assign the plan
    const now = new Date().toISOString();
    const updated = await userRepository.updateSubscription({
      userId,
      plan: targetPlan,
      status: 'ACTIVE',
      now,
    });
    if (!updated) {
      throw new SubscriptionServiceError('Update failed', 500, 'UPDATE_FAILED');
    }
    return updated;
  },

  async cancel(userId: string): Promise<PublicUser> {
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new SubscriptionServiceError('User not found', 404, 'USER_NOT_FOUND');
    }
    if (user.subscriptionPlan === 'FREE') {
      throw new SubscriptionServiceError('Cannot cancel FREE plan', 400, 'ALREADY_FREE');
    }
    // MVP: cancel = downgrade to FREE
    const now = new Date().toISOString();
    const updated = await userRepository.updateSubscription({
      userId,
      plan: 'FREE',
      status: 'ACTIVE',
      now,
    });
    if (!updated) {
      throw new SubscriptionServiceError('Update failed', 500, 'UPDATE_FAILED');
    }
    return updated;
  },

  /** Admin override — set any plan on any user (PLAN_v2 §6 — manual assignment). */
  async adminSetPlan(
    targetUserId: string,
    plan: SubscriptionPlan
  ): Promise<PublicUser> {
    const user = await userRepository.getById(targetUserId);
    if (!user) {
      throw new SubscriptionServiceError('User not found', 404, 'USER_NOT_FOUND');
    }
    const now = new Date().toISOString();
    const updated = await userRepository.updateSubscription({
      userId: targetUserId,
      plan,
      status: 'ACTIVE',
      now,
    });
    if (!updated) {
      throw new SubscriptionServiceError('Update failed', 500, 'UPDATE_FAILED');
    }
    return updated;
  },
};
