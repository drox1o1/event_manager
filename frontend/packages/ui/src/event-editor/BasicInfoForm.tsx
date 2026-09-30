'use client';

import * as React from 'react';
import type { CategorySummary, EventCreateRequest, LocationType, OrganiserEventDetail, ScheduleType } from '@showtik/api-client';
import { Icon } from '../components/icons/Icon';
import { Input } from '../components/forms/Input';
import { Select } from '../components/forms/Select';
import { Button } from '../components/forms/Button';
import { useIsMobile } from '../hooks/useMediaQuery';
import { ChoiceCard, Divider, FieldError, FieldLabel, Notice, SubHeading, errMessage } from './ui';
import { RichTextArea } from './RichTextArea';
import type { HostOption } from './types';

export const TIMEZONES = [
  { value: 'Asia/Kolkata', label: '(GMT+05:30) India Standard Time - Kolkata' },
  { value: 'Asia/Dubai', label: '(GMT+04:00) Gulf Standard Time - Dubai' },
  { value: 'Asia/Singapore', label: '(GMT+08:00) Singapore Time' },
  { value: 'Europe/London', label: '(GMT+00:00) Greenwich Mean Time - London' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time - New York' },
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface BasicInfoValues {
  title: string;
  categoryId: string;
  /** Optional second category ('' = none). Max 2 categories per event. */
  secondCategoryId: string;
  locationType: LocationType;
  venueName: string;
  venueAddress: string;
  city: string;
  onlineUrl: string;
  scheduleType: ScheduleType;
  startDate: string;
  startTime: string;
  hasEnd: boolean;
  endDate: string;
  endTime: string;
  timezone: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  weekdays: number[];
  until: string;
  description: string;
  tags: string;
  hostId: string; // admin only; '' = platform-hosted
}

type Errors = Partial<Record<keyof BasicInfoValues, string>>;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function valuesFromEvent(e?: OrganiserEventDetail | null): BasicInfoValues {
  if (!e) {
    return {
      title: '', categoryId: '', secondCategoryId: '', locationType: 'venue', venueName: '', venueAddress: '', city: '', onlineUrl: '',
      scheduleType: 'single', startDate: '', startTime: '', hasEnd: false, endDate: '', endTime: '', timezone: 'Asia/Kolkata',
      frequency: 'weekly', weekdays: [], until: '', description: '', tags: '', hostId: '',
    };
  }
  const online = e.location_type !== 'venue';
  return {
    title: e.title,
    categoryId: e.category_id,
    secondCategoryId: e.category_ids?.[0] ?? '',
    locationType: e.location_type,
    venueName: online ? '' : e.venue_name,
    venueAddress: online ? '' : e.venue_address,
    city: e.city,
    onlineUrl: e.online_url ?? '',
    scheduleType: e.schedule_type,
    startDate: e.event_date,
    startTime: e.event_time.slice(0, 5),
    hasEnd: !!e.end_date,
    endDate: e.end_date ?? '',
    endTime: e.end_time ? e.end_time.slice(0, 5) : '',
    timezone: e.timezone || 'Asia/Kolkata',
    frequency: e.recurrence?.frequency ?? 'weekly',
    weekdays: e.recurrence?.weekdays ?? [],
    until: e.recurrence?.until ?? '',
    description: e.description,
    tags: (e.tags ?? []).join(', '),
    hostId: e.organiser_id ?? '',
  };
}

export function validateBasicInfo(v: BasicInfoValues, opts: { isNew: boolean; cities: string[] }): Errors {
  const e: Errors = {};
  if (v.title.trim().length < 3) e.title = 'Give your event a name (at least 3 characters).';
  if (!v.categoryId) e.categoryId = 'Choose a category.';
  if (!v.city) e.city = 'Choose the city this event is listed in.';
  else if (opts.cities.length > 0 && !opts.cities.includes(v.city)) e.city = 'This city is not available. Pick one from the list.';
  if (v.locationType === 'venue') {
    if (!v.venueName.trim()) e.venueName = 'Enter the venue name.';
    if (v.venueAddress.trim().length < 5) e.venueAddress = 'Enter the full venue address.';
  }
  if (v.locationType === 'online' && !/^https?:\/\/\S+\.\S+/.test(v.onlineUrl.trim())) e.onlineUrl = 'Enter a valid link, e.g. https://zoom.us/j/…';
  if (!v.startDate) e.startDate = 'Choose a start date.';
  else if (opts.isNew && v.startDate < today()) e.startDate = 'Start date can’t be in the past.';
  if (!v.startTime) e.startTime = 'Choose a start time.';
  if (v.hasEnd) {
    if (!v.endDate) e.endDate = 'Choose an end date.';
    else if (v.startDate && v.endDate < v.startDate) e.endDate = 'End date can’t be before the start date.';
    if (!v.endTime) e.endTime = 'Choose an end time.';
    else if (v.endDate === v.startDate && v.startTime && v.endTime <= v.startTime) e.endTime = 'End time must be after the start time.';
  }
  if (v.scheduleType === 'recurring') {
    if (!v.until) e.until = 'Choose when the event stops repeating.';
    else if (v.startDate && v.until < v.startDate) e.until = 'Must be on or after the start date.';
    if (v.frequency === 'weekly' && v.weekdays.length === 0) e.weekdays = 'Pick at least one day of the week.';
  }
  const plain = v.description.replace(/[*_#>\-]/g, '').trim();
  if (plain.length < 20) e.description = 'Describe your event in at least 20 characters.';
  return e;
}

export function toCreateRequest(v: BasicInfoValues, withHost: boolean): EventCreateRequest {
  const time = (t: string) => (t.length === 5 ? `${t}:00` : t);
  const body: EventCreateRequest = {
    title: v.title.trim(),
    category_id: v.categoryId,
    category_ids: v.secondCategoryId && v.secondCategoryId !== v.categoryId ? [v.secondCategoryId] : [],
    description: v.description.trim(),
    event_date: v.startDate,
    event_time: time(v.startTime),
    end_date: v.hasEnd ? v.endDate : null,
    end_time: v.hasEnd ? time(v.endTime) : null,
    timezone: v.timezone,
    location_type: v.locationType,
    online_url: v.locationType === 'online' ? v.onlineUrl.trim() : null,
    venue_name: v.locationType === 'venue' ? v.venueName.trim() : null,
    venue_address: v.locationType === 'venue' ? v.venueAddress.trim() : null,
    city: v.city,
    schedule_type: v.scheduleType,
    recurrence: v.scheduleType === 'recurring'
      ? { frequency: v.frequency, weekdays: v.frequency === 'weekly' ? v.weekdays : [], until: v.until }
      : null,
    tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12),
  };
  if (withHost) body.organiser_id = v.hostId || null;
  return body;
}

export interface BasicInfoFormProps {
  initial?: OrganiserEventDetail | null;
  categories: CategorySummary[];
  cities: string[];
  /** Admin: choose which organiser hosts the event. */
  hostOptions?: HostOption[];
  /** Organiser: their organiser page name, shown read-only. */
  hostLabel?: string;
  onManageHost?: () => void;
  /** localStorage key for autosaving an unsaved new-event draft. */
  draftKey?: string;
  submitLabel: string;
  onSubmit: (body: EventCreateRequest) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  disabled?: boolean;
  disabledReason?: React.ReactNode;
}

/** Basic Info — name, location, date & time, description, host page.
 *  Validates inline and refuses to continue until every error is fixed. */
export function BasicInfoForm({
  initial, categories, cities, hostOptions, hostLabel, onManageHost, draftKey, submitLabel, onSubmit, onDirtyChange, disabled, disabledReason,
}: BasicInfoFormProps) {
  const isMobile = useIsMobile();
  const isNew = !initial;
  const [v, setV] = React.useState<BasicInfoValues>(() => valuesFromEvent(initial));
  const [errors, setErrors] = React.useState<Errors>({});
  const [touched, setTouched] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [restored, setRestored] = React.useState(false);
  const topRef = React.useRef<HTMLDivElement>(null);

  // Restore an autosaved new-event draft.
  React.useEffect(() => {
    if (!draftKey || !isNew) return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) { setV({ ...valuesFromEvent(null), ...JSON.parse(raw) }); setRestored(true); }
    } catch { /* storage unavailable */ }
  }, [draftKey, isNew]);

  React.useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  const set = <K extends keyof BasicInfoValues>(key: K, value: BasicInfoValues[K]) => {
    setV((prev) => {
      const next = { ...prev, [key]: value };
      if (draftKey && isNew) { try { window.localStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* ignore */ } }
      if (touched) setErrors(validateBasicInfo(next, { isNew, cities }));
      return next;
    });
    setDirty(true);
  };

  const submit = async () => {
    setTouched(true);
    const errs = validateBasicInfo(v, { isNew, cities });
    setErrors(errs);
    setApiError(null);
    if (Object.keys(errs).length > 0) {
      const first = document.querySelector('[data-field-error="true"]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(toCreateRequest(v, !!hostOptions));
      setDirty(false);
      if (draftKey) { try { window.localStorage.removeItem(draftKey); } catch { /* ignore */ } }
    } catch (err) {
      setApiError(errMessage(err, 'Could not save. Please try again.'));
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const discardDraft = () => {
    if (draftKey) { try { window.localStorage.removeItem(draftKey); } catch { /* ignore */ } }
    setV(valuesFromEvent(null));
    setRestored(false);
    setErrors({});
    setDirty(false);
  };

  const errBox = (key: keyof BasicInfoValues) => (errors[key] ? { 'data-field-error': 'true' } : {});
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 };
  const errorCount = Object.keys(errors).length;

  return (
    <div ref={topRef} style={{ display: 'flex', flexDirection: 'column' }}>
      {restored && (
        <div style={{ marginBottom: 20 }}>
          <Notice>We restored the event you were creating. <button type="button" onClick={discardDraft} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Start over</button></Notice>
        </div>
      )}
      {disabled && disabledReason && <div style={{ marginBottom: 20 }}><Notice tone="warning">{disabledReason}</Notice></div>}
      {apiError && <div style={{ marginBottom: 20 }}><Notice tone="error">{apiError}</Notice></div>}
      {touched && errorCount > 0 && (
        <div style={{ marginBottom: 20 }}><Notice tone="error">Fix the {errorCount} highlighted field{errorCount === 1 ? '' : 's'} to continue.</Notice></div>
      )}

      <div {...errBox('title')}>
        <Input label="Event Name *" placeholder="Enter the name of your event" value={v.title} maxLength={200} error={errors.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div style={{ ...grid2, marginTop: 16 }}>
        <div {...errBox('categoryId')}>
          <Select label="Category *" value={v.categoryId} placeholder="Choose a category" options={categories.map((c) => ({ value: c.id, label: c.name }))} error={errors.categoryId} onChange={(e) => { set('categoryId', e.target.value); if (e.target.value === v.secondCategoryId) set('secondCategoryId', ''); }} />
        </div>
        <Select
          label="Second category (optional)"
          value={v.secondCategoryId || 'none'}
          disabled={!v.categoryId}
          options={[{ value: 'none', label: 'None' }, ...categories.filter((c) => c.id !== v.categoryId).map((c) => ({ value: c.id, label: c.name }))]}
          onChange={(e) => set('secondCategoryId', e.target.value === 'none' ? '' : e.target.value)}
        />
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>Your event is listed under up to 2 categories, e.g. Marathon + Sports.</div>
      <div style={{ marginTop: 16 }}>
        <Input label="Tags" placeholder="Running, Marathon, Fitness" value={v.tags} onChange={(e) => set('tags', e.target.value)} />
      </div>

      <Divider />
      <SubHeading hint="Choose where your event will take place.">Location</SubHeading>
      <FieldLabel>Where will your event take place?</FieldLabel>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        <ChoiceCard compact icon="map-pin" title="Venue" description="Host in-person events with check-in management." selected={v.locationType === 'venue'} onClick={() => set('locationType', 'venue')} />
        <ChoiceCard compact icon="monitor-play" title="Online" description="Host virtual events, sharing access with ticket buyers." selected={v.locationType === 'online'} onClick={() => set('locationType', 'online')} />
        <ChoiceCard compact icon="circle-play" title="Recorded events" description="Provide instant access to pre-recorded content after purchase." selected={v.locationType === 'recorded'} onClick={() => set('locationType', 'recorded')} />
      </div>
      {v.locationType === 'venue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div {...errBox('venueName')}>
            <Input label="Venue name *" icon="building-2" placeholder="Shaheed Deputy Commandant Veer Singh Stadium" value={v.venueName} error={errors.venueName} onChange={(e) => set('venueName', e.target.value)} />
          </div>
          <div {...errBox('venueAddress')}>
            <Input label="Full address *" icon="map-pin" placeholder="Street, area, landmark, PIN code" value={v.venueAddress} error={errors.venueAddress} onChange={(e) => set('venueAddress', e.target.value)} />
          </div>
        </div>
      )}
      {v.locationType === 'online' && (
        <div {...errBox('onlineUrl')}>
          <Input label="Online event link *" icon="link" placeholder="https://zoom.us/j/…" value={v.onlineUrl} error={errors.onlineUrl} onChange={(e) => set('onlineUrl', e.target.value)} />
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>Only shared with ticket buyers on their order confirmation.</div>
        </div>
      )}
      <div style={{ marginTop: 16, maxWidth: isMobile ? '100%' : 'calc(50% - 8px)' }} {...errBox('city')}>
        <Select label="City *" value={v.city} placeholder={cities.length ? 'Choose a city' : 'No cities available'} options={cities} error={errors.city} onChange={(e) => set('city', e.target.value)} />
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>Events can only be listed in cities enabled by the Showtik team.</div>
      </div>

      <Divider />
      <SubHeading hint="Select the event date, time, and timezone.">Date and time</SubHeading>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>How often does your event happen?</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>Single Event tickets cover the whole event; Recurring Event buyers pick which session they attend.</div>
      <div style={{ ...grid2, marginBottom: 20 }}>
        <ChoiceCard icon="calendar-days" title="Single" description="Happens once — one day or across multiple days. One ticket setup for the whole event." note="Works for most events: concerts, festivals, conferences, workshops." selected={v.scheduleType === 'single'} onClick={() => set('scheduleType', 'single')} />
        <ChoiceCard icon="calendar-sync" title="Recurring" description="Repeats frequently — daily, weekly, or monthly. Attendees pick their session." note="For things like daily tours or weekly classes." selected={v.scheduleType === 'recurring'} onClick={() => set('scheduleType', 'recurring')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div {...errBox('startDate')}><Input label="Start date *" type="date" value={v.startDate} error={errors.startDate} onChange={(e) => set('startDate', e.target.value)} /></div>
        <div {...errBox('startTime')}><Input label="Start time *" type="time" value={v.startTime} error={errors.startTime} onChange={(e) => set('startTime', e.target.value)} /></div>
        {!v.hasEnd && (
          <button type="button" onClick={() => set('hasEnd', true)} style={{ alignSelf: 'end', height: 44, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-heading)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            <Icon name="plus" size={16} /> Add end time
          </button>
        )}
      </div>
      {v.hasEnd && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 16, alignItems: 'start', marginTop: 16 }}>
          <div {...errBox('endDate')}><Input label="End date *" type="date" value={v.endDate} error={errors.endDate} onChange={(e) => set('endDate', e.target.value)} /></div>
          <div {...errBox('endTime')}><Input label="End time *" type="time" value={v.endTime} error={errors.endTime} onChange={(e) => set('endTime', e.target.value)} /></div>
          <button type="button" onClick={() => { set('hasEnd', false); set('endDate', ''); set('endTime', ''); }} style={{ alignSelf: 'end', height: 44, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            <Icon name="x" size={15} /> Remove end time
          </button>
        </div>
      )}

      {v.scheduleType === 'recurring' && (
        <div style={{ marginTop: 18, padding: 18, border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-card)', background: 'var(--color-off-white)' }}>
          <div style={grid2}>
            <Select label="Repeats" value={v.frequency} options={[{ value: 'daily', label: 'Every day' }, { value: 'weekly', label: 'Every week' }, { value: 'monthly', label: 'Every month (same date)' }]} onChange={(e) => set('frequency', e.target.value as BasicInfoValues['frequency'])} />
            <div {...errBox('until')}><Input label="Repeat until *" type="date" value={v.until} error={errors.until} onChange={(e) => set('until', e.target.value)} /></div>
          </div>
          {v.frequency === 'weekly' && (
            <div style={{ marginTop: 14 }} {...errBox('weekdays')}>
              <FieldLabel required>On these days</FieldLabel>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {WEEKDAYS.map((d, i) => {
                  const on = v.weekdays.includes(i);
                  return (
                    <button key={d} type="button" onClick={() => set('weekdays', on ? v.weekdays.filter((x) => x !== i) : [...v.weekdays, i].sort())} style={{ width: 52, height: 38, borderRadius: 'var(--radius-pill)', border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--border-default)'}`, background: on ? 'var(--color-accent)' : 'var(--surface-card)', color: on ? '#fff' : 'var(--text-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{d}</button>
                  );
                })}
              </div>
              <FieldError message={errors.weekdays} />
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 16, maxWidth: isMobile ? '100%' : 'calc(66% - 8px)' }}>
        <Select label="Time Zone *" value={v.timezone} options={TIMEZONES} onChange={(e) => set('timezone', e.target.value)} />
      </div>

      <Divider />
      <div {...errBox('description')}>
        <FieldLabel required>Event Description</FieldLabel>
        <RichTextArea value={v.description} onChange={(val) => set('description', val)} error={!!errors.description} placeholder="Tell attendees what to expect — schedule, categories, eligibility, what's included…" />
        <FieldError message={errors.description} />
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        {hostOptions ? (
          <div style={{ flex: '1 1 320px', maxWidth: 480 }}>
            <Select label="Organizer Page" value={v.hostId || '__platform'} options={[{ value: '__platform', label: 'Showtik (platform-hosted)' }, ...hostOptions.map((h) => ({ value: h.id, label: h.name }))]} onChange={(e) => set('hostId', e.target.value === '__platform' ? '' : e.target.value)} />
          </div>
        ) : hostLabel ? (
          <div style={{ flex: '1 1 320px', maxWidth: 480 }}>
            <FieldLabel>Organizer Page</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', padding: '10px 14px', background: 'var(--surface-card)' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{hostLabel.charAt(0).toUpperCase()}</span>
              <span style={{ fontSize: 15, color: 'var(--text-body)', fontWeight: 600 }}>{hostLabel}</span>
            </div>
          </div>
        ) : null}
        {onManageHost && (
          <button type="button" onClick={onManageHost} style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-heading)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            <Icon name="pencil" size={15} /> Edit organizer page
          </button>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <Button size="lg" onClick={submit} loading={submitting} disabled={disabled} style={{ minWidth: 170 }}>{submitLabel}</Button>
      </div>
    </div>
  );
}
