import { publicApi } from '@cyrokx/api-client';
import { CityPageView } from '@/components/CityPageView';

export const dynamic = 'force-dynamic';

interface CityPageProps {
  params: Promise<{ cityName: string }>;
}

export default async function CityPage({ params }: CityPageProps) {
  const { cityName } = await params;
  const city = decodeURIComponent(cityName);

  const { events } = await publicApi
    .listEvents({ city, pageSize: 48 })
    .catch(() => ({ events: [], page: 1, page_size: 48 }));

  return <CityPageView city={city} events={events} />;
}
