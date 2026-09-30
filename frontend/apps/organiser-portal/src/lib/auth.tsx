'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { organiserApi, configureAuthRefresh } from '@showtik/api-client';

// Organiser session. Backend issues JWT bearer tokens (no cookies) -- we
// hold the access token in localStorage and attach it to every api-client
// call. The access token expires after ~1h; api-client's
// configureAuthRefresh (registered below) transparently retries a 401 once
// via /organiser/auth/refresh before giving up and bouncing the guard to
// /login.

const STORAGE_KEY = 'showtik.organiser.token';
const REFRESH_STORAGE_KEY = 'showtik.organiser.refreshToken';

interface Tokens {
  access_token: string;
  refresh_token: string;
}

interface AuthContextValue {
  token: string | null;
  ready: boolean;
  setTokens: (tokens: Tokens | null) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  const setTokens = React.useCallback((next: Tokens | null) => {
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, next.access_token);
      window.localStorage.setItem(REFRESH_STORAGE_KEY, next.refresh_token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(REFRESH_STORAGE_KEY);
    }
    setTokenState(next?.access_token ?? null);
  }, []);

  React.useEffect(() => {
    setTokenState(window.localStorage.getItem(STORAGE_KEY));
    setReady(true);

    configureAuthRefresh({
      getRefreshToken: () => window.localStorage.getItem(REFRESH_STORAGE_KEY),
      refresh: (refreshToken) => organiserApi.refresh(refreshToken),
      onRefreshed: (tokens) => setTokens(tokens),
      onRefreshFailed: () => setTokens(null),
    });

    return () => configureAuthRefresh(null);
  }, [setTokens]);

  const logout = React.useCallback(() => setTokens(null), [setTokens]);

  return <AuthContext.Provider value={{ token, ready, setTokens, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Redirects to /login if there's no token once the provider has hydrated.
 *  Returns the token (or null while still resolving). */
export function useRequireAuth(): string | null {
  const { token, ready } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  return token;
}
