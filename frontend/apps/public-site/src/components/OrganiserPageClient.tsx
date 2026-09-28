'use client';

import { useRouter } from 'next/navigation';
import { OrganiserPageView } from '@showtik/ui';
import type { OrganiserPublicPage } from '@showtik/api-client';

export function OrganiserPageClient({ page }: { page: OrganiserPublicPage }) {
  const router = useRouter();
  return <OrganiserPageView page={page} onOpenEvent={(id) => router.push(`/events/${id}`)} />;
}
