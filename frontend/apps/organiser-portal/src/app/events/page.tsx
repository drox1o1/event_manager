'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Input, Badge, Button, DataTable, EmptyState } from '@cyrokx/ui';
import type { BadgeStatus } from '@cyrokx/ui';
import { organiserApi, formatEventDate } from '@cyrokx/api-client';
import type { OrganiserEventSummary } from '@cyrokx/api-client';
import { PortalShell } from '@/components/PortalShell';
import { useRequireAuth } from '@/lib/auth';

const FILTERS: { label: string; status: string | null }[] = [
  { label: 'All', status: null },
  { label: 'Live', status: 'live' },
  { label: 'In review', status: 'review' },
  { label: 'Approved', status: 'approved' },
  { label: 'Draft', status: 'draft' },
  { label: 'Rejected', status: 'rejected' },
];

function badgeStatus(status: string): BadgeStatus {
  const allowed: BadgeStatus[] = ['draft', 'review', 'approved', 'rejected', 'live', 'soldout'];
  return (allowed as string[]).includes(status) ? (status as BadgeStatus) : 'draft';
}

function MyEventsInner() {
  const token = useRequireAuth();
  const router = useRouter();
  const [events, setEvents] = React.useState<OrganiserEventSummary[] | null>(null);
  const [filter, setFilter] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    organiserApi
      .listMyEvents(token, { pageSize: 50 })
      .then((res) => setEvents(res.events))
      .catch(() => setError('Could not load your events.'));
  }, [token]);

  const rows = (events ?? []).filter((e) => {
    const matchesFilter = !filter || e.status === filter;
    const matchesQuery = e.title.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)' }}>My events</div>
        <Button onClick={() => router.push('/events/new')}><Icon name="plus" size={16} />Create event</Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => {
            const active = filter === f.status;
            return (
              <button
                key={f.label}
                onClick={() => setFilter(f.status)}
                style={{
                  padding: '7px 16px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--color-accent)' : 'var(--border-default)'}`,
                  background: active ? 'var(--color-accent-tint)' : 'var(--surface-card)',
                  color: active ? 'var(--color-accent)' : 'var(--text-body)',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div style={{ width: 260 }}>
          <Input icon="search" placeholder="Search your events" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {events === null ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="calendar-x"
            title={events.length === 0 ? 'No events yet' : 'No events match'}
            description={events.length === 0 ? 'Create your first event to start selling tickets.' : 'Try a different filter or search term.'}
            action={events.length === 0 ? <Button onClick={() => router.push('/events/new')}>Create event</Button> : undefined}
          />
        ) : (
          <DataTable<OrganiserEventSummary & { id: string }>
            columns={[
              {
                key: 'title',
                label: 'Event',
                render: (r) => (
                  <div onClick={() => router.push(`/events/${r.event_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg, #EFEAE4, #E4DED6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', flexShrink: 0 }}>
                      <Icon name="image" size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.title}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{formatEventDate(r.event_date)} · {r.city}</div>
                    </div>
                  </div>
                ),
              },
              { key: 'status', label: 'Status', render: (r) => <Badge status={badgeStatus(r.status)} /> },
              { key: 'tickets_sold', label: 'Registrations', render: (r) => `${r.tickets_sold} / ${r.tickets_total}` },
            ]}
            rows={rows.map((r) => ({ ...r, id: r.event_id }))}
            actions={{ onClick: (r) => router.push(`/events/${r.event_id}`) }}
          />
        )}
      </div>
    </div>
  );
}

export default function MyEventsPage() {
  return (
    <PortalShell>
      <MyEventsInner />
    </PortalShell>
  );
}
