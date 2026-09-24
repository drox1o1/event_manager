'use client';

import { useRouter } from 'next/navigation';
import { Navbar } from '@showtik/ui';

export interface SiteNavbarProps {
  /** Live categories from the platform (super-admin managed); Navbar falls
   *  back to its own defaults when omitted. */
  categories?: string[];
  /** Live city list (super-admin managed). */
  cities?: string[];
}

/**
 * Thin client wrapper around the shared Navbar -- a Server Component (the
 * root layout) can't pass an onClick closure across the RSC boundary, so
 * navigation wiring lives in this small client component instead.
 */
export function SiteNavbar({ categories, cities }: SiteNavbarProps) {
  const router = useRouter();
  return (
    <Navbar
      categories={categories}
      cities={cities}
      city={cities?.[0]}
      onSearchClick={() => router.push('/events')}
      onCategoryClick={(category) => router.push(`/category/${encodeURIComponent(category)}`)}
      onCityChange={(city) => router.push(`/city/${encodeURIComponent(city)}`)}
    />
  );
}
