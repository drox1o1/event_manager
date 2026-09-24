import { notFound } from 'next/navigation';
import { publicApi } from '@showtik/api-client';
import { InfoPageView } from '@/components/InfoPageView';

export default async function RefundPolicyPage() {
  const page = await publicApi.getSitePage('refund-policy').catch(() => null);
  if (!page) notFound();
  return <InfoPageView title={page.title} body={page.body} />;
}
