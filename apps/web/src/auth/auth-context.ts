import { createContext } from 'react';
import type { PublicUser } from '@marketplace/shared-types';

export type AuthContextValue = {
  token: string | null;
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
