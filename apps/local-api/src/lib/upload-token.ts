import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { getEnv } from '../config/env.js';

export type UploadTokenPayload = {
  purpose: 'listing-upload';
  userId: string;
  listingId: string;
  key: string;
  contentType: string;
};

export function signListingUploadToken(payload: Omit<UploadTokenPayload, 'purpose'>): string {
  const env = getEnv();
  const body: UploadTokenPayload = { purpose: 'listing-upload', ...payload };
  const signOptions: SignOptions = {
    expiresIn: env.UPLOAD_URL_TTL_SEC as SignOptions['expiresIn'],
  };
  const secret: Secret = env.JWT_SECRET;
  return jwt.sign(body, secret, signOptions);
}

export function verifyListingUploadToken(token: string): UploadTokenPayload {
  const env = getEnv();
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  if (decoded.purpose !== 'listing-upload') {
    throw new Error('Invalid upload token');
  }
  const userId = decoded.userId;
  const listingId = decoded.listingId;
  const key = decoded.key;
  const contentType = decoded.contentType;
  if (
    typeof userId !== 'string' ||
    typeof listingId !== 'string' ||
    typeof key !== 'string' ||
    typeof contentType !== 'string'
  ) {
    throw new Error('Invalid upload token payload');
  }
  return { purpose: 'listing-upload', userId, listingId, key, contentType };
}
