'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EventEditor, EDITOR_SECTIONS, PageLoader } from '@showtik/ui';
import type { EditorSection } from '@showtik/ui';
import { adminApi } from '@showtik/api-client';
import { useRequireAuth } from '@/lib/auth';
import { useHostOptions } from '@/lib/hosts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://showtik.in';

/** Super-admin editor for any event, in any status. */
export default function AdminManageEventPage() {
  const token = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ eventId: string; section: string }>();
  const hosts = useHostOptions(token);
  const section = (EDITOR_SECTIONS.some((s) => s.key === params.section) ? params.section : 'basic') as EditorSection;

  if (!token) return <PageLoader tone="dark" />;

  return (
    <EventEditor
      api={adminApi}
      token={token}
      eventId={params.eventId}
      section={section}
      onSectionChange={(s) => router.push(`/events/${params.eventId}/manage/${s}`)}
      mode="admin"
      hostOptions={hosts}
      publicSiteUrl={SITE_URL}
      publishActions={(event) => {
        const live = event.status === 'live' || event.status === 'soldout';
        return {
          primary: live ? null : {
            label: event.status === 'review' ? 'Approve & publish' : 'Publish now',
            hint: 'Goes live on the public site immediately.',
            run: async () => { await adminApi.publishEvent(token, event.event_id); },
          },
          secondary: live ? {
            label: 'Unpublish',
            hint: 'Hides the event from the public site.',
            run: async () => { await adminApi.unpublishEvent(token, event.event_id); },
          } : null,
        };
      }}
      links={[
        { label: 'Registrations', icon: 'list', onClick: () => router.push(`/events/${params.eventId}/registrations`) },
      ]}
      onExit={() => router.push('/events')}
    />
  );
}
