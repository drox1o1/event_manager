import { notFound } from 'next/navigation';
import { publicApi } from '@showtik/api-client';
import { InfoPageView } from '@/components/InfoPageView';

export default async function PressPage() {
  const page = await publicApi.getSitePage('press').catch(() => null);
  if (!page) notFound();
  return <InfoPageView title={page.title} body={page.body} />;
}
