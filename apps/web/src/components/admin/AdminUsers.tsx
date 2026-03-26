import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api-client';

type Toast = (msg: string) => void;

type User = {
  userId: string;
  name: string;
  email: string;
  role: string;
  accountStatus?: string;
  subscriptionPlan: string;
  createdAt: string;
};

type UserDetail = {
  user: User;
  listings: { listingId: string; title: string; status: string; price: number; createdAt: string }[];
  payments: { paymentId: string; amountRs: number; purpose: string; description: string; createdAt: string }[];
};

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  SILVER: 'bg-gray-200 text-gray-700',
  GOLD: 'bg-amber-100 text-amber-700',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  BLOCKED: 'bg-red-100 text-red-700',
};

export function AdminUsers({ toast }: { toast: Toast }) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (planFilter) params.set('plan', planFilter);
    if (statusFilter) params.set('status', statusFilter);
    const res = await apiFetch(`/admin/users?${params}`);
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => { load(); }, [planFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const setAccountStatus = async (userId: string, accountStatus: string) => {
    setBusy(true);
    const res = await apiFetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountStatus }),
    });
    setBusy(false);
    if (res.ok) {
      toast(`User status set to ${accountStatus}`);
      load();
      if (detail?.user.userId === userId) openDetail(userId);
    } else {
      toast('Failed to update user status');
    }
  };

  const bulkStatus = async (accountStatus: string) => {
    if (selected.size === 0) return;
    setBusy(true);
    const res = await apiFetch('/admin/users/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [...selected], accountStatus }),
    });
    setBusy(false);
    if (res.ok) {
      const r = await res.json();
      toast(`Bulk ${accountStatus}: ${r.success} succeeded, ${r.failed} failed`);
      setSelected(new Set());
      load();
    }
  };

  const openDetail = async (userId: string) => {
    const res = await apiFetch(`/admin/users/${userId}`);
    if (res.ok) setDetail(await res.json());
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Detail view
  if (detail) {
    const u = detail.user;
    return (
      <div>
        <button onClick={() => setDetail(null)} className="mb-4 text-sm text-teal-600 hover:underline">
          &larr; Back to Users
        </button>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{u.name}</h2>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PLAN_COLORS[u.subscriptionPlan] ?? ''}`}>
              {u.subscriptionPlan}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[u.accountStatus ?? 'ACTIVE'] ?? ''}`}>
              {u.accountStatus ?? 'ACTIVE'}
            </span>
            {u.role === 'ADMIN' && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">ADMIN</span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{u.email}</p>
          <p className="text-xs text-gray-400">Joined {new Date(u.createdAt).toLocaleDateString()}</p>

          <div className="mt-3 flex gap-2">
            {(u.accountStatus ?? 'ACTIVE') !== 'SUSPENDED' && (
              <button onClick={() => setAccountStatus(u.userId, 'SUSPENDED')} disabled={busy}
                className="rounded bg-yellow-500 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50">
                Suspend
              </button>
            )}
            {(u.accountStatus ?? 'ACTIVE') !== 'BLOCKED' && (
              <button onClick={() => setAccountStatus(u.userId, 'BLOCKED')} disabled={busy}
                className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                Block
              </button>
            )}
            {(u.accountStatus ?? 'ACTIVE') !== 'ACTIVE' && (
              <button onClick={() => setAccountStatus(u.userId, 'ACTIVE')} disabled={busy}
                className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                Activate
              </button>
            )}
          </div>
        </div>

        {/* User's listings */}
        <h3 className="mt-6 text-sm font-semibold text-gray-700">Listings ({detail.listings.length})</h3>
        {detail.listings.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No listings</p>
        ) : (
          <div className="mt-2 space-y-1">
            {detail.listings.map((l) => (
              <div key={l.listingId} className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm">
                <p className="truncate font-medium text-gray-800">{l.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">Rs {l.price.toLocaleString()}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[l.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {l.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User's payments */}
        <h3 className="mt-6 text-sm font-semibold text-gray-700">Payments ({detail.payments.length})</h3>
        {detail.payments.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No payments</p>
        ) : (
          <div className="mt-2 space-y-1">
            {detail.payments.map((p) => (
              <div key={p.paymentId} className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm">
                <p className="truncate text-gray-700">{p.description}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">{p.purpose}</span>
                  <span className="text-xs font-medium text-gray-800">Rs {p.amountRs.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Users</h1>
      <p className="mt-1 text-sm text-gray-500">Manage user accounts and subscriptions</p>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search name/email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
            Search
          </button>
        </form>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none">
          <option value="">All Plans</option>
          <option value="FREE">Free</option>
          <option value="SILVER">Silver</option>
          <option value="GOLD">Gold</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-teal-50 px-3 py-2">
          <span className="text-sm font-medium text-teal-700">{selected.size} selected</span>
          <button onClick={() => bulkStatus('SUSPENDED')} disabled={busy}
            className="rounded bg-yellow-500 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50">
            Suspend
          </button>
          <button onClick={() => bulkStatus('BLOCKED')} disabled={busy}
            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
            Block
          </button>
          <button onClick={() => bulkStatus('ACTIVE')} disabled={busy}
            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
            Activate
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:underline">Clear</button>
        </div>
      )}

      {/* User list */}
      {users === null ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="mt-10 text-center text-gray-400">No users found</p>
      ) : (
        <>
          <label className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <input type="checkbox" checked={selected.size === users.length && users.length > 0}
              onChange={() => {
                if (selected.size === users.length) setSelected(new Set());
                else setSelected(new Set(users.map((u) => u.userId)));
              }} />
            Select all ({users.length})
          </label>

          <div className="mt-2 space-y-2">
            {users.map((u) => (
              <div key={u.userId} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={selected.has(u.userId)} onChange={() => toggleSelect(u.userId)} className="mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <button onClick={() => openDetail(u.userId)} className="truncate text-sm font-medium text-gray-800 hover:text-teal-600 hover:underline">
                      {u.name}
                    </button>
                    <p className="truncate text-xs text-gray-500">{u.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PLAN_COLORS[u.subscriptionPlan] ?? ''}`}>
                        {u.subscriptionPlan}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[u.accountStatus ?? 'ACTIVE'] ?? ''}`}>
                        {u.accountStatus ?? 'ACTIVE'}
                      </span>
                      {u.role === 'ADMIN' && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">ADMIN</span>
                      )}
                      <span className="text-[10px] text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    {(u.accountStatus ?? 'ACTIVE') !== 'SUSPENDED' && (
                      <button onClick={() => setAccountStatus(u.userId, 'SUSPENDED')} disabled={busy}
                        className="rounded bg-yellow-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-yellow-600 disabled:opacity-50">
                        Suspend
                      </button>
                    )}
                    {(u.accountStatus ?? 'ACTIVE') !== 'BLOCKED' && (
                      <button onClick={() => setAccountStatus(u.userId, 'BLOCKED')} disabled={busy}
                        className="rounded bg-red-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-700 disabled:opacity-50">
                        Block
                      </button>
                    )}
                    {(u.accountStatus ?? 'ACTIVE') !== 'ACTIVE' && (
                      <button onClick={() => setAccountStatus(u.userId, 'ACTIVE')} disabled={busy}
                        className="rounded bg-green-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-700 disabled:opacity-50">
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
