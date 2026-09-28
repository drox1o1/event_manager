import { notFound } from 'next/navigation';
import { publicApi, ApiError } from '@showtik/api-client';
import { EventDetailView } from '@/components/EventDetailView';

export const dynamic = 'force-dynamic';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ book?: string }>;
}

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const { eventId } = await params;
  const { book } = await searchParams;

  let event;
  try {
    event = await publicApi.getEvent(eventId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return <EventDetailView event={event} autoBook={book === '1'} />;
}
