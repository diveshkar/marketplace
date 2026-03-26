import { useEffect, useState } from 'react';
import { useAuth } from '../auth/use-auth';
import { apiFetch } from '../lib/api-client';

/** Polls /me/conversations/unread-count every 30s. Returns total unread messages. */
export function useMessageCount(): number {
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
        const res = await apiFetch('/me/conversations/unread-count');
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { count: number };
          setCount(data.count);
        }
      } catch { /* ignore */ }
    }

    void poll();
    const id = setInterval(poll, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  return count;
}
