'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon, Button, PageHeading, RegistrationsView } from '@showtik/ui';
import { adminApi } from '@showtik/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

function RegistrationsInner() {
  const token = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  if (!token) return null;
  return (
    <div>
      <button onClick={() => router.push('/events')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        <Icon name="arrow-left" size={15} /> All events
      </button>
      <PageHeading
        title="Registrations"
        actions={<Button variant="secondary" onClick={() => router.push(`/events/${params.eventId}/manage/basic`)}><Icon name="pencil" size={15} />Edit event</Button>}
      />
      <RegistrationsView api={adminApi} token={token} eventId={params.eventId} />
    </div>
  );
}

export default function AdminRegistrationsPage() {
  return (
    <AdminShell>
      <RegistrationsInner />
    </AdminShell>
  );
}
