import { describe, it, expect } from 'vitest';
import { deriveImageKeys } from '../services/image.service.js';

// We test deriveImageKeys directly. processAndWriteVariants depends on sharp
// and the filesystem, so we test its key-derivation logic here and leave
// integration testing (sharp output) for manual verification.

describe('image.service', () => {
  describe('deriveImageKeys', () => {
    it('should derive WebP, thumb, and thumb WebP keys from a JPEG key', () => {
      const keys = deriveImageKeys('public/listing-1/abc123.jpg');
      expect(keys).toEqual({
        webpKey: 'public/listing-1/abc123.webp',
        thumbKey: 'public/listing-1/abc123_thumb.jpg',
        thumbWebpKey: 'public/listing-1/abc123_thumb.webp',
      });
    });

    it('should derive keys from a PNG key', () => {
      const keys = deriveImageKeys('uploads/img.png');
      expect(keys).toEqual({
        webpKey: 'uploads/img.webp',
        thumbKey: 'uploads/img_thumb.jpg',
        thumbWebpKey: 'uploads/img_thumb.webp',
      });
    });

    it('should handle keys without an extension', () => {
      const keys = deriveImageKeys('some/path/noext');
      expect(keys).toEqual({
        webpKey: 'some/path/noext.webp',
        thumbKey: 'some/path/noext_thumb.jpg',
        thumbWebpKey: 'some/path/noext_thumb.webp',
      });
    });

    it('should handle keys with multiple dots', () => {
      const keys = deriveImageKeys('path/my.photo.v2.jpg');
      expect(keys).toEqual({
        webpKey: 'path/my.photo.v2.webp',
        thumbKey: 'path/my.photo.v2_thumb.jpg',
        thumbWebpKey: 'path/my.photo.v2_thumb.webp',
      });
    });
  });
});
