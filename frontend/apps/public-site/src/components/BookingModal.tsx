'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Input, Button, Radio, Checkbox, useIsMobile } from '@showtik/ui';
import { publicApi, formatINR, formatEventDate, ApiError } from '@showtik/api-client';
import type { EventDetail, FormField, TicketTierSummary } from '@showtik/api-client';

const HOLD_SECONDS = 10 * 60;
// Money amounts in the booking UI: ₹0 rather than formatINR's "Free".
const money = (n: number) => (n === 0 ? '₹0' : formatINR(n));
const DIGITS_RE = /^\d{7,15}$/;
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Whole years between a date of birth and the event date (both YYYY-MM-DD). */
export function ageOn(dobIso: string, onIso: string): number {
  const [by, bm, bd] = dobIso.split('-').map(Number);
  const [y, m, d] = onIso.split('-').map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

function ageRule(t: TicketTierSummary): string | null {
  if (t.min_age != null && t.max_age != null) return `Age ${t.min_age}–${t.max_age} years for ${t.name}`;
  if (t.min_age != null) return `Minimum age ${t.min_age} years for ${t.name}`;
  if (t.max_age != null) return `Maximum age ${t.max_age} years for ${t.name}`;
  return null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[\d\s-]{8,16}$/;

type Step = 'select' | 'attendees' | 'buyer';

interface Participant {
  name: string;
  email: string;
  phone: string;
  answers: Record<string, string | string[]>;
}

type ParticipantErrors = Record<string, string>; // key: field name or form field id

function emptyParticipant(): Participant {
  return { name: '', email: '', phone: '', answers: {} };
}

function saleState(t: TicketTierSummary): { available: boolean; reason?: string; remaining: number } {
  const remaining = t.quantity_total - t.quantity_sold;
  if (t.sale_status !== 'on_sale') return { available: false, reason: 'Not on sale', remaining };
  if (remaining <= 0) return { available: false, reason: 'Sold out', remaining };
  return { available: true, remaining };
}

/** Upcoming session dates of a recurring event (max 60). */
export function occurrences(event: EventDetail): string[] {
  if (event.schedule_type !== 'recurring' || !event.recurrence) return [];
  const out: string[] = [];
  const start = new Date(`${event.event_date}T00:00:00`);
  const until = new Date(`${event.recurrence.until}T00:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weekdays = event.recurrence.weekdays.length ? event.recurrence.weekdays : [(start.getDay() + 6) % 7];
  for (let d = new Date(start); d <= until && out.length < 60; d.setDate(d.getDate() + 1)) {
    if (d < today) continue;
    const f = event.recurrence.frequency;
    const ok = f === 'daily' || (f === 'weekly' && weekdays.includes((d.getDay() + 6) % 7)) || (f === 'monthly' && d.getDate() === start.getDate());
    if (ok) out.push(iso(d));
  }
  return out;
}

export function BookingModal({ event, onClose }: { event: EventDetail; onClose: () => void }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [step, setStep] = React.useState<Step>('select');
  const [qty, setQty] = React.useState<Record<string, number>>({});
  const [amounts, setAmounts] = React.useState<Record<string, string>>({});
  const [selectError, setSelectError] = React.useState<string | null>(null);
  const sessions = React.useMemo(() => occurrences(event), [event]);
  const [session, setSession] = React.useState<string>('');
  const [fields, setFields] = React.useState<FormField[]>([]);
  const [people, setPeople] = React.useState<Record<string, Participant[]>>({});
  const [errors, setErrors] = React.useState<Record<string, ParticipantErrors>>({});
  const [buyer, setBuyer] = React.useState({ name: '', email: '', phone: '' });
  const [sameAsFirst, setSameAsFirst] = React.useState(true);
  const [buyerErrors, setBuyerErrors] = React.useState<Record<string, string>>({});
  const [agree, setAgree] = React.useState(false);
  const [holdLeft, setHoldLeft] = React.useState(HOLD_SECONDS);
  const [submitting, setSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    publicApi.getEventFormFields(event.id).then((r) => setFields(r.fields)).catch(() => setFields([]));
  }, [event.id]);

  // Lock page scroll + Esc to close.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  // Spot-hold countdown while filling participant details.
  React.useEffect(() => {
    if (step === 'select') return;
    const t = setInterval(() => setHoldLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step]);
  React.useEffect(() => {
    if (holdLeft <= 0 && step !== 'select') {
      setStep('select');
      setSelectError('Your 10-minute hold expired. Please select your tickets again.');
      setHoldLeft(HOLD_SECONDS);
    }
  }, [holdLeft, step]);

  const tiers = [...event.ticket_tiers].sort((a, b) => a.sort_order - b.sort_order);
  const groups: { name: string | null; tiers: TicketTierSummary[] }[] = [];
  for (const t of tiers) {
    const g = groups.find((x) => x.name === (t.group_name || null));
    if (g) g.tiers.push(t); else groups.push({ name: t.group_name || null, tiers: [t] });
  }
  const selected = tiers.filter((t) => (qty[t.id] ?? 0) > 0);
  const totalQty = selected.reduce((n, t) => n + qty[t.id], 0);
  const unitPrice = (t: TicketTierSummary) => (t.ticket_type === 'donation' ? Number(amounts[t.id] || t.price) : t.ticket_type === 'free' ? 0 : Number(t.price));
  const total = selected.reduce((sum, t) => sum + qty[t.id] * unitPrice(t), 0);

  const setTierQty = (t: TicketTierSummary, n: number) => {
    const { remaining } = saleState(t);
    const max = Math.min(t.max_per_order, remaining);
    let next = n;
    if (n > 0 && n < t.min_per_order) next = (qty[t.id] ?? 0) > n ? 0 : t.min_per_order; // jump over the invalid range
    next = Math.max(0, Math.min(next, max));
    setQty((q) => ({ ...q, [t.id]: next }));
    setSelectError(null);
  };

  const proceedFromSelect = () => {
    if (totalQty === 0) { setSelectError('Add at least one ticket to continue.'); return; }
    if (sessions.length > 0 && !session) { setSelectError('Choose which date you want to attend.'); return; }
    for (const t of selected) {
      if (t.ticket_type === 'donation' && Number(amounts[t.id] || t.price) < Number(t.price)) { setSelectError(`Minimum contribution for ${t.name} is ${formatINR(t.price)}.`); return; }
    }
    // Size the participant list for every selected ticket, keeping entries already typed.
    setPeople((prev) => {
      const next: Record<string, Participant[]> = {};
      for (const t of selected) {
        const existing = prev[t.id] ?? [];
        next[t.id] = Array.from({ length: qty[t.id] }, (_, i) => existing[i] ?? emptyParticipant());
      }
      return next;
    });
    setErrors({});
    setHoldLeft(HOLD_SECONDS);
    setStep('attendees');
    bodyRef.current?.scrollTo({ top: 0 });
  };

  const patchPerson = (tierId: string, idx: number, patch: Partial<Participant>) => {
    setPeople((p) => ({ ...p, [tierId]: p[tierId].map((x, i) => (i === idx ? { ...x, ...patch } : x)) }));
    setErrors((e) => {
      const k = `${tierId}:${idx}`;
      if (!e[k]) return e;
      const copy = { ...e[k] };
      Object.keys(patch).forEach((f) => delete copy[f]);
      return { ...e, [k]: copy };
    });
  };
  const setAnswer = (tierId: string, idx: number, fieldId: string, value: string | string[]) => {
    setPeople((p) => ({ ...p, [tierId]: p[tierId].map((x, i) => (i === idx ? { ...x, answers: { ...x.answers, [fieldId]: value } } : x)) }));
    setErrors((e) => { const k = `${tierId}:${idx}`; if (!e[k]?.[fieldId]) return e; const copy = { ...e[k] }; delete copy[fieldId]; return { ...e, [k]: copy }; });
  };

  const empty = (v: string | string[] | undefined) => v === undefined || (Array.isArray(v) ? v.length === 0 : !v.trim());

  // Ages are measured on the event day (or the chosen session for recurring events).
  const eventDay = session || event.event_date;
  const dobField = fields.find((f) => f.field_type === 'dob');

  const validateAttendees = (): boolean => {
    const next: Record<string, ParticipantErrors> = {};
    for (const t of selected) {
      (people[t.id] ?? []).forEach((p, i) => {
        const e: ParticipantErrors = {};
        if (!p.name.trim()) e.name = 'Enter the participant’s full name';
        if (p.email && !EMAIL_RE.test(p.email)) e.email = 'Enter a valid email';
        if (p.phone && !PHONE_RE.test(p.phone)) e.phone = 'Enter a valid phone number';
        for (const f of fields) {
          const v = p.answers[f.id];
          if (f.required && empty(v)) { e[f.id] = ['single_choice', 'multi_choice'].includes(f.field_type) ? 'Please make a selection' : 'This field is required'; continue; }
          if (empty(v) || typeof v !== 'string') continue;
          if (f.field_type === 'phone' && !DIGITS_RE.test(v)) e[f.id] = 'Enter 7–15 digits (numbers only)';
          if ((f.field_type === 'date' || f.field_type === 'dob') && !/^\d{4}-\d{2}-\d{2}$/.test(v)) e[f.id] = 'Choose a valid date';
          if (f.field_type === 'dob' && !e[f.id]) {
            if (v > todayIso()) e[f.id] = 'Date of birth can’t be in the future';
            else {
              const age = ageOn(v, eventDay);
              if (t.min_age != null && age < t.min_age) e[f.id] = `Must be at least ${t.min_age} years old on ${formatEventDate(eventDay)} for ${t.name} (will be ${age})`;
              else if (t.max_age != null && age > t.max_age) e[f.id] = `Must be at most ${t.max_age} years old on ${formatEventDate(eventDay)} for ${t.name} (will be ${age})`;
            }
          }
        }
        if ((t.min_age != null || t.max_age != null) && dobField && empty(p.answers[dobField.id])) e[dobField.id] = 'Date of birth is required for this ticket';
        if (Object.keys(e).length) next[`${t.id}:${i}`] = e;
      });
    }
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => bodyRef.current?.querySelector('[data-has-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return false;
    }
    return true;
  };

  const firstPerson = selected.length ? people[selected[0].id]?.[0] : undefined;
  React.useEffect(() => {
    if (step === 'buyer' && sameAsFirst && firstPerson) {
      setBuyer((b) => ({ name: firstPerson.name || b.name, email: firstPerson.email || b.email, phone: firstPerson.phone || b.phone }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sameAsFirst]);

  const validateBuyer = () => {
    const e: Record<string, string> = {};
    if (!buyer.name.trim()) e.name = 'Enter your name';
    if (!EMAIL_RE.test(buyer.email)) e.email = 'Enter a valid email — tickets are sent here';
    if (!PHONE_RE.test(buyer.phone)) e.phone = 'Enter a valid phone number';
    if (!agree) e.agree = 'Please accept the terms to continue';
    setBuyerErrors(e);
    return Object.keys(e).length === 0;
  };

  const pay = async () => {
    if (!validateBuyer()) return;
    setSubmitting(true); setApiError(null);
    try {
      const { order_id } = await publicApi.checkout(event.id, {
        buyer_name: buyer.name.trim(),
        buyer_email: buyer.email.trim(),
        buyer_phone: buyer.phone.trim(),
        occurrence_date: session || undefined,
        items: selected.map((t) => ({
          ticket_tier_id: t.id,
          quantity: qty[t.id],
          amount: t.ticket_type === 'donation' ? String(unitPrice(t)) : undefined,
          attendees: people[t.id].map((p) => ({
            name: p.name.trim(),
            email: p.email.trim() || null,
            phone: p.phone.trim() || null,
            form_responses: fields.filter((f) => !empty(p.answers[f.id])).map((f) => ({ field_id: f.id, answer: p.answers[f.id] })),
          })),
        })),
      });
      router.push(`/order/${order_id}`);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const mm = String(Math.max(0, Math.floor(holdLeft / 60))).padStart(2, '0');
  const ss = String(Math.max(0, holdLeft % 60)).padStart(2, '0');
  const title = step === 'select' ? 'Select Tickets' : step === 'attendees' ? 'Attendee Details' : 'Confirm & pay';

  return (
    <div role="dialog" aria-modal="true" aria-label={title} style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(5,23,71,0.6)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', width: isMobile ? '100%' : 'min(760px, 94vw)', maxHeight: isMobile ? '94dvh' : '88vh', background: 'var(--surface-card)', borderRadius: isMobile ? '20px 20px 0 0' : 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: '1px solid var(--border-default)' }}>
          {step !== 'select' && (
            <button type="button" aria-label="Back" onClick={() => setStep(step === 'buyer' ? 'attendees' : 'select')} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-heading)' }}><Icon name="chevron-left" size={22} /></button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-heading)' }}>{title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }} aria-hidden>
            {(['select', 'attendees', 'buyer'] as Step[]).map((s) => <span key={s} style={{ width: s === step ? 22 : 8, height: 8, borderRadius: 8, background: s === step ? 'var(--color-accent)' : 'var(--border-default)', transition: 'width .2s ease' }} />)}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><Icon name="x" size={22} /></button>
        </div>

        {step !== 'select' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', background: holdLeft < 60 ? 'var(--status-error-bg)' : 'var(--surface-accent-secondary-tint)', fontSize: 14, color: 'var(--text-heading)', fontWeight: 600 }}>
            <Icon name="timer" size={16} /> Holding your spot for {mm}:{ss} mins
          </div>
        )}

        <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '18px 16px' : '22px 24px' }}>
          {step === 'select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sessions.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Choose a date</div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {sessions.map((d) => (
                      <button key={d} type="button" onClick={() => { setSession(d); setSelectError(null); }} style={{ flex: 'none', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${session === d ? 'var(--color-accent)' : 'var(--border-default)'}`, background: session === d ? 'var(--color-accent-tint)' : 'var(--surface-card)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', color: 'var(--text-heading)' }}>{formatEventDate(d)}</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}><span>Ticket Types</span><span>Quantity</span></div>
              {tiers.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Tickets aren’t on sale yet.</div>}
              {groups.map((g) => (
                <React.Fragment key={g.name ?? '_'}>
                  {g.name && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent-secondary)', marginTop: 8 }}>{g.name}</div>}
                  {g.tiers.map((t) => {
                    const state = saleState(t);
                    const n = qty[t.id] ?? 0;
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, border: '1px solid var(--border-default)', borderLeft: n > 0 ? '4px solid var(--color-accent-secondary)' : '1px solid var(--border-default)', background: n > 0 ? 'var(--surface-card)' : 'var(--color-off-white)', opacity: state.available ? 1 : 0.6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>{t.name}</div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-heading)', marginTop: 4 }}>
                            {t.ticket_type === 'donation' ? `Pay what you want${Number(t.price) > 0 ? ` (min ${formatINR(t.price)})` : ''}` : formatINR(t.price)}
                          </div>
                          {t.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.45 }}>{t.description}</div>}
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6, fontSize: 12, color: 'var(--text-subtle)' }}>
                            {state.available && state.remaining <= 20 && <span style={{ color: 'var(--status-warning-text)', fontWeight: 700 }}>Only {state.remaining} left</span>}
                            {t.requires_approval && <span>Requires organiser approval</span>}
                            {t.min_per_order > 1 && <span>Min {t.min_per_order} per order</span>}
                          </div>
                          {t.ticket_type === 'donation' && n > 0 && (
                            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Amount per ticket ₹</span>
                              <input type="number" min={Number(t.price)} value={amounts[t.id] ?? String(Number(t.price) || '')} onChange={(e) => setAmounts((a) => ({ ...a, [t.id]: e.target.value }))} style={{ width: 110, padding: '8px 10px', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 14 }} />
                            </div>
                          )}
                        </div>
                        {!state.available ? (
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{state.reason}</span>
                        ) : n === 0 ? (
                          <button type="button" onClick={() => setTierQty(t, Math.max(1, t.min_per_order))} style={{ minWidth: 110, height: 44, borderRadius: 10, border: '1.5px solid var(--color-accent-secondary)', background: 'var(--surface-card)', color: 'var(--color-accent-secondary)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Add</button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <StepBtn icon="minus" label={`Remove one ${t.name}`} onClick={() => setTierQty(t, n - 1)} />
                            <span style={{ minWidth: 20, textAlign: 'center', fontSize: 20, fontWeight: 700, color: 'var(--color-accent-secondary)' }}>{n}</span>
                            <StepBtn icon="plus" label={`Add one ${t.name}`} disabled={n >= Math.min(t.max_per_order, state.remaining)} onClick={() => setTierQty(t, n + 1)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
              {selectError && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 14, fontWeight: 600 }}>{selectError}</div>}
            </div>
          )}

          {step === 'attendees' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Each participant gets their own ticket. Enter details exactly as they should appear on the ticket.</div>
              {selected.map((t) => (people[t.id] ?? []).map((p, i) => {
                const k = `${t.id}:${i}`;
                const e = errors[k] ?? {};
                const hasErr = Object.keys(e).length > 0;
                return (
                  <div key={k} data-has-error={hasErr ? 'true' : undefined} style={{ border: `1px solid ${hasErr ? 'var(--color-error)' : 'var(--border-default)'}`, borderTop: `3px solid ${hasErr ? 'var(--color-error)' : 'var(--color-accent-secondary)'}`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{t.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Participant {i + 1} of {qty[t.id]}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                      <div style={{ gridColumn: isMobile ? undefined : '1 / -1' }}>
                        <Input label="Name *" placeholder="Full name" value={p.name} error={e.name} onChange={(ev) => patchPerson(t.id, i, { name: ev.target.value })} />
                      </div>
                      <Input label="Email" type="email" placeholder="participant@email.com" value={p.email} error={e.email} onChange={(ev) => patchPerson(t.id, i, { email: ev.target.value })} />
                      <Input label="Phone" type="tel" placeholder="+91 98765 43210" value={p.phone} error={e.phone} onChange={(ev) => patchPerson(t.id, i, { phone: ev.target.value })} />
                    </div>
                    {fields.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                        {fields.map((f) => f.field_type === 'text' ? (
                          <Input key={f.id} label={f.required ? `${f.label} *` : f.label} value={(p.answers[f.id] as string) ?? ''} error={e[f.id]} onChange={(ev) => setAnswer(t.id, i, f.id, ev.target.value)} />
                        ) : f.field_type === 'phone' ? (
                          <Input key={f.id} type="tel" inputMode="numeric" maxLength={15} placeholder="Digits only, e.g. 9876543210" label={f.required ? `${f.label} *` : f.label} value={(p.answers[f.id] as string) ?? ''} error={e[f.id]} onChange={(ev) => setAnswer(t.id, i, f.id, ev.target.value.replace(/\D/g, ''))} />
                        ) : f.field_type === 'date' || f.field_type === 'dob' ? (
                          <div key={f.id}>
                            <Input type="date" max={f.field_type === 'dob' ? todayIso() : undefined} label={f.required || (f.field_type === 'dob' && ageRule(t)) ? `${f.label} *` : f.label} value={(p.answers[f.id] as string) ?? ''} error={e[f.id]} onChange={(ev) => setAnswer(t.id, i, f.id, ev.target.value)} />
                            {f.field_type === 'dob' && ageRule(t) && !e[f.id] && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--color-accent)', fontWeight: 600, marginTop: 6 }}>
                                <Icon name="info" size={13} />{ageRule(t)} (on {formatEventDate(eventDay)})
                                {typeof p.answers[f.id] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.answers[f.id] as string) && <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> · age on event day: {ageOn(p.answers[f.id] as string, eventDay)}</span>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div key={f.id}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>{f.label}{f.required && ' *'}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
                              {(f.options ?? []).map((opt) => f.field_type === 'single_choice' ? (
                                <Radio key={opt} name={`${k}-${f.id}`} label={opt} checked={p.answers[f.id] === opt} onChange={() => setAnswer(t.id, i, f.id, opt)} />
                              ) : (
                                <Checkbox key={opt} label={opt} checked={Array.isArray(p.answers[f.id]) && (p.answers[f.id] as string[]).includes(opt)} onChange={(ev) => {
                                  const cur = Array.isArray(p.answers[f.id]) ? (p.answers[f.id] as string[]) : [];
                                  setAnswer(t.id, i, f.id, ev.target.checked ? [...cur, opt] : cur.filter((o) => o !== opt));
                                }} />
                              ))}
                            </div>
                            {e[f.id] && <div style={{ fontSize: 12.5, color: 'var(--color-error)', marginTop: 6 }}>{e[f.id]}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          )}

          {step === 'buyer' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Your contact details</div>
                <Checkbox label="Same as participant 1" checked={sameAsFirst} onChange={(ev) => setSameAsFirst(ev.target.checked)} />
                <Input label="Full name *" value={buyer.name} error={buyerErrors.name} onChange={(ev) => setBuyer({ ...buyer, name: ev.target.value })} />
                <Input label="Email *" type="email" value={buyer.email} error={buyerErrors.email} onChange={(ev) => setBuyer({ ...buyer, email: ev.target.value })} />
                <Input label="Phone *" type="tel" value={buyer.phone} error={buyerErrors.phone} onChange={(ev) => setBuyer({ ...buyer, phone: ev.target.value })} />
                <div>
                  <Checkbox label="I confirm the participant details are correct and agree to the event’s terms and Showtik’s refund policy." checked={agree} onChange={(ev) => { setAgree(ev.target.checked); setBuyerErrors((b) => ({ ...b, agree: '' })); }} />
                  {buyerErrors.agree && <div style={{ fontSize: 12.5, color: 'var(--color-error)', marginTop: 6 }}>{buyerErrors.agree}</div>}
                </div>
              </div>
              <div style={{ background: 'var(--color-off-white)', borderRadius: 14, padding: 18, alignSelf: 'start' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12 }}>Order summary</div>
                {session && <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 10 }}>Date: <strong>{formatEventDate(session)}</strong></div>}
                {selected.map((t) => (
                  <div key={t.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>
                      <span>{t.name} × {qty[t.id]}</span><span>{formatINR(qty[t.id] * unitPrice(t))}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{(people[t.id] ?? []).map((p) => p.name).join(', ')}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--text-muted)', paddingTop: 10, borderTop: '1px solid var(--border-default)' }}><span>Booking fee</span><span>₹0</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--color-accent)' }}>{money(total)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 10, lineHeight: 1.45 }}>One payment for the whole order. Each participant receives a separate ticket ID.</div>
              </div>
              {apiError && <div role="alert" style={{ gridColumn: '1 / -1', color: 'var(--color-error)', fontSize: 14, fontWeight: 600 }}>{apiError}</div>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px', borderTop: '1px solid var(--border-default)', background: 'var(--surface-card)' }}>
          <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>Qty : <strong style={{ color: 'var(--color-accent-secondary)', fontSize: 17 }}>{totalQty}</strong></div>
          <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>Total : <strong style={{ color: 'var(--color-accent-secondary)', fontSize: 17 }}>{money(total)}</strong></div>
          <span style={{ flex: 1 }} />
          {step === 'select' && <Button onClick={proceedFromSelect} disabled={totalQty === 0} style={{ minWidth: isMobile ? 120 : 180 }}>Proceed <Icon name="chevron-right" size={16} /></Button>}
          {step === 'attendees' && <Button onClick={() => { if (validateAttendees()) { setStep('buyer'); bodyRef.current?.scrollTo({ top: 0 }); } }} style={{ minWidth: isMobile ? 120 : 180 }}>Continue <Icon name="chevron-right" size={16} /></Button>}
          {step === 'buyer' && <Button onClick={pay} loading={submitting} style={{ minWidth: isMobile ? 120 : 200 }}>{total > 0 ? `Pay ${formatINR(total)}` : 'Confirm registration'}</Button>}
        </div>
      </div>
    </div>
  );
}

function StepBtn({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${disabled ? 'var(--border-default)' : 'var(--color-accent-secondary)'}`, background: 'var(--surface-card)', color: disabled ? 'var(--text-subtle)' : 'var(--color-accent-secondary)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={16} />
    </button>
  );
}
