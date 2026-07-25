import { notFound } from 'next/navigation';
import { publicApi, ApiError } from '@cyrokx/api-client';
import { OrderConfirmationView } from '@/components/OrderConfirmationView';

export const dynamic = 'force-dynamic';

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params;

  let order;
  try {
    order = await publicApi.getOrder(orderId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return <OrderConfirmationView order={order} />;
}
