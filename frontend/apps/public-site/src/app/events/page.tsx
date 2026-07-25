import { publicApi } from '@cyrokx/api-client';
import { EventListingView } from '@/components/EventListingView';

export const dynamic = 'force-dynamic';

interface EventsPageProps {
  searchParams: Promise<{ category?: string; city?: string; q?: string; page?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  const [{ events }, { categories }] = await Promise.all([
    publicApi
      .listEvents({ category: sp.category, city: sp.city, page, pageSize: 24 })
      .catch(() => ({ events: [], page, page_size: 24 })),
    publicApi.listCategories().catch(() => ({ categories: [] })),
  ]);

  return (
    <EventListingView
      events={events}
      categories={categories}
      activeCategory={sp.category}
      activeCity={sp.city}
      keyword={sp.q}
      page={page}
    />
  );
}
