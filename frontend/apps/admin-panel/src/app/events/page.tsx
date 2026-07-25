'use client';

import * as React from 'react';
import { Icon, Input, Badge, Button, DataTable, EmptyState } from '@cyrokx/ui';
import type { BadgeStatus } from '@cyrokx/ui';
import { adminApi, formatEventDate, ApiError } from '@cyrokx/api-client';
import type { AdminEventSummary } from '@cyrokx/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

const FILTERS: { label: string; status: string | null }[] = [
  { label: 'All', status: null },
  { label: 'In review', status: 'review' },
  { label: 'Approved', status: 'approved' },
  { label: 'Live', status: 'live' },
  { label: 'Rejected', status: 'rejected' },
  { label: 'Sold out', status: 'soldout' },
];

function badgeStatus(status: string): BadgeStatus {
  const allowed: BadgeStatus[] = ['draft', 'review', 'approved', 'rejected', 'live', 'soldout'];
  return (allowed as string[]).includes(status) ? (status as BadgeStatus) : 'draft';
}

function AllEventsInner() {
  const token = useRequireAuth();
  const [events, setEvents] = React.useState<AdminEventSummary[] | null>(null);
  const [filter, setFilter] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!token) return;
    adminApi
      .listAllEvents(token, { pageSize: 50 })
      .then((res) => setEvents(res.events))
      .catch(() => setError('Could not load events.'));
  }, [token]);

  React.useEffect(load, [load]);

  const publish = async (eventId: string) => {
    if (!token) return;
    setBusyId(eventId);
    setError(null);
    try {
      await adminApi.publishEvent(token, eventId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not publish.');
    } finally {
      setBusyId(null);
    }
  };

  const rows = (events ?? []).filter((e) => {
    const matchesFilter = !filter || e.status === filter;
    const q = query.toLowerCase();
    const matchesQuery = e.title.toLowerCase().includes(q) || (e.organiser_name ?? '').toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 24 }}>All events</div>

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
        <div style={{ width: 280 }}>
          <Input icon="search" placeholder="Search events or organisers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {events === null ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="calendar-x" title="No events match" description="Try a different filter or search term." />
        ) : (
          <DataTable<AdminEventSummary & { id: string }>
            columns={[
              {
                key: 'title',
                label: 'Event',
                render: (r) => (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{formatEventDate(r.event_date)} · {r.city}</div>
                  </div>
                ),
              },
              { key: 'organiser_name', label: 'Organiser', render: (r) => r.organiser_name ?? '—' },
              { key: 'status', label: 'Status', render: (r) => <Badge status={badgeStatus(r.status)} /> },
              { key: 'tickets_sold', label: 'Registrations', render: (r) => `${r.tickets_sold} / ${r.tickets_total}` },
              {
                key: 'action',
                label: '',
                render: (r) =>
                  r.status === 'approved' ? (
                    <Button size="sm" loading={busyId === r.event_id} onClick={() => publish(r.event_id)}><Icon name="rocket" size={14} />Publish</Button>
                  ) : null,
              },
            ]}
            rows={rows.map((r) => ({ ...r, id: r.event_id }))}
          />
        )}
      </div>
    </div>
  );
}

export default function AllEventsPage() {
  return (
    <AdminShell>
      <AllEventsInner />
    </AdminShell>
  );
}
