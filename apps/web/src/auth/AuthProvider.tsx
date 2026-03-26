import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PublicUser } from '@marketplace/shared-types';
import { apiFetch } from '../lib/api-client';
import { AuthContext } from './auth-context';
import { clearAccessToken, getAccessToken, setAccessToken } from './auth-storage';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !!getAccessToken());

  const refreshUser = useCallback(async () => {
    const t = getAccessToken();
    if (!t) {
      setUser(null);
      return;
    }
    const res = await apiFetch('/me');
    if (!res.ok) {
      clearAccessToken();
      setToken(null);
      setUser(null);
      return;
    }
    setUser((await res.json()) as PublicUser);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiFetch('/me');
        if (cancelled) return;
        if (!res.ok) {
          clearAccessToken();
          setToken(null);
          setUser(null);
        } else {
          setUser((await res.json()) as PublicUser);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      accessToken?: string;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    if (!data.accessToken) throw new Error('Login failed');
    setAccessToken(data.accessToken);
    setToken(data.accessToken);
    const me = await apiFetch('/me');
    if (me.ok) {
      setUser((await me.json()) as PublicUser);
    }
  }, []);

  const register = useCallback(async (input: { email: string; password: string; name: string }) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      accessToken?: string;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    if (!data.accessToken) throw new Error('Registration failed');
    setAccessToken(data.accessToken);
    setToken(data.accessToken);
    const me = await apiFetch('/me');
    if (me.ok) {
      setUser((await me.json()) as PublicUser);
    }
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [token, user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
