'use client';

import * as React from 'react';
import type { OrganiserEventDetail, OrganiserEventTier, TicketTierCreateInput, TicketType } from '@showtik/api-client';
import { formatINR } from '@showtik/api-client';
import { Icon } from '../components/icons/Icon';
import { Input } from '../components/forms/Input';
import { Textarea } from '../components/forms/Textarea';
import { Switch } from '../components/forms/Switch';
import { Button } from '../components/forms/Button';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Card, FieldError, FieldLabel, Notice, SectionTitle, errMessage } from './ui';
import type { EventEditorApi } from './types';

interface TicketDraft {
  ticket_type: TicketType | '';
  name: string;
  quantity: string;
  price: string;
  description: string;
  grouped: boolean;
  group_name: string;
  requires_approval: boolean;
  min_per_order: string;
  max_per_order: string;
  sale_start: string;
  sale_end: string;
  min_age: string;
  max_age: string;
}
type DraftErrors = Partial<Record<keyof TicketDraft, string>>;

const EMPTY: TicketDraft = {
  ticket_type: '', name: '', quantity: '', price: '', description: '', grouped: false, group_name: '',
  requires_approval: false, min_per_order: '1', max_per_order: '10', sale_start: '', sale_end: '', min_age: '', max_age: '',
};

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromTier(t: OrganiserEventTier): TicketDraft {
  return {
    ticket_type: t.ticket_type, name: t.name, quantity: String(t.quantity_total), price: t.ticket_type === 'free' ? '' : String(Number(t.price)),
    description: t.description ?? '', grouped: !!t.group_name, group_name: t.group_name ?? '', requires_approval: t.requires_approval,
    min_per_order: String(t.min_per_order), max_per_order: String(t.max_per_order), sale_start: toLocalInput(t.sale_start), sale_end: toLocalInput(t.sale_end),
    min_age: t.min_age != null ? String(t.min_age) : '', max_age: t.max_age != null ? String(t.max_age) : '',
  };
}

function validate(d: TicketDraft, sold: number): DraftErrors {
  const e: DraftErrors = {};
  if (!d.ticket_type) e.ticket_type = 'Choose a ticket type.';
  if (!d.name.trim()) e.name = 'Enter a ticket name.';
  const qty = Number(d.quantity);
  if (!d.quantity || !Number.isInteger(qty) || qty < 1) e.quantity = 'Enter how many tickets are on sale (1 or more).';
  else if (qty < sold) e.quantity = `Can't be below the ${sold} already sold.`;
  if (d.ticket_type === 'paid') {
    const p = Number(d.price);
    if (!d.price || Number.isNaN(p) || p <= 0) e.price = 'Enter a ticket price above ₹0.';
  }
  if (d.ticket_type === 'donation') {
    const p = Number(d.price || '0');
    if (Number.isNaN(p) || p < 0) e.price = 'Enter a valid minimum amount.';
  }
  const mn = Number(d.min_per_order); const mx = Number(d.max_per_order);
  if (!Number.isInteger(mn) || mn < 1) e.min_per_order = 'At least 1.';
  if (!Number.isInteger(mx) || mx < 1 || mx > 100) e.max_per_order = 'Between 1 and 100.';
  else if (mn > mx) e.max_per_order = 'Must be ≥ the minimum.';
  if (d.grouped && !d.group_name.trim()) e.group_name = 'Enter a group name.';
  if (d.sale_start && d.sale_end && d.sale_end <= d.sale_start) e.sale_end = 'Sale end must be after sale start.';
  const ageOk = (v: string) => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 120);
  if (!ageOk(d.min_age)) e.min_age = 'Enter an age between 1 and 120.';
  if (!ageOk(d.max_age)) e.max_age = 'Enter an age between 1 and 120.';
  if (!e.min_age && !e.max_age && d.min_age && d.max_age && Number(d.min_age) > Number(d.max_age)) e.max_age = 'Must be ≥ the minimum age.';
  return e;
}

