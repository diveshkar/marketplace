/**
 * Image processing service — generates thumbnails and WebP variants on upload.
 *
 * For each uploaded image, we create:
 *   - Original (untouched)
 *   - WebP variant   (same dimensions, smaller file)
 *   - Thumbnail       (300px wide, JPEG)
 *   - Thumbnail WebP  (300px wide, WebP)
 *
 * Naming convention (sibling files next to original):
 *   {prefix}/{listingId}/{uuid}.jpg          ← original
 *   {prefix}/{listingId}/{uuid}.webp         ← WebP variant
 *   {prefix}/{listingId}/{uuid}_thumb.jpg    ← thumbnail
 *   {prefix}/{listingId}/{uuid}_thumb.webp   ← thumbnail WebP
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const THUMB_WIDTH = 300;
const WEBP_QUALITY = 80;
const THUMB_QUALITY = 75;

export type ProcessedImages = {
  webpKey: string;
  thumbKey: string;
  thumbWebpKey: string;
};

/** Derive sibling keys from an original stored key. */
export function deriveImageKeys(originalKey: string): ProcessedImages {
  const dotIdx = originalKey.lastIndexOf('.');
  const base = dotIdx > -1 ? originalKey.slice(0, dotIdx) : originalKey;
  return {
    webpKey: `${base}.webp`,
    thumbKey: `${base}_thumb.jpg`,
    thumbWebpKey: `${base}_thumb.webp`,
  };
}

/**
 * Process an uploaded image buffer and write all variants to local disk.
 * Returns the derived keys (caller can store them or ignore them —
 * the frontend resolves variants by convention).
 */
export async function processAndWriteVariants(
  uploadDir: string,
  storedKey: string,
  originalBuffer: Buffer,
): Promise<ProcessedImages> {
  const keys = deriveImageKeys(storedKey);
  const basePath = path.resolve(uploadDir);

  const resolve = (key: string) => path.resolve(basePath, key);

  // Ensure directories exist
  await mkdir(path.dirname(resolve(storedKey)), { recursive: true });

  // 1. WebP variant (full size)
  const webpBuf = await sharp(originalBuffer)
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  await writeFile(resolve(keys.webpKey), webpBuf);

  // 2. Thumbnail JPEG
  const thumbBuf = await sharp(originalBuffer)
    .resize(THUMB_WIDTH, undefined, { withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY })
    .toBuffer();
  await writeFile(resolve(keys.thumbKey), thumbBuf);

  // 3. Thumbnail WebP
  const thumbWebpBuf = await sharp(originalBuffer)
    .resize(THUMB_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer();
  await writeFile(resolve(keys.thumbWebpKey), thumbWebpBuf);

  return keys;
}
