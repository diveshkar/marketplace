import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api-client';

type Toast = (msg: string) => void;

type Report = {
  reportId: string;
  listingId: string;
  reporterUserId: string;
  reason: string;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  REVIEWED: 'bg-green-100 text-green-700',
  DISMISSED: 'bg-gray-100 text-gray-600',
};

export function AdminReports({ toast }: { toast: Toast }) {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [filter, setFilter] = useState<'' | 'OPEN' | 'REVIEWED' | 'DISMISSED'>('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await apiFetch('/admin/reports');
    if (res.ok) setReports(await res.json());
  };

  useEffect(() => { load(); }, []);

  const resolve = async (reportId: string, status: 'REVIEWED' | 'DISMISSED') => {
    setBusy(true);
    const res = await apiFetch(`/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (res.ok) {
      toast(`Report marked as ${status.toLowerCase()}`);
      load();
    } else {
      toast('Failed to update report');
    }
  };

  const filtered = reports?.filter((r) => !filter || r.status === filter) ?? null;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Reports</h1>
      <p className="mt-1 text-sm text-gray-500">Review flagged listings</p>

      <div className="mt-4 flex gap-2">
        {(['', 'OPEN', 'REVIEWED', 'DISMISSED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
            {reports && s && (
              <span className="ml-1 text-xs opacity-70">
                ({reports.filter((r) => r.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered === null ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-gray-400">No reports found</p>
      ) : (
        <div className="mt-4 space-y-2">
          {filtered.map((r) => (
            <div key={r.reportId} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[r.status]}`}>
                  {r.status}
                </span>
                <span className="text-xs text-gray-400">Listing: {r.listingId.slice(0, 8)}…</span>
                <span className="text-xs text-gray-400">Reporter: {r.reporterUserId.slice(0, 8)}…</span>
              </div>
              <p className="mt-2 text-sm text-gray-700">{r.reason}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                {r.resolvedBy && (
                  <span className="text-xs text-gray-400">Resolved by: {r.resolvedBy.slice(0, 8)}…</span>
                )}
                {r.status === 'OPEN' && (
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => resolve(r.reportId, 'REVIEWED')}
                      disabled={busy}
                      className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => resolve(r.reportId, 'DISMISSED')}
                      disabled={busy}
                      className="rounded bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
