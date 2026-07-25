'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon, Badge, StatCard, Button } from '@cyrokx/ui';
import type { BadgeStatus } from '@cyrokx/ui';
import { organiserApi, formatDateTime, formatINR, ApiError } from '@cyrokx/api-client';
import type { OrganiserEventDetail } from '@cyrokx/api-client';
import { PortalShell } from '@/components/PortalShell';
import { useRequireAuth } from '@/lib/auth';

function badgeStatus(status: string): BadgeStatus {
  const allowed: BadgeStatus[] = ['draft', 'review', 'approved', 'rejected', 'live', 'soldout'];
  return (allowed as string[]).includes(status) ? (status as BadgeStatus) : 'draft';
}

function EventDetailInner() {
  const token = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [event, setEvent] = React.useState<OrganiserEventDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    if (!token) return;
    organiserApi
      .getMyEvent(token, eventId)
      .then(setEvent)
      .catch((err) => setError(err instanceof ApiError && err.status === 404 ? 'Event not found.' : 'Could not load this event.'));
  }, [token, eventId]);

  React.useEffect(load, [load]);

  const submitForReview = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await organiserApi.submitEvent(token, eventId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit for review.');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div style={{ color: 'var(--color-error)' }}>{error}</div>;
  if (!event) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  const totalSold = event.ticket_tiers.reduce((n, t) => n + t.quantity_sold, 0);
  const totalCapacity = event.ticket_tiers.reduce((n, t) => n + t.quantity_total, 0);
  const revenue = event.ticket_tiers.reduce((sum, t) => sum + t.quantity_sold * Number(t.price), 0);
  const canSubmit = event.status === 'draft' || event.status === 'rejected';
  const canEdit = canSubmit;

  return (
    <div>
      <button onClick={() => router.push('/events')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        <Icon name="arrow-left" size={15} /> My events
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>{event.title}</div>
            <Badge status={badgeStatus(event.status)} />
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Icon name="calendar" size={14} /> {formatDateTime(event.event_date, event.event_time)}
            <span style={{ margin: '0 2px' }}>·</span>
            <Icon name="map-pin" size={14} /> {event.venue_name}, {event.city}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {canEdit && <Button variant="secondary" onClick={() => router.push(`/events/${eventId}/edit`)}><Icon name="pencil" size={15} />Edit</Button>}
          {canSubmit && <Button onClick={submitForReview} loading={busy}>Submit for review</Button>}
          <Button variant="secondary" onClick={() => router.push(`/events/${eventId}/attendees`)}><Icon name="users" size={15} />Attendees</Button>
        </div>
      </div>

      {event.status === 'rejected' && event.rejection_reason && (
        <div style={{ background: 'var(--status-error-bg)', color: 'var(--status-error-text)', borderRadius: 'var(--radius-control)', padding: 14, marginBottom: 24, fontSize: 14 }}>
          <strong>Rejected:</strong> {event.rejection_reason}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard label="Registrations" value={totalSold} icon="users" />
        <StatCard label="Revenue" value={formatINR(revenue)} icon="indian-rupee" />
        <StatCard label="Capacity remaining" value={Math.max(totalCapacity - totalSold, 0)} icon="ticket" />
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, maxWidth: 560 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>Ticket tiers</div>
        {event.ticket_tiers.length === 0 && <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No ticket tiers yet.</div>}
        {event.ticket_tiers.map((t, i) => (
          <div key={t.id} style={{ padding: '12px 0', borderBottom: i < event.ticket_tiers.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>{t.name} · {formatINR(t.price)}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.quantity_sold} / {t.quantity_total} sold</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--color-off-white)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${t.quantity_total ? (t.quantity_sold / t.quantity_total) * 100 : 0}%`, background: 'var(--color-accent)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <PortalShell>
      <EventDetailInner />
    </PortalShell>
  );
}
