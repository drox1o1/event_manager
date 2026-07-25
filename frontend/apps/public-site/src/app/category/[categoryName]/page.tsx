import { publicApi } from '@cyrokx/api-client';
import { CategoryPageView } from '@/components/CategoryPageView';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ categoryName: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryName } = await params;
  const category = decodeURIComponent(categoryName);

  const { events } = await publicApi
    .listEvents({ category, pageSize: 24 })
    .catch(() => ({ events: [], page: 1, page_size: 24 }));

  return <CategoryPageView category={category} events={events} />;
}
