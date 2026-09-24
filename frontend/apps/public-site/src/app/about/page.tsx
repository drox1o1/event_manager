import { notFound } from 'next/navigation';
import { publicApi } from '@showtik/api-client';
import { InfoPageView } from '@/components/InfoPageView';

export default async function AboutPage() {
  const page = await publicApi.getSitePage('about').catch(() => null);
  if (!page) notFound();
  return <InfoPageView title={page.title} body={page.body} />;
}
