'use client';

import * as React from 'react';
import type { CategorySummary, OrganiserEventDetail } from '@showtik/api-client';
import { publicApi, formatEventDate } from '@showtik/api-client';
import { Icon } from '../components/icons/Icon';
import { LogoMark } from '../components/brand/Logo';
import { PageLoader } from '../components/brand/PageLoader';
import { useIsMobile } from '../hooks/useMediaQuery';
import { BasicInfoForm } from './BasicInfoForm';
import { MediaStep } from './MediaStep';
import { TicketsStep } from './TicketsStep';
import { RegistrationFormStep } from './RegistrationFormStep';
import { PublishStep } from './PublishStep';
import type { PublishAction } from './PublishStep';
import { NotifyStep } from './NotifyStep';
import { Notice, SectionTitle, errMessage } from './ui';
import { EDITOR_SECTIONS } from './types';
import type { EditorSection, EventEditorApi, HostOption } from './types';

export interface EditorLink {
  label: string;
  icon: string;
  onClick: () => void;
}

export interface EventEditorProps {
  api: EventEditorApi;
  token: string;
  eventId: string;
  section: EditorSection;
  onSectionChange: (section: EditorSection) => void;
  mode: 'organiser' | 'admin';
  /** Admin: organisers the event can be hosted by. */
  hostOptions?: HostOption[];
  /** Organiser: their own organiser-page name. */
  hostLabel?: string;
  onManageHost?: () => void;
  publicSiteUrl: string;
  /** Final publish action(s) for the Publish step, per portal. */
  publishActions: (event: OrganiserEventDetail) => { primary: PublishAction | null; secondary?: PublishAction | null };
  links: EditorLink[];
  onExit: () => void;
  exitLabel?: string;
}

const STATUS_PILL: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#F5A524' },
  review: { label: 'In review', color: '#2253F6' },
  approved: { label: 'Approved', color: '#1A7A4A' },
  rejected: { label: 'Changes requested', color: '#C0392B' },
  live: { label: 'Live', color: '#1A7A4A' },
  soldout: { label: 'Sold out', color: '#666' },
  deactivated: { label: 'Unpublished', color: '#999' },
};

/** Full-screen, step-by-step event editor (allevents-style): left rail with
 *  Basic Info → Media → Tickets → Registration form → Publish → Notify, each
 *  with a done check or an outstanding red dot. Steps save independently as a
 *  draft; unsaved/invalid changes block leaving the step. */
