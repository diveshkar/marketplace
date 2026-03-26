import type { PublicUser } from '@marketplace/shared-types';
import { userRepository } from '../repositories/user.repository.js';

export const userProfileService = {
  async getMe(userId: string): Promise<PublicUser | null> {
    const row = await userRepository.getById(userId);
    if (!row) return null;
    return {
      userId: row.userId,
      email: row.email,
      name: row.name,
      role: row.role,
      subscriptionPlan: row.subscriptionPlan,
      subscriptionStatus: row.subscriptionStatus,
      subscriptionStartAt: row.subscriptionStartAt,
      subscriptionEndAt: row.subscriptionEndAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async updateMe(userId: string, input: { name: string }): Promise<PublicUser | null> {
    const now = new Date().toISOString();
    return userRepository.updateProfile({ userId, name: input.name.trim(), now });
  },
};
