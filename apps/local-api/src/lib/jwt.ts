import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import type { SubscriptionPlan, UserRole } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  const env = getEnv();
  const signOptions: SignOptions = {
    subject: payload.sub,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  const secret: Secret = env.JWT_SECRET;
  return jwt.sign(
    {
      email: payload.email,
      role: payload.role,
      subscriptionPlan: payload.subscriptionPlan,
    },
    secret,
    signOptions
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const env = getEnv();
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  const sub = typeof decoded.sub === 'string' ? decoded.sub : undefined;
  const email = decoded.email;
  const role = decoded.role;
  const subscriptionPlan = decoded.subscriptionPlan;
  if (
    !sub ||
    typeof email !== 'string' ||
    (role !== 'USER' && role !== 'ADMIN') ||
    (subscriptionPlan !== 'FREE' && subscriptionPlan !== 'SILVER' && subscriptionPlan !== 'GOLD')
  ) {
    throw new Error('Invalid token payload');
  }
  return {
    sub,
    email,
    role,
    subscriptionPlan,
  };
}