function toInput(d: TicketDraft, saleStatus: 'on_sale' | 'paused'): TicketTierCreateInput {
  return {
    name: d.name.trim(),
    ticket_type: d.ticket_type as TicketType,
    price: d.ticket_type === 'free' ? '0' : String(Number(d.price || '0')),
    quantity_total: Number(d.quantity),
    description: d.description.trim() || null,
    min_per_order: Number(d.min_per_order),
    max_per_order: Number(d.max_per_order),
    requires_approval: d.requires_approval,
    group_name: d.grouped ? d.group_name.trim() : null,
    sale_status: saleStatus,
    sale_start: d.sale_start ? new Date(d.sale_start).toISOString() : null,
    sale_end: d.sale_end ? new Date(d.sale_end).toISOString() : null,
    min_age: d.min_age ? Number(d.min_age) : null,
    max_age: d.max_age ? Number(d.max_age) : null,
  };
}

export function ageLabel(min: number | null | undefined, max: number | null | undefined): string {
  if (min != null && max != null) return `Age ${min}–${max}`;
  if (min != null) return `${min}+ years`;
  return `Up to ${max} years`;
}

const TYPE_LABEL: Record<TicketType, string> = { paid: 'Paid', free: 'Free', donation: 'Donation' };

interface StepProps {
  api: EventEditorApi;
  token: string;
  event: OrganiserEventDetail;
  readOnly: boolean;
  onChanged: () => void;
  onContinue: () => void;
}

/** Tickets — empty state → "Add tickets" drawer (Paid / Free / Donation),
 *  then a table of ticket types, each with its own id, status, price, sold/qty. */
