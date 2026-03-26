import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { SubscriptionPlan, UserRole } from '@marketplace/shared-types';
import { signAccessToken } from '../lib/jwt.js';
import { userRepository } from '../repositories/user.repository.js';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const authService = {
  async register(input: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ accessToken: string; user: import('@marketplace/shared-types').PublicUser }> {
    const email = normalizeEmail(input.email);
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email already registered');
      (err as NodeJS.ErrnoException).code = 'EMAIL_IN_USE';
      throw err;
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const now = new Date().toISOString();
    const userId = randomUUID();
    const role: UserRole = 'USER';
    const subscriptionPlan: SubscriptionPlan = 'FREE';
    const user = await userRepository.create({
      userId,
      email,
      name: input.name.trim(),
      passwordHash,
      role,
      subscriptionPlan,
      subscriptionStatus: 'ACTIVE',
      now,
    });
    const accessToken = signAccessToken({
      sub: user.userId,
      email: user.email,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
    });
    return { accessToken, user };
  },

  async login(input: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string; user: import('@marketplace/shared-types').PublicUser }> {
    const email = normalizeEmail(input.email);
    const row = await userRepository.findByEmail(email);
    if (!row) {
      const err = new Error('Invalid email or password');
      (err as NodeJS.ErrnoException).code = 'INVALID_CREDENTIALS';
      throw err;
    }
    const ok = await bcrypt.compare(input.password, row.passwordHash);
    if (!ok) {
      const err = new Error('Invalid email or password');
      (err as NodeJS.ErrnoException).code = 'INVALID_CREDENTIALS';
      throw err;
    }
    const accessToken = signAccessToken({
      sub: row.userId,
      email: row.email,
      role: row.role,
      subscriptionPlan: row.subscriptionPlan,
    });
    const user = {
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
    return { accessToken, user };
  },
};
