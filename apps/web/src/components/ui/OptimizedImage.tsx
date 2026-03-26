import {
  publicListingImageUrl,
  publicListingImageWebpUrl,
  publicListingThumbUrl,
  publicListingThumbWebpUrl,
} from '../../lib/api-client';

type Props = {
  imageKey: string;
  alt: string;
  className?: string;
  /** Use thumbnail variant (300px) instead of full-size. */
  thumbnail?: boolean;
};

/**
 * Renders a listing image with WebP <source> for modern browsers
 * and JPEG/PNG fallback. Uses loading="lazy" by default.
 */
export function OptimizedImage({ imageKey, alt, className = '', thumbnail = false }: Props) {
  const webpSrc = thumbnail
    ? publicListingThumbWebpUrl(imageKey)
    : publicListingImageWebpUrl(imageKey);
  const fallbackSrc = thumbnail
    ? publicListingThumbUrl(imageKey)
    : publicListingImageUrl(imageKey);

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}
