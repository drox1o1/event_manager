import { CheckoutView } from '@/components/CheckoutView';

interface CheckoutPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { eventId } = await params;
  return <CheckoutView eventId={eventId} />;
}
