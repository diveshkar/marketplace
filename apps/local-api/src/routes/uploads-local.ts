import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { getEnv } from '../config/env.js';
import { verifyListingUploadToken } from '../lib/upload-token.js';
import { writeLocalUploadFile } from '../services/upload.service.js';
import { processAndWriteVariants } from '../services/image.service.js';

export function registerUploadLocalRoute(app: express.Application): void {
  const env = getEnv();
  app.put(
    '/uploads/local',
    express.raw({ type: '*/*', limit: env.UPLOAD_MAX_BYTES }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = req.header('x-upload-token');
        if (!token) {
          res.status(401).json({ error: 'Missing X-Upload-Token', code: 'NO_UPLOAD_TOKEN' });
          return;
        }
        let payload;
        try {
          payload = verifyListingUploadToken(token);
        } catch {
          res.status(401).json({ error: 'Invalid upload token', code: 'INVALID_UPLOAD_TOKEN' });
          return;
        }
        const contentType = req.headers['content-type'] ?? '';
        if (contentType !== payload.contentType) {
          res.status(400).json({ error: 'Content-Type must match upload-url response', code: 'CONTENT_TYPE_MISMATCH' });
          return;
        }
        const body = req.body;
        if (!Buffer.isBuffer(body) || body.length === 0) {
          res.status(400).json({ error: 'Empty body', code: 'EMPTY_BODY' });
          return;
        }
        if (body.length > env.UPLOAD_MAX_BYTES) {
          res.status(413).json({ error: 'Body too large', code: 'FILE_TOO_LARGE' });
          return;
        }

        // Write original file
        await writeLocalUploadFile(payload.key, body);

        // Generate thumbnail + WebP variants (fire-and-forget — don't block the upload response)
        processAndWriteVariants(env.UPLOAD_DIR, payload.key, body).catch((err) => {
          console.error('[image] Failed to generate variants for', payload.key, err);
        });

        res.status(204).send();
      } catch (e) {
        next(e);
      }
    }
  );
}
