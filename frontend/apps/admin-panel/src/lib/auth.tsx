'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

// Admin session. Same JWT-bearer model as the organiser portal, but a
// separate storage key and its own /admin/auth/login endpoint. No refresh
// endpoint server-side yet, so the token expires after ~1h and the guard
// bounces to /login.

const STORAGE_KEY = 'cyrokx.admin.token';

interface AuthContextValue {
  token: string | null;
  ready: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setTokenState(window.localStorage.getItem(STORAGE_KEY));
    setReady(true);
  }, []);

  const setToken = React.useCallback((next: string | null) => {
    if (next) window.localStorage.setItem(STORAGE_KEY, next);
    else window.localStorage.removeItem(STORAGE_KEY);
    setTokenState(next);
  }, []);

  const logout = React.useCallback(() => setToken(null), [setToken]);

  return <AuthContext.Provider value={{ token, ready, setToken, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Redirects to /login if there's no token once the provider has hydrated. */
export function useRequireAuth(): string | null {
  const { token, ready } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  return token;
}
