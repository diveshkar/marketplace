import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api-client';
import { Pagination, paginate } from '../components/ui/Pagination';
import { PageHead } from '../components/seo/PageHead';

type InboxItem = {
  inquiryId: string;
  listingId: string;
  buyerUserId: string;
  message: string;
  createdAt: string;
  listingTitle: string;
  buyerName: string;
};

export function SellerInboxPage() {
  const [rows, setRows] = useState<InboxItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/me/inbox');
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) setError(d.error || 'Failed to load');
          return;
        }
        if (!cancelled) setRows((await res.json()) as InboxItem[]);
      } catch {
        if (!cancelled) setError('Network error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHead title="Seller Inbox" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Inbox</h1>
          <p className="mt-0.5 text-sm text-gray-500">Messages from buyers about your listings</p>
        </div>
        {rows && rows.length > 0 && (
          <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
            {rows.length} message{rows.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!rows && !error && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-600">No messages yet</p>
          <p className="mt-1 text-sm text-gray-400">
            When buyers send inquiries about your listings, they'll appear here
          </p>
          <Link
            to="/listings"
            className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            View My Ads
          </Link>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="mt-6 space-y-3">
            {paginate(rows, page, 10).map((item) => (
              <div
                key={item.inquiryId}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                      {item.buyerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.buyerName}</p>
                      <p className="text-xs text-gray-400">
                        about{' '}
                        <Link
                          to={`/listings/${item.listingId}`}
                          className="text-teal-600 hover:underline"
                        >
                          {item.listingTitle}
                        </Link>
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {item.message}
                </p>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalItems={rows.length} onPageChange={setPage} pageSize={10} />
        </>
      )}
    </div>
  );
}
