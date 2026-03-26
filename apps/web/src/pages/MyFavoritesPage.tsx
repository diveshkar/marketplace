import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api-client';
import { Pagination, paginate } from '../components/ui/Pagination';
import { PageHead } from '../components/seo/PageHead';

type FavRow = {
  userId: string;
  listingId: string;
  createdAt: string;
  listing: { title: string; city: string; price: number; status: string } | null;
};

export function MyFavoritesPage() {
  const [rows, setRows] = useState<FavRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/me/favorites');
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) setError(d.error || 'Failed to load');
          return;
        }
        if (!cancelled) setRows((await res.json()) as FavRow[]);
      } catch {
        if (!cancelled) setError('Network error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHead title="My Favorites" />
      <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!rows && !error && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-600">No favorites yet</p>
          <p className="mt-1 text-sm text-gray-400">Browse listings and tap the heart to save them</p>
          <Link to="/browse" className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            Browse Listings
          </Link>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="mt-6 space-y-3">
            {paginate(rows, page, 10).map((f) => (
              <Link
                key={f.listingId}
                to={`/listings/${f.listingId}`}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  {f.listing ? (
                    <>
                      <p className="font-medium text-gray-900 truncate">{f.listing.title}</p>
                      <p className="text-sm text-gray-500">
                        {f.listing.city} &middot; Rs {f.listing.price.toLocaleString()}
                        <span className="ml-2 text-xs text-gray-400">({f.listing.status})</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-400">Listing no longer available</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(f.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalItems={rows.length} onPageChange={setPage} pageSize={10} />
        </>
      )}
    </div>
  );
}
