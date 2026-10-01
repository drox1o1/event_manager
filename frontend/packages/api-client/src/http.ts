// Thin fetch wrapper for the Showtik backend (API Gateway + Powertools
// resolvers -- see src/public_api and src/authenticated_api). Error bodies
// are Powertools' default shape: {"statusCode": n, "message": "..."}.

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function baseUrl(): string {
  // In the browser, call the same-origin Next.js proxy (each app rewrites
  // `/api/:path*` -> the real API Gateway URL in its next.config). This keeps
  // requests same-origin so they never trigger a CORS preflight -- the API
  // Gateway stage doesn't answer OPTIONS. Server-side (SSR / route handlers)
  // there's no origin to be relative to, so we call the API directly.
  if (typeof window !== 'undefined') return '/api';

  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is not set. Point it at the deployed API Gateway invoke URL ' +
        '(infra/app/template.yaml Outputs.ApiUrl) in this app\'s .env.local.'
    );
  }
  return url.replace(/\/+$/, '');
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  query?: Record<string, string | number | undefined>;
}

interface RefreshedTokens {
  access_token: string;
  refresh_token: string;
}

interface AuthRefreshConfig {
  getRefreshToken: () => string | null;
  refresh: (refreshToken: string) => Promise<RefreshedTokens>;
  onRefreshed: (tokens: RefreshedTokens) => void;
  onRefreshFailed: () => void;
}

let authRefreshConfig: AuthRefreshConfig | null = null;

/** Registers how apiFetch should recover from a 401: fetch a fresh access
 * token and retry the request once. Each app's AuthProvider calls this once
 * on mount with its own refresh endpoint + token storage -- api-client
 * itself doesn't know about localStorage or which role it's serving. Pass
 * `null` to disable (e.g. on logout). */
export function configureAuthRefresh(config: AuthRefreshConfig | null): void {
  authRefreshConfig = config;
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}, _isRetry = false): Promise<T> {
  const { method = 'GET', body, token, query } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl()}${path}${buildQuery(query)}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    // One retry after a silent refresh -- covers an access token that
    // expired while the tab was backgrounded/asleep (the proactive path,
    // if any, only fires on a timer and can miss that case). Never retries
    // the refresh call itself or a request already on its retry.
    if (response.status === 401 && token && authRefreshConfig && !_isRetry) {
      const refreshToken = authRefreshConfig.getRefreshToken();
      if (refreshToken) {
        try {
          const tokens = await authRefreshConfig.refresh(refreshToken);
          authRefreshConfig.onRefreshed(tokens);
          return apiFetch<T>(path, { ...options, token: tokens.access_token }, true);
        } catch {
          authRefreshConfig.onRefreshFailed();
        }
      }
    }

    const message = (data && (data.message || data.detail)) || response.statusText;
    throw new ApiError(response.status, message);
  }

  return data as T;
}
