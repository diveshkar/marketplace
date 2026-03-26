import { useEffect, useState } from 'react';
import { useAuth } from '../auth/use-auth';
import { apiFetch } from '../lib/api-client';

type NotificationRow = { read: boolean };

export function useNotificationCount(): number {
  const { token } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setCount(0);
      return;
    }
    let cancelled = false;

    async function poll() {
      try {
        const res = await apiFetch('/me/notifications');
        if (res.ok && !cancelled) {
          const rows = (await res.json()) as NotificationRow[];
          setCount(rows.filter((n) => !n.read).length);
        }
      } catch {
        // ignore
      }
    }

    void poll();
    const id = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  return count;
}
