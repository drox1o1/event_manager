'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EventEditor, EDITOR_SECTIONS, PageLoader } from '@showtik/ui';
import type { EditorSection } from '@showtik/ui';
import { organiserApi } from '@showtik/api-client';
import { useRequireAuth } from '@/lib/auth';
import { useOrganiserProfile } from '@/lib/organiser';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://showtik.in';

/** Step-by-step editor for one of the organiser's events. */
export default function ManageEventPage() {
  const token = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ eventId: string; section: string }>();
  const { profile } = useOrganiserProfile(token);
  const section = (EDITOR_SECTIONS.some((s) => s.key === params.section) ? params.section : 'basic') as EditorSection;

  if (!token) return <PageLoader tone="dark" />;

  return (
    <EventEditor
      api={organiserApi}
      token={token}
      eventId={params.eventId}
      section={section}
      onSectionChange={(s) => router.push(`/events/${params.eventId}/manage/${s}`)}
      mode="organiser"
      hostLabel={profile?.org_name}
      onManageHost={() => router.push('/profile')}
      publicSiteUrl={SITE_URL}
      publishActions={(event) => ({
        primary: event.status === 'draft' || event.status === 'rejected'
          ? {
              label: event.status === 'rejected' ? 'Resubmit for review' : 'Submit for review',
              hint: 'The Showtik team reviews every event (usually within 24 hours) before it goes live.',
              run: async () => { await organiserApi.submitEvent(token, event.event_id); },
            }
          : null,
      })}
      links={[
        { label: 'Event Dashboard', icon: 'layout-grid', onClick: () => router.push(`/events/${params.eventId}`) },
        { label: 'Registrations', icon: 'list', onClick: () => router.push(`/events/${params.eventId}/attendees`) },
      ]}
      onExit={() => router.push('/events')}
    />
  );
}
