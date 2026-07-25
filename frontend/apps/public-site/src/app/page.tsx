import { publicApi } from '@cyrokx/api-client';
import { HomepageView } from '@/components/HomepageView';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [{ events }, { categories }] = await Promise.all([
    publicApi.listEvents({ pageSize: 8 }).catch(() => ({ events: [], page: 1, page_size: 8 })),
    publicApi.listCategories().catch(() => ({ categories: [] })),
  ]);

  return (
    <HomepageView
      featured={events.slice(0, 4)}
      trending={events.slice(4, 8)}
      categories={categories}
    />
  );
}
