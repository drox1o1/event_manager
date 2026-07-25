import { notFound } from 'next/navigation';
import { publicApi, ApiError } from '@cyrokx/api-client';
import { EventDetailView } from '@/components/EventDetailView';

export const dynamic = 'force-dynamic';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;

  let event;
  try {
    event = await publicApi.getEvent(eventId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return <EventDetailView event={event} />;
}
