import { notFound } from 'next/navigation';
import { publicApi, ApiError } from '@showtik/api-client';
import { OrganiserPageClient } from '@/components/OrganiserPageClient';

export const dynamic = 'force-dynamic';

interface OrganiserPageProps {
  params: Promise<{ organiserId: string }>;
}

export default async function OrganiserPage({ params }: OrganiserPageProps) {
  const { organiserId } = await params;
  let page;
  try {
    page = await publicApi.getOrganiserPage(organiserId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  return <OrganiserPageClient page={page} />;
}
