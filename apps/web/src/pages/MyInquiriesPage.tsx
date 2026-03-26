import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Inquiry } from '@marketplace/shared-types';
import { apiFetch } from '../lib/api-client';
import { Pagination, paginate } from '../components/ui/Pagination';
import { PageHead } from '../components/seo/PageHead';

export function MyInquiriesPage() {
  const [rows, setRows] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/me/inquiries');
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) setError(d.error || 'Failed to load');
          return;
        }
        if (!cancelled) setRows((await res.json()) as Inquiry[]);
      } catch {
        if (!cancelled) setError('Network error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHead title="My Inquiries" />
      <h1 className="text-2xl font-bold text-gray-900">My Inquiries</h1>
      <p className="mt-1 text-sm text-gray-500">Messages you've sent to sellers</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!rows && !error && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-600">No inquiries yet</p>
          <p className="mt-1 text-sm text-gray-400">Browse listings and contact sellers</p>
          <Link to="/browse" className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            Browse Listings
          </Link>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="mt-6 space-y-3">
            {paginate(rows, page, 10).map((inq) => (
              <div
                key={inq.inquiryId}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/listings/${inq.listingId}`}
                    className="text-sm font-medium text-teal-600 hover:underline"
                  >
                    View Listing &rarr;
                  </Link>
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(inq.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{inq.message}</p>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalItems={rows.length} onPageChange={setPage} pageSize={10} />
        </>
      )}
    </div>
  );
}
