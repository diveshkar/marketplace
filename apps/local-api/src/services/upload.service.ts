import { randomUUID } from 'node:crypto';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { canAddMoreImages, maxImagesForPlan } from '@marketplace/shared-subscriptions';
import type { Listing, ListingStatus } from '@marketplace/shared-types';
import { getEnv } from '../config/env.js';
import { signListingUploadToken } from '../lib/upload-token.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export class UploadServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'UploadServiceError';
  }
}

const UPLOADABLE_STATUSES: ListingStatus[] = ['DRAFT', 'PENDING'];

const ALLOWED_CONTENT_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

function assertOwner(listing: Listing, userId: string): void {
  if (listing.userId !== userId) {
    throw new UploadServiceError('Forbidden', 403, 'NOT_OWNER');
  }
}

function extensionForContentType(contentType: string): string {
  const ext = ALLOWED_CONTENT_TYPES.get(contentType);
  if (!ext) {
    throw new UploadServiceError('Unsupported content type', 400, 'INVALID_CONTENT_TYPE');
  }
  return ext;
}

function apiPublicBase(): string {
  const env = getEnv();
  return env.API_PUBLIC_URL ?? `http://localhost:${env.PORT}`;
}

function s3Client(): S3Client {
  const env = getEnv();
  return new S3Client({ region: env.AWS_REGION });
}

function objectKeyForListing(listingId: string, contentType: string): string {
  const env = getEnv();
  const ext = extensionForContentType(contentType);
  const prefix = env.S3_UPLOAD_PREFIX.replace(/^\/+|\/+$/g, '');
  return `${prefix}/${listingId}/${randomUUID()}.${ext}`;
}

function assertStoredKeyBelongsToListing(listingId: string, key: string): void {
  const env = getEnv();
  const prefix = env.S3_UPLOAD_PREFIX.replace(/^\/+|\/+$/g, '');
  const expectedPrefix = `${prefix}/${listingId}/`;
  if (!key.startsWith(expectedPrefix)) {
    throw new UploadServiceError('Key does not belong to this listing', 400, 'INVALID_KEY');
  }
}

export async function resolveLocalFilePath(storedKey: string): Promise<string> {
  const env = getEnv();
  const base = path.resolve(env.UPLOAD_DIR);
  const target = path.resolve(base, storedKey);
  if (!target.startsWith(base + path.sep) && target !== base) {
    throw new UploadServiceError('Invalid key path', 400, 'INVALID_KEY');
  }
  return target;
}

export async function writeLocalUploadFile(storedKey: string, body: Buffer): Promise<void> {
  const filePath = await resolveLocalFilePath(storedKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
}

export const uploadService = {
  async createUploadUrl(
    userId: string,
    listingId: string,
    contentType: string
  ): Promise<{
    key: string;
    method: 'PUT';
    uploadUrl: string;
    headers: Record<string, string>;
  }> {
    const env = getEnv();
    extensionForContentType(contentType);

    const listing = await listingRepository.getById(listingId);
    if (!listing) {
      throw new UploadServiceError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    assertOwner(listing, userId);
    if (!UPLOADABLE_STATUSES.includes(listing.status)) {
      throw new UploadServiceError(
        'Images can only be added while listing is DRAFT or PENDING',
        400,
        'INVALID_STATUS'
      );
    }

    const user = await userRepository.getById(userId);
    if (!user) {
      throw new UploadServiceError('User not found', 404, 'USER_NOT_FOUND');
    }

    const current = listing.imageKeys?.length ?? 0;
    if (!canAddMoreImages(user.subscriptionPlan, current)) {
      throw new UploadServiceError(
        `Image limit reached for ${user.subscriptionPlan} (max ${maxImagesForPlan(user.subscriptionPlan)})`,
        403,
        'IMAGE_LIMIT'
      );
    }

    const key = objectKeyForListing(listingId, contentType);

    if (env.STORAGE_DRIVER === 's3') {
      if (!env.S3_BUCKET) {
        throw new UploadServiceError('S3 bucket not configured', 500, 'S3_MISCONFIG');
      }
      const client = s3Client();
      const cmd = new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        ContentType: contentType,
      });
      const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: env.UPLOAD_URL_TTL_SEC });
      return {
        key,
        method: 'PUT',
        uploadUrl,
        headers: { 'Content-Type': contentType },
      };
    }

    const token = signListingUploadToken({ userId, listingId, key, contentType });
    return {
      key,
      method: 'PUT',
      uploadUrl: `${apiPublicBase()}/uploads/local`,
      headers: {
        'Content-Type': contentType,
        'X-Upload-Token': token,
      },
    };
  },

  async completeUpload(userId: string, listingId: string, key: string): Promise<Listing> {
    const env = getEnv();
    const listing = await listingRepository.getById(listingId);
    if (!listing) {
      throw new UploadServiceError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    assertOwner(listing, userId);
    if (!UPLOADABLE_STATUSES.includes(listing.status)) {
      throw new UploadServiceError(
        'Images can only be finalized while listing is DRAFT or PENDING',
        400,
        'INVALID_STATUS'
      );
    }
    assertStoredKeyBelongsToListing(listingId, key);

    const user = await userRepository.getById(userId);
    if (!user) {
      throw new UploadServiceError('User not found', 404, 'USER_NOT_FOUND');
    }

    const max = maxImagesForPlan(user.subscriptionPlan);
    const keys = listing.imageKeys ?? [];
    if (keys.includes(key)) {
      return listing;
    }
    if (keys.length >= max) {
      throw new UploadServiceError(
        `Image limit reached for ${user.subscriptionPlan} (max ${max})`,
        403,
        'IMAGE_LIMIT'
      );
    }

    if (env.STORAGE_DRIVER === 's3') {
      if (!env.S3_BUCKET) {
        throw new UploadServiceError('S3 bucket not configured', 500, 'S3_MISCONFIG');
      }
      const client = s3Client();
      try {
        await client.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
      } catch {
        throw new UploadServiceError('Object not found in storage', 400, 'UPLOAD_MISSING');
      }
    } else {
      try {
        const p = await resolveLocalFilePath(key);
        const st = await stat(p);
        if (!st.isFile() || st.size === 0) {
          throw new UploadServiceError('Upload file missing or empty', 400, 'UPLOAD_MISSING');
        }
        if (st.size > env.UPLOAD_MAX_BYTES) {
          throw new UploadServiceError('File too large', 400, 'FILE_TOO_LARGE');
        }
      } catch (e) {
        if (e instanceof UploadServiceError) throw e;
        throw new UploadServiceError('Upload file missing', 400, 'UPLOAD_MISSING');
      }
    }

    const updated = await listingRepository.appendImageKey({
      listingId,
      userId,
      key,
      maxAllowed: max,
    });
    if (!updated) {
      throw new UploadServiceError('Could not attach image (limit or conflict)', 409, 'IMAGE_ATTACH_FAILED');
    }
    return updated;
  },
};
