import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api-client';

type Toast = (msg: string) => void;

type Listing = {
  listingId: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  city: string;
  price: number;
  status: string;
  activePromotion?: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  SOLD: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-gray-100 text-gray-500',
};

export function AdminListings({ toast }: { toast: Toast }) {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search.trim()) params.set('q', search.trim());
    const res = await apiFetch(`/admin/listings/search?${params}`);
    if (res.ok) setListings(await res.json());
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const moderate = async (listingId: string, action: 'approve' | 'reject') => {
    setBusy(true);
    const res = await apiFetch(`/admin/listings/${listingId}/${action}`, { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      toast(`Listing ${action}d`);
      load();
    } else {
      const err = await res.json().catch(() => null);
      toast(err?.error ?? `Failed to ${action}`);
    }
  };

  const bulkAction = async (action: 'approve' | 'reject') => {
    if (selected.size === 0) return;
    setBusy(true);
    const res = await apiFetch('/admin/listings/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingIds: [...selected], action }),
    });
    setBusy(false);
    if (res.ok) {
      const r = await res.json();
      toast(`Bulk ${action}: ${r.success} succeeded, ${r.failed} failed`);
      setSelected(new Set());
      load();
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!listings) return;
    if (selected.size === listings.length) setSelected(new Set());
    else setSelected(new Set(listings.map((l) => l.listingId)));
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Listings</h1>
      <p className="mt-1 text-sm text-gray-500">Search, filter, and moderate listings</p>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search title/description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="REJECTED">Rejected</option>
          <option value="SOLD">Sold</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-teal-50 px-3 py-2">
          <span className="text-sm font-medium text-teal-700">{selected.size} selected</span>
          <button
            onClick={() => bulkAction('approve')}
            disabled={busy}
            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => bulkAction('reject')}
            disabled={busy}
            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:underline">
            Clear
          </button>
        </div>
      )}

      {/* Listing list */}
      {listings === null ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <p className="mt-10 text-center text-gray-400">No listings found</p>
      ) : (
        <>
          {/* Select all */}
          <label className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <input type="checkbox" checked={selected.size === listings.length} onChange={toggleAll} />
            Select all ({listings.length})
          </label>

          <div className="mt-2 space-y-2">
            {listings.map((l) => (
              <div key={l.listingId} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(l.listingId)}
                    onChange={() => toggleSelect(l.listingId)}
                    className="mt-1 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{l.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[l.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {l.status}
                      </span>
                      {l.activePromotion && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          {l.activePromotion}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{l.category}</span>
                      <span className="text-xs font-medium text-gray-700">Rs {l.price.toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">{new Date(l.createdAt).toLocaleDateString()}</p>
                  </div>
                  {l.status === 'PENDING' && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => moderate(l.listingId, 'approve')}
                        disabled={busy}
                        className="rounded bg-green-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => moderate(l.listingId, 'reject')}
                        disabled={busy}
                        className="rounded bg-red-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
