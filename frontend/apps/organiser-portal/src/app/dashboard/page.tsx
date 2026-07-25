'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, StatCard, Badge, Button } from '@cyrokx/ui';
import type { BadgeStatus } from '@cyrokx/ui';
import { organiserApi, formatEventDate } from '@cyrokx/api-client';
import type { OrganiserEventSummary } from '@cyrokx/api-client';
import { PortalShell } from '@/components/PortalShell';
import { useRequireAuth } from '@/lib/auth';

function badgeStatus(status: string): BadgeStatus {
  const allowed: BadgeStatus[] = ['draft', 'review', 'approved', 'rejected', 'live', 'soldout'];
  return (allowed as string[]).includes(status) ? (status as BadgeStatus) : 'draft';
}

function DashboardInner() {
  const token = useRequireAuth();
  const router = useRouter();
  const [events, setEvents] = React.useState<OrganiserEventSummary[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    organiserApi
      .listMyEvents(token, { pageSize: 50 })
      .then((res) => setEvents(res.events))
      .catch(() => setError('Could not load your events.'));
  }, [token]);

  const activeCount = events?.filter((e) => e.status === 'live').length ?? 0;
  const totalRegistrations = events?.reduce((n, e) => n + e.tickets_sold, 0) ?? 0;
  const recent = (events ?? []).slice(0, 5);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Dashboard</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Here&apos;s how your events are doing.</div>
        </div>
        <Button onClick={() => router.push('/events/new')}><Icon name="plus" size={16} />Create event</Button>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 20 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard label="Active events" value={activeCount} icon="calendar" />
        <StatCard label="Total registrations" value={totalRegistrations.toLocaleString('en-IN')} icon="users" />
        <StatCard label="Events created" value={events?.length ?? '—'} icon="layout-dashboard" />
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>Your events</div>
          <a href="/events" onClick={(e) => { e.preventDefault(); router.push('/events'); }} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-link)', textDecoration: 'none' }}>View all &rarr;</a>
        </div>
        {events === null ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '12px 0' }}>Loading…</div>
        ) : recent.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '12px 0' }}>No events yet — create your first one.</div>
        ) : (
          recent.map((e) => (
            <div key={e.event_id} onClick={() => router.push(`/events/${e.event_id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-default)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{e.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{formatEventDate(e.event_date)} · {e.tickets_sold} registrations</div>
              </div>
              <Badge status={badgeStatus(e.status)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PortalShell>
      <DashboardInner />
    </PortalShell>
  );
}
