// Thin fetch wrapper for the CyRokx backend (API Gateway + Powertools
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

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
    const message = (data && (data.message || data.detail)) || response.statusText;
    throw new ApiError(response.status, message);
  }

  return data as T;
}
