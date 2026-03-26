import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api-client';
import { Pagination, paginate } from '../components/ui/Pagination';
import { PageHead } from '../components/seo/PageHead';

type NotificationRow = {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  linkTo?: string;
  read: boolean;
  createdAt: string;
};

export function MyNotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const res = await apiFetch('/me/notifications');
      if (res.ok) setRows((await res.json()) as NotificationRow[]);
      else setError('Failed to load notifications');
    } catch {
      setError('Network error');
    }
  }

  async function markRead(notificationId: string) {
    await apiFetch(`/me/notifications/${notificationId}/read`, { method: 'POST' });
    setRows((prev) =>
      prev?.map((n) => (n.notificationId === notificationId ? { ...n, read: true } : n)) ?? null
    );
  }

  async function markAllRead() {
    await apiFetch('/me/notifications/read-all', { method: 'POST' });
    setRows((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
  }

  const [page, setPage] = useState(1);
  const unreadCount = rows?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHead title="Notifications" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-0.5 text-sm text-teal-600">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            onClick={markAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-600">No notifications</p>
          <p className="mt-1 text-sm text-gray-400">You'll be notified about inquiries and listing updates</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="mt-6 space-y-2">
            {paginate(rows, page, 15).map((n) => (
              <div
                key={n.notificationId}
                className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                  n.read
                    ? 'border-gray-100 bg-gray-50'
                    : 'border-teal-200 bg-white shadow-sm'
                }`}
              >
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-teal-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.read ? 'text-gray-500' : 'text-gray-900'}`}>
                    {n.title}
                  </p>
                  <p className={`mt-0.5 text-sm ${n.read ? 'text-gray-400' : 'text-gray-600'}`}>
                    {n.body}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                    {n.linkTo && (
                      <Link className="text-teal-600 hover:underline" to={n.linkTo}>View</Link>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    onClick={() => markRead(n.notificationId)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalItems={rows.length} onPageChange={setPage} pageSize={15} />
        </>
      )}
    </div>
  );
}