export function EventEditor(props: EventEditorProps) {
  const { api, token, eventId, section, onSectionChange, mode, hostOptions, hostLabel, onManageHost, publicSiteUrl, publishActions, links, onExit, exitLabel = 'All Events' } = props;
  const isMobile = useIsMobile();
  const [event, setEvent] = React.useState<OrganiserEventDetail | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<CategorySummary[]>([]);
  const [cities, setCities] = React.useState<string[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [guard, setGuard] = React.useState<string | null>(null);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [navOpen, setNavOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setEvent(await api.getEvent(token, eventId));
    } catch (err) {
      setLoadError(errMessage(err, 'Could not load this event.'));
    }
  }, [api, token, eventId]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    publicApi.listCategories().then((r) => setCategories(r.categories)).catch(() => setCategories([]));
    publicApi.getSiteChrome().then((r) => setCities(r.cities)).catch(() => setCities([]));
  }, []);

  // Warn before closing the tab with unsaved changes.
  React.useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const onDirtyChange = React.useCallback((d: boolean) => { setDirty(d); if (!d) setGuard(null); }, []);

  if (loadError) return <div style={{ padding: 40 }}><Notice tone="error">{loadError}</Notice></div>;
  if (!event) return <PageLoader variant="inline" />;

  const editable = mode === 'admin' || event.status === 'draft' || event.status === 'rejected';
  const hasTickets = event.ticket_tiers.length > 0;
  const published = !['draft', 'rejected'].includes(event.status);
  const blockers: string[] = [];
  if (!hasTickets) blockers.push('Add at least one ticket type');
  else if (event.ticket_tiers.every((t) => t.sale_status !== 'on_sale')) blockers.push('At least one ticket type must be on sale');

  const done: Record<EditorSection, boolean> = {
    basic: true,
    media: !!event.banner_image_url,
    tickets: hasTickets,
    form: event.form_fields.length > 0,
    publish: published,
    notify: event.status === 'live' || event.status === 'soldout',
  };
  const optional: Partial<Record<EditorSection, boolean>> = { form: true };
  const lockedReason = (s: EditorSection): string | null => {
    if (s === 'publish' && !hasTickets) return 'Add at least one ticket before publishing.';
    if (s === 'notify' && !published) return 'Publish your event first.';
    return null;
  };

  const go = (s: EditorSection) => {
    if (s === section) return;
    if (dirty) { setGuard('You have unsaved changes on this step. Save them (or fix the highlighted errors) before moving on.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const locked = lockedReason(s);
    if (locked) { setGuard(locked); return; }
    setGuard(null);
    setNavOpen(false);
    onSectionChange(s);
    window.scrollTo({ top: 0 });
  };

  const nextOf = (s: EditorSection): EditorSection => {
    const i = EDITOR_SECTIONS.findIndex((x) => x.key === s);
    return EDITOR_SECTIONS[Math.min(i + 1, EDITOR_SECTIONS.length - 1)].key;
  };

  const afterSave = async (goNext: boolean) => {
    await load();
    setDirty(false);
    setFlash('Saved as draft');
    setTimeout(() => setFlash(null), 1800);
    if (goNext) { onSectionChange(nextOf(section)); window.scrollTo({ top: 0 }); }
  };

  const host = event.organiser_name ?? hostLabel ?? 'Showtik';
  const publicUrl = `${publicSiteUrl.replace(/\/+$/, '')}/events/${event.event_id}`;
  const pill = STATUS_PILL[event.status] ?? STATUS_PILL.draft;
  const actions = publishActions(event);

  const nav = (
    <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '18px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: 'var(--text-heading)', fontWeight: 700, fontSize: 15 }}>
          <Icon name="square-pen" size={18} /> Edit event
        </div>
        <div style={{ marginLeft: 20, borderLeft: '2px solid var(--border-default)', paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {EDITOR_SECTIONS.map((s) => {
            const active = s.key === section;
            const locked = !!lockedReason(s.key);
            return (
              <button key={s.key} type="button" onClick={() => go(s.key)} aria-current={active ? 'step' : undefined} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: 'none', borderRadius: 8, background: active ? 'var(--surface-accent-tint)' : 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14.5, fontWeight: active ? 700 : 500, color: locked ? 'var(--text-subtle)' : 'var(--text-heading)' }}>
                {active && <span style={{ position: 'absolute', left: -6, top: 8, bottom: 8, width: 3, borderRadius: 2, background: 'var(--color-accent)' }} />}
                {done[s.key]
                  ? <Icon name="circle-check" size={18} color="var(--color-success)" />
                  : locked ? <Icon name="lock" size={16} color="var(--text-subtle)" /> : <Icon name="circle" size={18} color="var(--text-subtle)" />}
                <span style={{ flex: 1 }}>{s.label}</span>
                {!done[s.key] && !optional[s.key] && !locked && <span aria-label="Needs attention" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-error)' }} />}
                {optional[s.key] && !done[s.key] && <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Optional</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map((l) => (
          <button key={l.label} type="button" onClick={() => { if (dirty) { setGuard('Save your changes before leaving this step.'); return; } l.onClick(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: 'none', background: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14.5, color: 'var(--text-heading)', textAlign: 'left' }}>
            <Icon name={l.icon} size={18} />{l.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ borderTop: '1px solid var(--border-default)', padding: '14px 16px' }}>
        <button type="button" onClick={() => { if (dirty && !window.confirm('Leave without saving your changes?')) return; onExit(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', color: 'var(--color-accent)', fontWeight: 700, fontSize: 14.5, cursor: 'pointer', padding: '6px 8px' }}>
          <Icon name="chevron-left" size={16} />{exitLabel}
        </button>
      </div>
    </nav>
  );

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-card)', fontFamily: 'var(--font-sans)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 14, height: 64, padding: '0 20px', background: 'var(--surface-card)', borderBottom: '1px solid var(--border-default)' }}>
        {isMobile && <button type="button" aria-label="Open steps" onClick={() => setNavOpen(true)} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex' }}><Icon name="menu" size={22} /></button>}
        <LogoMark style={{ height: 30 }} />
        {!isMobile && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-heading)' }}>showtik</span>}
        <Icon name="chevron-right" size={16} color="var(--text-subtle)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-default)', borderRadius: 12, padding: '6px 12px', minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: pill.color, flex: 'none' }} title={pill.label} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? 150 : 320 }}>{event.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatEventDate(event.event_date)} · {event.city} · {pill.label}</div>
          </div>
          <a href={publicUrl} target="_blank" rel="noreferrer" aria-label="Open public page" style={{ color: 'var(--text-muted)', display: 'flex' }}><Icon name="arrow-up-right" size={16} /></a>
        </div>
        <span style={{ flex: 1 }} />
        {flash && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-success)', fontWeight: 600 }}><Icon name="check" size={15} />{flash}</span>}
        {dirty && !flash && <span style={{ fontSize: 13, color: 'var(--status-warning-text)', fontWeight: 600 }}>Unsaved changes</span>}
      </header>

      <div style={{ display: 'flex' }}>
        {!isMobile && (
          <aside style={{ width: 290, flex: 'none', borderRight: '1px solid var(--border-default)', position: 'sticky', top: 64, height: 'calc(100dvh - 64px)', overflowY: 'auto' }}>{nav}</aside>
        )}
        {isMobile && navOpen && (
          <div onClick={() => setNavOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--surface-overlay)' }}>
            <aside onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 290, maxWidth: '85vw', background: 'var(--surface-card)' }}>{nav}</aside>
          </div>
        )}

        <main style={{ flex: 1, minWidth: 0, padding: isMobile ? '24px 16px 40px' : '40px 48px 56px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {guard && <div style={{ marginBottom: 20 }}><Notice tone="warning">{guard}</Notice></div>}

            {section === 'basic' && (
              <>
                <SectionTitle title="Basic info" description="The essentials — name, where, when, and what to expect." />
                <BasicInfoForm
                  key={event.event_id}
                  initial={event}
                  categories={categories}
                  cities={cities}
                  hostOptions={mode === 'admin' ? hostOptions : undefined}
                  hostLabel={mode === 'organiser' ? host : undefined}
                  onManageHost={onManageHost}
                  submitLabel="Save & continue"
                  disabled={!editable}
                  disabledReason={!editable ? 'This event has been submitted, so its details are locked. Contact the Showtik team to request changes.' : undefined}
                  onDirtyChange={onDirtyChange}
                  onSubmit={async (body) => {
                    const { organiser_id, ...rest } = body;
                    await api.updateEvent(token, event.event_id, mode === 'admin' ? { ...rest, organiser_id } : rest);
                    await afterSave(true);
                  }}
                />
              </>
            )}
            {section === 'media' && <MediaStep key={event.event_id} api={api} token={token} event={event} readOnly={!editable} onDirtyChange={onDirtyChange} onSaved={afterSave} />}
            {section === 'tickets' && <TicketsStep api={api} token={token} event={event} readOnly={event.status === 'deactivated' && mode !== 'admin'} onChanged={() => { load(); setFlash('Saved'); setTimeout(() => setFlash(null), 1500); }} onContinue={() => go('form')} />}
            {section === 'form' && <RegistrationFormStep key={event.event_id} api={api} token={token} event={event} readOnly={!editable} onDirtyChange={onDirtyChange} onSaved={afterSave} />}
            {section === 'publish' && (
              <PublishStep api={api} token={token} event={event} readOnly={!editable} blockers={blockers} primary={actions.primary} secondary={actions.secondary} hostLabel={host} previewUrl={publicUrl} onChanged={load} onPublished={() => { setFlash('Done'); setTimeout(() => setFlash(null), 1800); }} />
            )}
            {section === 'notify' && <NotifyStep event={event} publicUrl={publicUrl} />}
          </div>
        </main>
      </div>
    </div>
  );
}
