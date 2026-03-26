import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecentlyViewed } from '../lib/recently-viewed';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { PageHead } from '../components/seo/PageHead';

export function RecentlyViewedPage() {
  const [items] = useState(() => getRecentlyViewed());

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHead title="Recently Viewed" />
      <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-teal-600">Home</Link>
        <span>/</span>
        <span className="text-gray-700">Recently Viewed</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Recently Viewed</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <p className="mt-3 text-gray-500">No recently viewed listings</p>
          <Link to="/browse" className="mt-4 text-sm text-teal-600 hover:underline">Browse listings</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.listingId}
              to={`/listings/${item.listingId}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {item.imageKey ? (
                  <OptimizedImage
                    imageKey={item.imageKey}
                    alt={item.title}
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
              </div>
              <div className="flex flex-1 flex-col p-3">
                <p className="text-lg font-bold text-gray-900">Rs {item.price.toLocaleString()}</p>
                <h3 className="mt-0.5 line-clamp-2 text-sm text-gray-700 group-hover:text-teal-700">{item.title}</h3>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400">{item.city}</p>
                  <p className="text-xs text-gray-400">
                    {formatTimeAgo(item.viewedAt)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
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
