'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { StatCard, Badge } from '@cyrokx/ui';
import { adminApi, formatTimestamp } from '@cyrokx/api-client';
import type { AdminEventSummary, ModerationQueueItem } from '@cyrokx/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

function DashboardInner() {
  const token = useRequireAuth();
  const router = useRouter();
  const [events, setEvents] = React.useState<AdminEventSummary[] | null>(null);
  const [queue, setQueue] = React.useState<ModerationQueueItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    Promise.all([adminApi.listAllEvents(token, { pageSize: 50 }), adminApi.getModerationQueue(token)])
      .then(([evRes, qRes]) => {
        setEvents(evRes.events);
        setQueue(qRes.events);
      })
      .catch(() => setError('Could not load platform data.'));
  }, [token]);

  const totalEvents = events?.length ?? 0;
  const liveEvents = events?.filter((e) => e.status === 'live').length ?? 0;
  const ticketsSold = events?.reduce((n, e) => n + e.tickets_sold, 0) ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Platform overview</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Across all organisers and cities.</div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 20 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total events" value={events ? totalEvents : '—'} icon="calendar" />
        <StatCard label="Live events" value={events ? liveEvents : '—'} icon="zap" />
        <StatCard label="Tickets sold" value={events ? ticketsSold.toLocaleString('en-IN') : '—'} icon="ticket" />
        <StatCard label="Awaiting review" value={queue ? queue.length : '—'} icon="shield-check" />
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>Awaiting moderation</div>
          <a href="/moderation" onClick={(e) => { e.preventDefault(); router.push('/moderation'); }} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-link)', textDecoration: 'none' }}>Open queue &rarr;</a>
        </div>
        {queue === null ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '12px 0' }}>Loading…</div>
        ) : queue.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '12px 0' }}>Queue clear — every submitted event has been reviewed.</div>
        ) : (
          queue.slice(0, 5).map((e, i, arr) => (
            <div key={e.event_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{e.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Submitted {e.submitted_at ? formatTimestamp(e.submitted_at) : '—'}</div>
              </div>
              <Badge status="review" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <DashboardInner />
    </AdminShell>
  );
}
