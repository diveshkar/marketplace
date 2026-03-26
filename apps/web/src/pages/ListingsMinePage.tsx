import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '@marketplace/shared-types';
import { apiFetch } from '../lib/api-client';
import { ListingCard } from '../components/ui/ListingCard';
import { ListingCardSkeleton } from '../components/ui/Skeleton';
import { Pagination, paginate } from '../components/ui/Pagination';
import { PageHead } from '../components/seo/PageHead';

type Tab = 'ALL' | 'ACTIVE' | 'PENDING' | 'DRAFT' | 'SOLD' | 'REJECTED';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'SOLD', label: 'Sold' },
  { key: 'REJECTED', label: 'Rejected' },
];

export function ListingsMinePage() {
  const [rows, setRows] = useState<Listing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/listings/mine');
        const data = (await res.json().catch(() => null)) as Listing[] | { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(typeof data === 'object' && data && 'error' in data ? String(data.error) : 'Failed to load');
          return;
        }
        setRows(data as Listing[]);
      } catch {
        if (!cancelled) setError('Network error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = rows?.filter((l) => tab === 'ALL' || l.status === tab) ?? [];
  const counts = rows ? {
    ALL: rows.length,
    ACTIVE: rows.filter((l) => l.status === 'ACTIVE').length,
    PENDING: rows.filter((l) => l.status === 'PENDING').length,
    DRAFT: rows.filter((l) => l.status === 'DRAFT').length,
    SOLD: rows.filter((l) => l.status === 'SOLD').length,
    REJECTED: rows.filter((l) => l.status === 'REJECTED').length,
  } : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHead title="My Listings" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Ads</h1>
        <Link
          to="/listings/new"
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          + Post New Ad
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {counts && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                tab === t.key ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!rows && !error && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      )}

      {rows && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-600">
            {tab === 'ALL' ? 'No ads yet' : `No ${tab.toLowerCase()} ads`}
          </p>
          {tab === 'ALL' && (
            <Link
              to="/listings/new"
              className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Post your first ad
            </Link>
          )}
        </div>
      )}

      {rows && filtered.length > 0 && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {paginate(filtered, page).map((l) => (
              <ListingCard
                key={l.listingId}
                listingId={l.listingId}
                title={l.title}
                price={l.price}
                city={l.city}
                category={l.category}
                imageKeys={l.imageKeys}
                status={l.status}
                showStatus
                createdAt={l.createdAt}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
