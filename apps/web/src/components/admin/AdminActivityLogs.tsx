import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api-client';

type Log = {
  logId: string;
  adminUserId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  APPROVE: 'bg-green-100 text-green-700',
  REJECT: 'bg-red-100 text-red-700',
  BULK: 'bg-purple-100 text-purple-700',
  SET_USER: 'bg-yellow-100 text-yellow-700',
  REPORT: 'bg-orange-100 text-orange-700',
  UPSERT: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
};

function getActionColor(action: string): string {
  for (const [key, val] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return val;
  }
  return 'bg-gray-100 text-gray-700';
}

export function AdminActivityLogs() {
  const [logs, setLogs] = useState<Log[] | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      const res = await apiFetch('/admin/activity-logs');
      if (res.ok && !c) setLogs((await res.json()) as Log[]);
    })();
    return () => { c = true; };
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Activity Logs</h1>
      <p className="mt-1 text-sm text-gray-500">Track admin actions across the platform</p>

      {logs === null ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="mt-10 text-center text-gray-400">
          <p className="text-lg">No activity logs yet</p>
          <p className="mt-1 text-sm">Admin actions will appear here</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {logs.map((log) => (
            <div
              key={log.logId}
              className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                    {log.targetType}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{log.details}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  <span>by {log.adminName}</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
