'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon, Badge, Button } from '@cyrokx/ui';
import type { BadgeStatus } from '@cyrokx/ui';
import { organiserApi, formatDateTime, ApiError } from '@cyrokx/api-client';
import type { OrganiserEventDetail } from '@cyrokx/api-client';
import { PortalShell } from '@/components/PortalShell';
import { useRequireAuth } from '@/lib/auth';
import { EventDashboardPanel } from '@/components/event/EventDashboardPanel';
import { EventCategoriesPanel } from '@/components/event/EventCategoriesPanel';
import { EventRegistrationFormPanel } from '@/components/event/EventRegistrationFormPanel';
import { EventDiscountsPanel } from '@/components/event/EventDiscountsPanel';
import { EventTaxPanel } from '@/components/event/EventTaxPanel';
import { EventOrdersPanel } from '@/components/event/EventOrdersPanel';
import { ComingSoonPanel } from '@/components/event/ComingSoonPanel';

function badgeStatus(status: string): BadgeStatus {
  const allowed: BadgeStatus[] = ['draft', 'review', 'approved', 'rejected', 'live', 'soldout'];
  return (allowed as string[]).includes(status) ? (status as BadgeStatus) : 'draft';
}

const GROUPS = [
  { name: 'Overview', tabs: [{ key: 'dashboard', label: 'Dashboard' }] },
  { name: 'Registration', tabs: [
    { key: 'categories', label: 'Categories' },
    { key: 'regform', label: 'Registration form' },
    { key: 'discounts', label: 'Discounts' },
    { key: 'tax', label: 'Tax' },
  ] },
  { name: 'People', tabs: [{ key: 'orders', label: 'Orders' }] },
];

// Overflow items. `attendees` and `edit` navigate to their own routes; the rest
// render a "coming soon" placeholder so the full workspace structure is visible.
const OVERFLOW = [
  { key: 'attendees', label: 'Attendees', icon: 'users', route: true },
  { key: 'edit', label: 'Edit event', icon: 'pencil', route: true },
  { key: 'merch', label: 'Merchandize', icon: 'shopping-bag' },
  { key: 'leaderboards', label: 'Leaderboards', icon: 'trophy' },
  { key: 'certificates', label: 'Certificates', icon: 'award' },
  { key: 'bib', label: 'Attendee bib', icon: 'hash' },
  { key: 'email', label: 'Email templates', icon: 'mail' },
];
const OVERFLOW_LABEL: Record<string, string> = Object.fromEntries(OVERFLOW.map((o) => [o.key, o.label]));

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: active ? 'var(--color-accent)' : 'none', color: active ? '#fff' : 'var(--text-body)', border: 'none', borderRadius: 'var(--radius-control)', padding: '8px 14px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}

function EventWorkspace() {
  const token = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [event, setEvent] = React.useState<OrganiserEventDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [tab, setTab] = React.useState('dashboard');
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

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

  const copyLink = () => {
    // Registration link points at the public site's event page, not this
    // authed organiser route. Uses NEXT_PUBLIC_SITE_URL when configured.
    const publicBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cyrokx.in';
    const url = `${publicBase.replace(/\/+$/, '')}/events/${eventId}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const selectOverflow = (key: string) => {
    setMoreOpen(false);
    if (key === 'attendees') { router.push(`/events/${eventId}/attendees`); return; }
    if (key === 'edit') { router.push(`/events/${eventId}/edit`); return; }
    setTab(key);
  };

  if (error) return <div style={{ color: 'var(--color-error)' }}>{error}</div>;
  if (!event) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  const canSubmit = event.status === 'draft' || event.status === 'rejected';
  const canEdit = canSubmit;
  const overflowItem = OVERFLOW.find((o) => o.key === tab);
  const moreSelected = !!overflowItem && !overflowItem.route;

  return (
    <div onClick={() => moreOpen && setMoreOpen(false)}>
      <button onClick={() => router.push('/events')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        <Icon name="arrow-left" size={15} /> My events
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, gap: 16 }}>
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
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Button variant="secondary" size="sm" onClick={copyLink}><Icon name="link" size={15} />{copied ? 'Link copied' : 'Copy registration link'}</Button>
          {canEdit && <Button size="sm" onClick={() => router.push(`/events/${eventId}/edit`)}><Icon name="pencil" size={15} />Edit event</Button>}
          {canSubmit && <Button size="sm" onClick={submitForReview} loading={busy}>Submit for review</Button>}
        </div>
      </div>

      {event.status === 'rejected' && event.rejection_reason && (
        <div style={{ background: 'var(--status-error-bg)', color: 'var(--status-error-text)', borderRadius: 'var(--radius-control)', padding: 14, marginBottom: 24, fontSize: 14 }}>
          <strong>Rejected:</strong> {event.rejection_reason}
        </div>
      )}

      {/* Grouped tab bar with overflow */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 0, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', padding: '4px 6px', marginBottom: 28, boxShadow: 'var(--shadow-card)' }}>
        {GROUPS.map((g, gi) => (
          <React.Fragment key={g.name}>
            {gi > 0 && <div style={{ width: 1, background: 'var(--border-default)', margin: '8px 6px' }} />}
            <div style={{ display: 'flex', gap: 2 }}>
              {g.tabs.map((t) => <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabButton>)}
            </div>
          </React.Fragment>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <TabButton active={moreSelected} onClick={() => setMoreOpen((v) => !v)}>
            {moreSelected ? OVERFLOW_LABEL[tab] : 'More'} <Icon name="chevron-down" size={14} />
          </TabButton>
          {moreOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 220, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', boxShadow: '0 12px 32px rgba(0,0,0,0.14)', padding: 6, zIndex: 20 }}>
              {OVERFLOW.map((o) => (
                <button key={o.key} onClick={() => selectOverflow(o.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: tab === o.key ? 'var(--surface-accent-tint)' : 'none', border: 'none', borderRadius: 'var(--radius-control)', padding: '9px 10px', fontSize: 13.5, fontWeight: 600, color: tab === o.key ? 'var(--color-accent)' : 'var(--text-body)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  <Icon name={o.icon} size={15} />{o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panels */}
      {tab === 'dashboard' && <EventDashboardPanel event={event} />}
      {tab === 'categories' && <EventCategoriesPanel event={event} />}
      {tab === 'regform' && <EventRegistrationFormPanel />}
      {tab === 'discounts' && <EventDiscountsPanel />}
      {tab === 'tax' && <EventTaxPanel />}
      {tab === 'orders' && <EventOrdersPanel />}
      {moreSelected && overflowItem && (
        <ComingSoonPanel label={overflowItem.label} icon={overflowItem.icon} tab={tab} onEdit={() => router.push(`/events/${eventId}/edit`)} />
      )}
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <PortalShell>
      <EventWorkspace />
    </PortalShell>
  );
}
