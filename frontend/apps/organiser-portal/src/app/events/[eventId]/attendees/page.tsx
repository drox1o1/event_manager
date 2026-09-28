'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon, Button, PageHeading, RegistrationsView } from '@showtik/ui';
import { organiserApi } from '@showtik/api-client';
import { PortalShell } from '@/components/PortalShell';
import { useRequireAuth } from '@/lib/auth';

function AttendeesInner() {
  const token = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  if (!token) return null;
  return (
    <div>
      <button onClick={() => router.push(`/events/${params.eventId}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        <Icon name="arrow-left" size={15} /> Event dashboard
      </button>
      <PageHeading
        title="Registrations"
        description="Every participant has their own ticket ID; tickets bought together share one order (payment) ID."
        actions={<Button variant="secondary" onClick={() => router.push(`/events/${params.eventId}/manage/tickets`)}><Icon name="ticket" size={15} />Manage tickets</Button>}
      />
      <RegistrationsView api={organiserApi} token={token} eventId={params.eventId} />
    </div>
  );
}

export default function AttendeesPage() {
  return (
    <PortalShell>
      <AttendeesInner />
    </PortalShell>
  );
}
