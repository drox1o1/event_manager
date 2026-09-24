import { notFound } from 'next/navigation';
import { publicApi } from '@showtik/api-client';
import { InfoPageView } from '@/components/InfoPageView';

export default async function HelpPage() {
  const page = await publicApi.getSitePage('help').catch(() => null);
  if (!page) notFound();
  return <InfoPageView title={page.title} body={page.body} />;
}
