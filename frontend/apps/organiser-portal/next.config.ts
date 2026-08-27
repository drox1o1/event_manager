import type { NextConfig } from "next";

// Browser-side API calls go to the same-origin path `/api/*` and are proxied
// here to the real API Gateway stage. This avoids CORS entirely (the stage
// doesn't answer OPTIONS preflights). Server-side calls hit the API directly
// via NEXT_PUBLIC_API_BASE_URL -- see packages/api-client/src/http.ts.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  transpilePackages: ["@cyrokx/ui", "@cyrokx/api-client"],
  async rewrites() {
    if (!API_BASE) return [];
    return [{ source: "/api/:path*", destination: `${API_BASE}/:path*` }];
  },
};

export default nextConfig;
