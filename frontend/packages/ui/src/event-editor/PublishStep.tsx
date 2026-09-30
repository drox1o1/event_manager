'use client';

import * as React from 'react';
import type { ListingType, OrganiserEventDetail } from '@showtik/api-client';
import { formatDateTime } from '@showtik/api-client';
import { Icon } from '../components/icons/Icon';
import { Switch } from '../components/forms/Switch';
import { Button } from '../components/forms/Button';
import { useIsMobile } from '../hooks/useMediaQuery';
import { FieldLabel, Notice, SectionTitle, errMessage } from './ui';
import type { EventEditorApi } from './types';

export interface PublishAction {
  label: string;
  /** Explains what happens, e.g. "Sends to the Showtik team for review". */
  hint: string;
  run: () => Promise<void>;
}

interface StepProps {
  api: EventEditorApi;
  token: string;
  event: OrganiserEventDetail;
  readOnly: boolean;
  blockers: string[];
  primary: PublishAction | null;
  secondary?: PublishAction | null;
  hostLabel: string;
  previewUrl: string;
  onChanged: () => void;
  onPublished: () => void;
}

const STATUS_COPY: Record<string, { title: string; body: string; tone: 'info' | 'success' | 'warning' | 'error' }> = {
  review: { title: 'Submitted for review', body: 'The Showtik team is reviewing your event — usually within 24 hours. You’ll see it go live here.', tone: 'info' },
  approved: { title: 'Approved', body: 'Your event has been approved and will go live shortly.', tone: 'success' },
  live: { title: 'Your event is live', body: 'Anyone can find it and book tickets now.', tone: 'success' },
  soldout: { title: 'Sold out', body: 'Every ticket has been booked.', tone: 'success' },
  deactivated: { title: 'Unpublished', body: 'This event is hidden from the public site.', tone: 'warning' },
};

/** Publish — listing type, discussions, host page, live preview card, and the
 *  final action (organiser: submit for review; super admin: publish now). */
export function PublishStep({ api, token, event, readOnly, blockers, primary, secondary, hostLabel, previewUrl, onChanged, onPublished }: StepProps) {
  const isMobile = useIsMobile();
  const [listing, setListing] = React.useState<ListingType>(event.listing_type);
  const [discussions, setDiscussions] = React.useState(event.allow_discussions);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const settingsDirty = listing !== event.listing_type || discussions !== event.allow_discussions;

  const saveSettings = async () => {
    await api.updateEvent(token, event.event_id, { listing_type: listing, allow_discussions: discussions });
  };

  const run = async (action: PublishAction, key: string) => {
    setBusy(key); setError(null);
    try {
      if (settingsDirty && !readOnly) await saveSettings();
      await action.run();
      onChanged();
      onPublished();
    } catch (err) {
      setError(errMessage(err, 'Something went wrong. Please try again.'));
    } finally { setBusy(null); }
  };

  const status = STATUS_COPY[event.status];

  return (
    <div>
      <SectionTitle title={event.status === 'draft' || event.status === 'rejected' ? 'Your event is almost ready to publish' : 'Publish settings'} description="Review your settings and let everyone find your event." />
      {status && <div style={{ marginBottom: 20 }}><Notice tone={status.tone}><strong>{status.title}.</strong> {status.body}</Notice></div>}
      {event.status === 'rejected' && event.rejection_reason && <div style={{ marginBottom: 20 }}><Notice tone="error"><strong>Changes requested:</strong> {event.rejection_reason}</Notice></div>}
      {error && <div style={{ marginBottom: 20 }}><Notice tone="error">{error}</Notice></div>}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: 36, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div>
            <FieldLabel required>Listing type</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {(['public', 'private'] as ListingType[]).map((t) => {
                const on = listing === t;
                return (
                  <button key={t} type="button" disabled={readOnly} onClick={() => setListing(t)} style={{ height: 58, borderRadius: 'var(--radius-control)', border: `1.5px solid ${on ? 'var(--color-success)' : 'var(--border-default)'}`, background: on ? 'var(--status-success-bg)' : 'var(--surface-card)', fontSize: 16, fontWeight: 600, color: 'var(--text-heading)', cursor: readOnly ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {t === 'public' ? 'Public' : 'Private'}{on && <Icon name="circle-check" size={17} color="var(--color-success)" />}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>{listing === 'public' ? 'Listed on Showtik — anyone can discover and book.' : 'Hidden from listings and search — only people with the link can book.'}</div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Allow discussions on your event <Icon name="info" size={15} color="var(--text-muted)" /></span>
            <Switch checked={discussions} disabled={readOnly} onChange={(e) => setDiscussions(e.target.checked)} />
          </label>

          <div>
            <FieldLabel required>Organizer page</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', padding: '12px 16px' }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{hostLabel.charAt(0).toUpperCase()}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{hostLabel}</span>
            </div>
          </div>

          {blockers.length > 0 && (
            <Notice tone="error">
              <strong>Before you can publish:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
            </Notice>
          )}
          {!event.banner_image_url && blockers.length === 0 && <Notice tone="warning">No banner yet — events with a banner get more bookings and can be featured on the homepage.</Notice>}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {primary && (
              <Button size="lg" disabled={blockers.length > 0} loading={busy === 'primary'} onClick={() => run(primary, 'primary')}>
                <Icon name="rocket" size={18} />{primary.label}
              </Button>
            )}
            {secondary && (
              <Button size="lg" variant="secondary" loading={busy === 'secondary'} onClick={() => run(secondary, 'secondary')}>{secondary.label}</Button>
            )}
            {!primary && settingsDirty && !readOnly && (
              <Button size="lg" loading={busy === 'save'} onClick={async () => { setBusy('save'); try { await saveSettings(); onChanged(); } catch (err) { setError(errMessage(err, 'Could not save.')); } finally { setBusy(null); } }}>Save settings</Button>
            )}
          </div>
          {primary && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -14 }}>{primary.hint}</div>}
        </div>

        <div>
          <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(5,23,71,0.12)', background: 'var(--surface-card)' }}>
            <div style={{ aspectRatio: '2 / 1', background: event.banner_image_url ? `center/cover no-repeat url(${event.banner_image_url})` : 'var(--gradient-poster)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
              {!event.banner_image_url && <Icon name="image" size={30} />}
            </div>
            <div style={{ padding: '18px 22px 22px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>{event.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={14} />{formatDateTime(event.event_date, event.event_time)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={14} />{event.location_type === 'venue' ? `${event.venue_name}, ${event.city}` : `Online · ${event.city}`}</span>
              </div>
            </div>
          </div>
          <a href={previewUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, fontWeight: 600, color: 'var(--text-heading)', textDecoration: 'none' }}>
            Preview your event <Icon name="arrow-up-right" size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
