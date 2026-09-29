import { publicApi } from '@showtik/api-client';
import { CategoryPageView } from '@/components/CategoryPageView';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ categoryName: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryName } = await params;
  const category = decodeURIComponent(categoryName);

  const [{ events }, { categories }] = await Promise.all([
    publicApi.listEvents({ category, pageSize: 24 }).catch(() => ({ events: [], page: 1, page_size: 24 })),
    publicApi.listCategories().catch(() => ({ categories: [] })),
  ]);
  const icon = categories.find((c) => c.name === category)?.icon ?? null;

  return <CategoryPageView category={category} icon={icon} events={events} />;
}
