import { publicApi } from '@showtik/api-client';
import { EventListingView } from '@/components/EventListingView';

export const dynamic = 'force-dynamic';

interface EventsPageProps {
  searchParams: Promise<{ category?: string; city?: string; q?: string; page?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  // Category/city can each hold several comma-separated values (multi-select
  // checkboxes) -- the API only filters by one of each, so when a facet is
  // active we fetch the unfiltered page and let EventListingView do the
  // (multi-value) filtering client-side.
  const hasFacetFilter = !!sp.category || !!sp.city;

  const [{ events }, { categories }, chrome] = await Promise.all([
    publicApi
      .listEvents(hasFacetFilter ? { pageSize: 100 } : { page, pageSize: 24 })
      .catch(() => ({ events: [], page, page_size: 24 })),
    publicApi.listCategories().catch(() => ({ categories: [] })),
    publicApi.getSiteChrome().catch(() => ({ cities: [], footer: { tagline: '', columns: [] } })),
  ]);

  return (
    <EventListingView
      events={events}
      categories={categories}
      allCities={chrome.cities}
      activeCategory={sp.category}
      activeCity={sp.city}
      keyword={sp.q}
      page={page}
    />
  );
}
