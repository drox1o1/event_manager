'use client';

import { useRouter } from 'next/navigation';
import { Navbar } from '@cyrokx/ui';

/**
 * Thin client wrapper around the shared Navbar -- a Server Component (the
 * root layout) can't pass an onClick closure across the RSC boundary, so
 * navigation wiring lives in this small client component instead.
 */
export function SiteNavbar() {
  const router = useRouter();
  return <Navbar onSearchClick={() => router.push('/events')} />;
}
