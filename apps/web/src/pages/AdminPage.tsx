import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { useToast } from '../components/ui/Toast';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminListings } from '../components/admin/AdminListings';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminReports } from '../components/admin/AdminReports';
import { AdminCategories } from '../components/admin/AdminCategories';
import { AdminLocations } from '../components/admin/AdminLocations';
import { AdminActivityLogs } from '../components/admin/AdminActivityLogs';
import { PageHead } from '../components/seo/PageHead';

type Tab = 'dashboard' | 'listings' | 'users' | 'reports' | 'categories' | 'locations' | 'logs';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { key: 'listings', label: 'Listings', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { key: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { key: 'reports', label: 'Reports', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { key: 'categories', label: 'Categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { key: 'locations', label: 'Locations', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'logs', label: 'Activity Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
];

export function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('dashboard');

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center py-20">
        <svg className="h-16 w-16 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="mt-4 text-lg font-medium text-gray-600">Admin access required</p>
        <Link to="/" className="mt-4 text-sm text-teal-600 hover:underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <PageHead title="Admin Panel" />
      {/* Sidebar — fixed height, scrolls independently */}
      <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 md:block">
        <div className="px-4 py-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Admin Panel</h2>
        </div>
        <nav className="space-y-0.5 px-2 pb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile tab bar — scrollable, all tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex overflow-x-auto border-t border-gray-200 bg-white md:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 flex-col items-center px-3 py-2 text-[10px] font-medium ${
              tab === t.key ? 'text-teal-600' : 'text-gray-400'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'listings' && <AdminListings toast={toast} />}
        {tab === 'users' && <AdminUsers toast={toast} />}
        {tab === 'reports' && <AdminReports toast={toast} />}
        {tab === 'categories' && <AdminCategories toast={toast} />}
        {tab === 'locations' && <AdminLocations toast={toast} />}
        {tab === 'logs' && <AdminActivityLogs />}
      </main>
    </div>
  );
}
