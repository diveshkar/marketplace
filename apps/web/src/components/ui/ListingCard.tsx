import { Link } from 'react-router-dom';
import type { PromotionType } from '@marketplace/shared-types';
import { StatusBadge } from './StatusBadge';
import { OptimizedImage } from './OptimizedImage';

type Props = {
  listingId: string;
  title: string;
  price: number;
  city: string;
  category: string;
  imageKeys?: string[];
  status?: string;
  sellerName?: string;
  createdAt?: string;
  showStatus?: boolean;
  condition?: string;
  negotiable?: boolean;
  activePromotion?: PromotionType;
};

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  used: 'Used',
  reconditioned: 'Reconditioned',
};

const PROMO_BADGE: Record<string, { label: string; className: string }> = {
  BUMP: { label: 'Bumped', className: 'bg-blue-600 text-white' },
  FEATURED: { label: 'Featured', className: 'bg-amber-500 text-white' },
  TOP_AD: { label: 'Top Ad', className: 'bg-purple-600 text-white' },
};

export function ListingCard({
  listingId, title, price, city, imageKeys, status, sellerName, createdAt, showStatus, condition, negotiable, activePromotion,
}: Props) {
  const hasImage = imageKeys && imageKeys.length > 0;

  return (
    <Link
      to={`/listings/${listingId}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {hasImage ? (
          <OptimizedImage
            imageKey={imageKeys[0]}
            alt={title}
            thumbnail
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {activePromotion && PROMO_BADGE[activePromotion] && (
          <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold shadow ${PROMO_BADGE[activePromotion].className}`}>
            {PROMO_BADGE[activePromotion].label}
          </span>
        )}
        {showStatus && status && !activePromotion && (
          <div className="absolute left-2 top-2">
            <StatusBadge status={status} />
          </div>
        )}
        {imageKeys && imageKeys.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
            {imageKeys.length} photos
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-gray-900">
            Rs {price.toLocaleString()}
          </p>
          {negotiable && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Negotiable
            </span>
          )}
        </div>
        <h3 className="mt-0.5 line-clamp-2 text-sm text-gray-700 group-hover:text-teal-700">
          {title}
        </h3>
        {condition && (
          <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
            {CONDITION_LABELS[condition] ?? condition}
          </span>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-xs text-gray-400">{city}</p>
          {createdAt && (
            <p className="text-xs text-gray-400">
              {formatTimeAgo(createdAt)}
            </p>
          )}
        </div>
        {sellerName && (
          <p className="mt-1 text-xs text-gray-400">by {sellerName}</p>
        )}
      </div>
    </Link>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
