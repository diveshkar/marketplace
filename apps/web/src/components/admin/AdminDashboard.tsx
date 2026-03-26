import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { apiFetch } from '../../lib/api-client';

type Stats = {
  totalUsers: number;
  byPlan: Record<string, number>;
  totalListings: number;
  byStatus: Record<string, number>;
  openReports: number;
  dailyUsers: { date: string; count: number }[];
  dailyListings: { date: string; count: number }[];
  revenue: { date: string; amountRs: number }[];
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      const res = await apiFetch('/admin/stats');
      if (res.ok && !c) setStats((await res.json()) as Stats);
    })();
    return () => { c = true; };
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.totalUsers} color="bg-blue-50 text-blue-700" />
        <StatCard label="Total Listings" value={stats.totalListings} color="bg-teal-50 text-teal-700" />
        <StatCard label="Active Listings" value={stats.byStatus.ACTIVE ?? 0} color="bg-green-50 text-green-700" />
        <StatCard label="Open Reports" value={stats.openReports} color="bg-red-50 text-red-700" />
        <StatCard label="Pending Review" value={stats.byStatus.PENDING ?? 0} color="bg-yellow-50 text-yellow-700" />
        <StatCard label="FREE Users" value={stats.byPlan.FREE ?? 0} color="bg-gray-50 text-gray-600" />
        <StatCard label="SILVER Users" value={stats.byPlan.SILVER ?? 0} color="bg-gray-50 text-gray-500" />
        <StatCard label="GOLD Users" value={stats.byPlan.GOLD ?? 0} color="bg-amber-50 text-amber-700" />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* New Users chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-700">New Users (last 30 days)</h3>
          {stats.dailyUsers.length > 0 ? (
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyUsers}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(v) => v} />
                  <Bar dataKey="count" fill="#0d9488" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-gray-400">No data yet</p>
          )}
        </div>

        {/* New Listings chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-700">New Listings (last 30 days)</h3>
          {stats.dailyListings.length > 0 ? (
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyListings}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-gray-400">No data yet</p>
          )}
        </div>

        {/* Revenue chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700">Revenue (last 30 days)</h3>
          {stats.revenue.length > 0 ? (
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.revenue}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `Rs ${v}`} />
                  <Tooltip formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="amountRs" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-gray-400">No revenue data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-3 sm:p-5 ${color}`}>
      <p className="text-[10px] font-medium uppercase opacity-70 sm:text-xs">{label}</p>
      <p className="mt-1 text-xl font-bold sm:text-3xl">{value}</p>
    </div>
  );
}