export function TicketsStep({ api, token, event, readOnly, onChanged, onContinue }: StepProps) {
  const isMobile = useIsMobile();
  const [drawer, setDrawer] = React.useState<{ tier: OrganiserEventTier | null } | null>(null);
  const [menu, setMenu] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const tiers = event.ticket_tiers;

  const togglePause = async (t: OrganiserEventTier) => {
    setMenu(null); setBusy(t.id); setError(null);
    try {
      await api.updateTicketTier(token, event.event_id, t.id, toInput(fromTier(t), t.sale_status === 'on_sale' ? 'paused' : 'on_sale'));
      onChanged();
    } catch (err) { setError(errMessage(err, 'Could not update the ticket.')); } finally { setBusy(null); }
  };

  const remove = async (t: OrganiserEventTier) => {
    setMenu(null);
    if (!window.confirm(`Delete "${t.name}"? This can't be undone.`)) return;
    setBusy(t.id); setError(null);
    try { await api.deleteTicketTier(token, event.event_id, t.id); onChanged(); }
    catch (err) { setError(errMessage(err, 'Could not delete the ticket.')); } finally { setBusy(null); }
  };

  return (
    <div onClick={() => menu && setMenu(null)}>
      <SectionTitle
        title="Tickets"
        description="Create paid tickets, free entries and donation entries. Each ticket type gets its own ID."
        actions={tiers.length > 0 && !readOnly ? <Button onClick={() => setDrawer({ tier: null })}><Icon name="ticket-plus" size={17} />Add tickets</Button> : undefined}
      />
      {error && <div style={{ marginBottom: 16 }}><Notice tone="error">{error}</Notice></div>}

      {tiers.length === 0 ? (
        <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', overflow: 'hidden', background: 'var(--surface-card)' }}>
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Set up ticketing</div>
            <div style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 24 }}>Create paid tickets, free entries and custom donation entries</div>
            {!readOnly && <Button size="lg" onClick={() => setDrawer({ tier: null })}><Icon name="plus" size={18} />Add tickets</Button>}
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-default)', background: 'var(--color-off-white)', fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="shield-check" size={16} /> Secure ticketing managed by Showtik
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)' }}>
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 100px 44px', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border-default)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>Ticket Details</span><span>Status</span><span style={{ textAlign: 'right' }}>Price</span><span style={{ textAlign: 'right' }}>Sold/Qty</span><span />
            </div>
          )}
          {tiers.map((t, i) => (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 44px' : '1fr 110px 110px 100px 44px', gap: 12, alignItems: 'center', padding: '16px 20px', borderBottom: i < tiers.length - 1 ? '1px solid var(--border-default)' : 'none', opacity: busy === t.id ? 0.5 : 1 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>{t.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>{TYPE_LABEL[t.ticket_type]}</span>
                  {t.group_name && <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-accent-secondary-tint)', color: 'var(--color-accent-secondary)', fontWeight: 600 }}>{t.group_name}</span>}
                  {(t.min_age != null || t.max_age != null) && <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-accent-tint)', color: 'var(--color-accent)', fontWeight: 700 }}>{ageLabel(t.min_age, t.max_age)}</span>}
                  {t.requires_approval && <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', fontWeight: 600 }}>Needs approval</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>ID: {t.code}</div>
                {isMobile && <div style={{ fontSize: 13, color: 'var(--text-body)', marginTop: 6 }}>{t.ticket_type === 'donation' ? `Min ${formatINR(t.price)}` : formatINR(t.price)} · {t.quantity_sold}/{t.quantity_total} · {t.sale_status === 'on_sale' ? 'On sale' : 'Paused'}</div>}
              </div>
              {!isMobile && (
                <>
                  <span><span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 9px', borderRadius: 'var(--radius-pill)', border: `1px solid ${t.sale_status === 'on_sale' ? 'var(--color-success)' : 'var(--border-default)'}`, background: t.sale_status === 'on_sale' ? 'var(--status-success-bg)' : 'var(--status-muted-bg)', color: t.sale_status === 'on_sale' ? 'var(--status-success-text)' : 'var(--status-muted-text)', textTransform: 'uppercase' }}>{t.sale_status === 'on_sale' ? 'On sale' : 'Paused'}</span></span>
                  <span style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-heading)' }}>{t.ticket_type === 'donation' ? `≥ ${formatINR(t.price)}` : formatINR(t.price)}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-body)' }}>{t.quantity_sold}/{t.quantity_total}</span>
                </>
              )}
              <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                {!readOnly && (
                  <button type="button" aria-label="Ticket actions" onClick={() => setMenu(menu === t.id ? null : t.id)} style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-heading)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="ellipsis-vertical" size={18} />
                  </button>
                )}
                {menu === t.id && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, width: 180, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', boxShadow: '0 12px 32px rgba(0,0,0,0.14)', padding: 6 }}>
                    <MenuItem icon="pencil" label="Edit" onClick={() => { setMenu(null); setDrawer({ tier: t }); }} />
                    <MenuItem icon={t.sale_status === 'on_sale' ? 'pause' : 'play'} label={t.sale_status === 'on_sale' ? 'Pause sales' : 'Resume sales'} onClick={() => togglePause(t)} />
                    <MenuItem icon="trash-2" label="Delete" danger disabled={t.quantity_sold > 0} onClick={() => remove(t)} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tiers.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <Card>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 10 }}>How do you want to collect payments?</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-heading)' }}><Icon name="badge-check" size={18} color="var(--color-accent)" />You are accepting payments through Showtik.</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 6 }}>Buyers pay once per order — each participant still gets their own ticket ID.</div>
          </Card>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <Button onClick={onContinue}>Continue</Button>
          </div>
        </div>
      )}

      {drawer && (
        <TicketDrawer
          tier={drawer.tier}
          onClose={() => setDrawer(null)}
          onSave={async (input) => {
            if (drawer.tier) await api.updateTicketTier(token, event.event_id, drawer.tier.id, input);
            else await api.createTicketTiers(token, event.event_id, [input]);
            setDrawer(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger, disabled }: { icon: string; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} title={disabled ? 'Tickets already sold — pause instead' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', border: 'none', background: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? 'var(--text-subtle)' : danger ? 'var(--color-error)' : 'var(--text-body)', textAlign: 'left' }}>
      <Icon name={icon} size={15} />{label}
    </button>
  );
}

function TicketDrawer({ tier, onClose, onSave }: { tier: OrganiserEventTier | null; onClose: () => void; onSave: (input: TicketTierCreateInput) => Promise<void> }) {
  const [d, setD] = React.useState<TicketDraft>(() => (tier ? fromTier(tier) : EMPTY));
  const [errors, setErrors] = React.useState<DraftErrors>({});
  const [touched, setTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [advanced, setAdvanced] = React.useState(false);
  const sold = tier?.quantity_sold ?? 0;

  const set = <K extends keyof TicketDraft>(k: K, val: TicketDraft[K]) => {
    setD((prev) => { const next = { ...prev, [k]: val }; if (touched) setErrors(validate(next, sold)); return next; });
  };

  const save = async () => {
    setTouched(true);
    const errs = validate(d, sold);
    setErrors(errs);
    if (Object.keys(errs).length) { if (errs.min_per_order || errs.max_per_order || errs.sale_end) setAdvanced(true); return; }
    setSaving(true); setApiError(null);
    try { await onSave(toInput(d, tier?.sale_status ?? 'on_sale')); }
    catch (err) { setApiError(errMessage(err, 'Could not save the ticket.')); setSaving(false); }
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const lockType = sold > 0;

  return (
    <div role="dialog" aria-modal="true" aria-label={tier ? 'Edit ticket' : 'Create new tickets'} style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--surface-overlay)' }} />
      <div style={{ position: 'relative', width: 'min(680px, 100vw)', height: '100%', background: 'var(--surface-card)', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 40px rgba(5,23,71,0.18)', fontFamily: 'var(--font-sans)' }}>
        <div style={{ padding: '26px 28px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-heading)' }}>{tier ? 'Edit ticket' : 'Create new tickets'}</div>
            <div style={{ fontSize: 14.5, color: 'var(--text-muted)', marginTop: 4 }}>Add or edit tickets</div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', alignSelf: 'flex-start' }}><Icon name="x" size={22} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {apiError && <Notice tone="error">{apiError}</Notice>}
          <div>
            <FieldLabel required>Select ticket</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {(['paid', 'free', 'donation'] as TicketType[]).map((type) => {
                const on = d.ticket_type === type;
                return (
                  <button key={type} type="button" disabled={lockType && !on} onClick={() => set('ticket_type', type)} style={{ height: 56, borderRadius: 'var(--radius-control)', border: `1.5px solid ${on ? 'var(--color-success)' : errors.ticket_type ? 'var(--color-error)' : 'var(--border-default)'}`, background: on ? 'var(--status-success-bg)' : 'var(--surface-card)', fontSize: 16, fontWeight: 600, color: 'var(--text-heading)', cursor: lockType && !on ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: lockType && !on ? 0.5 : 1 }}>
                    {TYPE_LABEL[type]}{on && <Icon name="circle-check" size={17} color="var(--color-success)" />}
                  </button>
                );
              })}
            </div>
            <FieldError message={errors.ticket_type} />
          </div>

          {d.ticket_type && (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><FieldLabel required>Ticket name</FieldLabel><span style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>{d.name.length}/60</span></div>
                <Input placeholder="e.g. Full Marathon (42.195 km)" value={d.name} maxLength={60} error={errors.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <Input label="Number of ticket(s) on sale *" type="number" min={1} placeholder="Number of ticket(s) on sale" value={d.quantity} error={errors.quantity} onChange={(e) => set('quantity', e.target.value)} />
              {d.ticket_type !== 'free' && (
                <div>
                  <FieldLabel required={d.ticket_type === 'paid'}>{d.ticket_type === 'donation' ? 'Minimum amount' : 'Ticket price'}</FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${errors.price ? 'var(--color-error)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-control)', overflow: 'hidden' }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: 'var(--color-off-white)', borderRight: '1px solid var(--border-default)', fontWeight: 600, color: 'var(--text-heading)' }}>INR (₹)</span>
                    <input type="number" min={0} step="1" disabled={lockType} value={d.price} placeholder={d.ticket_type === 'donation' ? '0 (any amount)' : 'Ticket price'} onChange={(e) => set('price', e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 14px', fontSize: 15, fontFamily: 'var(--font-sans)', background: lockType ? 'var(--color-muted-bg)' : 'transparent' }} />
                  </div>
                  <FieldError message={errors.price} />
                  {lockType && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>Price is locked because tickets have been sold.</div>}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><FieldLabel>Ticket description</FieldLabel><span style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>{d.description.length}/500</span></div>
                <Textarea placeholder="e.g. Includes T-shirt, timing chip, finisher medal and breakfast" rows={3} value={d.description} maxLength={500} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 14, fontWeight: 600, color: 'var(--text-heading)' }}>Add ticket to Group <Switch checked={d.grouped} onChange={(e) => set('grouped', e.target.checked)} /></label>
                <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 6 }}>Groups can help organize your ticket types and display on the booking page.</div>
                {d.grouped && <div style={{ marginTop: 10 }}><Input placeholder="e.g. Men (18–40 yrs)" value={d.group_name} error={errors.group_name} onChange={(e) => set('group_name', e.target.value)} /></div>}
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 14, fontWeight: 600, color: 'var(--text-heading)' }}>Requires approval <Switch checked={d.requires_approval} onChange={(e) => set('requires_approval', e.target.checked)} /></label>
                <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 6 }}>Attendees will only be able to join your event if you approve their registration.</div>
              </div>
              <div>
                <FieldLabel>Age limit <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Input type="number" min={1} max={120} placeholder="Minimum age, e.g. 18" value={d.min_age} error={errors.min_age} onChange={(e) => set('min_age', e.target.value)} />
                  <Input type="number" min={1} max={120} placeholder="Maximum age" value={d.max_age} error={errors.max_age} onChange={(e) => set('max_age', e.target.value)} />
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 6 }}>Checked against each participant&apos;s date of birth on the event date. Needs a <strong>Date of birth</strong> question in the registration form.</div>
              </div>
              <button type="button" onClick={() => setAdvanced((a) => !a)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, fontWeight: 700, color: 'var(--text-heading)', cursor: 'pointer', fontSize: 14.5 }}>
                Advanced settings <Icon name={advanced ? 'chevron-up' : 'chevron-down'} size={16} />
              </button>
              {advanced && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Input label="Min per order" type="number" min={1} value={d.min_per_order} error={errors.min_per_order} onChange={(e) => set('min_per_order', e.target.value)} />
                  <Input label="Max per order" type="number" min={1} max={100} value={d.max_per_order} error={errors.max_per_order} onChange={(e) => set('max_per_order', e.target.value)} />
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>Sale starts
                    <input type="datetime-local" value={d.sale_start} onChange={(e) => set('sale_start', e.target.value)} style={{ padding: '11px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', fontFamily: 'var(--font-sans)', fontSize: 14 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>Sale ends
                    <input type="datetime-local" value={d.sale_end} onChange={(e) => set('sale_end', e.target.value)} style={{ padding: '11px 12px', border: `1px solid ${errors.sale_end ? 'var(--color-error)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-control)', fontFamily: 'var(--font-sans)', fontSize: 14 }} />
                    <FieldError message={errors.sale_end} />
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '16px 28px 22px', borderTop: '1px solid var(--border-default)' }}>
          <Button variant="secondary" onClick={() => { setD(tier ? fromTier(tier) : EMPTY); setErrors({}); setTouched(false); }}>Reset</Button>
          <Button onClick={save} loading={saving} disabled={!d.ticket_type}>Save</Button>
        </div>
      </div>
    </div>
  );
}
