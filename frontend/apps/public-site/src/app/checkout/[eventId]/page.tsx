import { redirect } from 'next/navigation';

interface CheckoutPageProps {
  params: Promise<{ eventId: string }>;
}

/** Booking now happens in the event page's ticket modal (select tickets →
 *  participant details → confirm); old checkout links land there. */
export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { eventId } = await params;
  redirect(`/events/${eventId}?book=1`);
}
