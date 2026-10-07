'use client';

import * as React from 'react';
import type {
  Attendee,
  AttendeeListResponse,
  AttendeeUpdateRequest,
  FormField,
  FormFieldsResponse,
  RegistrationExport,
  RegistrationExportFormat,
} from '@showtik/api-client';
import { formatINR, formatTimestamp } from '@showtik/api-client';
import { Icon } from '../components/icons/Icon';
import { Input } from '../components/forms/Input';
import { PhoneInput, toMobileDigits } from '../components/forms/PhoneInput';
import { DateInput } from '../components/forms/DateInput';
import { Button } from '../components/forms/Button';
import { EmptyState } from '../components/feedback/EmptyState';
import { Notice, errMessage } from './ui';

export interface RegistrationsApi {
  listAttendees(token: string, eventId: string, cursor?: string, limit?: number): Promise<AttendeeListResponse>;
  exportAttendees(token: string, eventId: string, format: RegistrationExportFormat, status?: string): Promise<RegistrationExport>;
  approveTicket(token: string, eventId: string, ticketId: string): Promise<unknown>;
  rejectTicket(token: string, eventId: string, ticketId: string): Promise<unknown>;
  getFormFields(token: string, eventId: string): Promise<FormFieldsResponse>;
  updateAttendee(token: string, eventId: string, ticketId: string, body: AttendeeUpdateRequest): Promise<Attendee>;
}

// The server's own cap (common.pagination.MAX_PAGE_SIZE) -- asked for
// explicitly so this walks the fewest possible round trips. A real event can
// carry several thousand registrations (one live marathon has 3,000+), where
// the previous default of 100/page meant 30+ sequential authenticated
// requests -- each paying the JWT authorizer's own invocation on top --
// before anything rendered. That read as "pagination doesn't work": a static
// "Loading…" for the better part of a minute is indistinguishable from hung.
const MAX_PAGE_SIZE = 500;

/** Walks every page of a cursor-paginated attendee list, handing back each
 *  page as it arrives so the caller can render progressively rather than
 *  blocking on the full walk.
 *
 *  The list is paginated server-side purely so one response can't exceed the
 *  API's size limit on a popular event -- this view still works on the whole
 *  list at once (search/filter/tier are all client-side below), so paging is
 *  hidden from the rest of the component rather than turning this into
 *  infinite scroll; it just no longer hides the first several seconds of it
 *  behind a blank screen. */
async function listAllAttendees(
  api: RegistrationsApi,
  token: string,
  eventId: string,
  onPage: (soFar: Attendee[]) => void
): Promise<void> {
  const all: Attendee[] = [];
  let cursor: string | undefined;
  do {
    const page = await api.listAttendees(token, eventId, cursor, MAX_PAGE_SIZE);
    all.push(...page.attendees);
    onPage(all.slice());
    cursor = page.next_cursor ?? undefined;
  } while (cursor);
}

function answerText(a: string | string[]): string {
  return Array.isArray(a) ? a.join(', ') : a;
}

/** Follows the presigned S3 URL the server built the export at. The filename
 *  and content type are already forced by the URL's own response-header
 *  overrides (see uploads.py's export_download_url), so this is just a plain
 *  navigation -- no Blob, no base64, nothing to revoke afterwards. */
function downloadExport(file: RegistrationExport) {
  const a = document.createElement('a');
  a.href = file.download_url;
  a.click();
}

const EXPORT_STATUSES = [
  { value: 'all', label: 'All payments' },
  { value: 'success', label: 'Paid only' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const APPROVAL: Record<string, { bg: string; fg: string; label: string }> = {
  approved: { bg: 'var(--status-success-bg)', fg: 'var(--status-success-text)', label: 'Confirmed' },
  pending: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning-text)', label: 'Awaiting approval' },
  rejected: { bg: 'var(--status-error-bg)', fg: 'var(--status-error-text)', label: 'Rejected' },
};

/** Registrations — one row per ticket/participant, grouped by the order
 *  (one payment) they were bought in. Approve/reject tickets that require it,
 *  filter by ticket type, and export everything (server-built CSV / Excel). */
export function RegistrationsView({ api, token, eventId }: { api: RegistrationsApi; token: string; eventId: string }) {
  const [rows, setRows] = React.useState<Attendee[] | null>(null);
  const [stillLoading, setStillLoading] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [tier, setTier] = React.useState('');
  const [onlyPending, setOnlyPending] = React.useState(false);
  const [open, setOpen] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportStatus, setExportStatus] = React.useState('all');
  const [exporting, setExporting] = React.useState<RegistrationExportFormat | null>(null);
  const exportRef = React.useRef<HTMLDivElement>(null);
  const [formFields, setFormFields] = React.useState<FormField[] | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!exportOpen) return;
    const onDoc = (e: MouseEvent) => { if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [exportOpen]);

  const runExport = async (format: RegistrationExportFormat) => {
    setExporting(format); setError(null);
    try {
      downloadExport(await api.exportAttendees(token, eventId, format, exportStatus));
      setExportOpen(false);
    } catch (err) { setError(errMessage(err, 'Could not export registrations.')); } finally { setExporting(null); }
  };

  const load = React.useCallback(() => {
    // Only blank the screen on the true first load. A reload after
    // approve/reject keeps the current rows visible (and usable) while the
    // fresh pages come in, rather than flashing the whole list away to
    // re-fetch something that, for a large event, takes several seconds.
    setStillLoading(true);
    listAllAttendees(api, token, eventId, setRows)
      .catch((err) => setError(errMessage(err, 'Could not load registrations.')))
      .finally(() => setStillLoading(false));
  }, [api, token, eventId]);
  React.useEffect(load, [load]);

  const decide = async (a: Attendee, approve: boolean) => {
    setBusy(a.ticket_id); setError(null);
    try {
      if (approve) await api.approveTicket(token, eventId, a.ticket_id);
      else await api.rejectTicket(token, eventId, a.ticket_id);
      load();
    } catch (err) { setError(errMessage(err, 'Could not update the ticket.')); } finally { setBusy(null); }
  };

  const startEdit = (ticketId: string) => {
    setEditError(null);
    setEditingId(ticketId);
    // Fetched once and cached -- the registration form is the same for
    // every attendee of this event, so there's no reason to re-fetch it
    // each time a different row is edited.
    if (formFields === null) {
      api.getFormFields(token, eventId).then((r) => setFormFields(r.fields)).catch(() => setFormFields([]));
    }
  };

  const saveEdit = async (ticketId: string, body: AttendeeUpdateRequest) => {
    setSavingEdit(true); setEditError(null);
    try {
      const updated = await api.updateAttendee(token, eventId, ticketId, body);
      setRows((prev) => (prev ?? []).map((x) => (x.ticket_id === ticketId ? updated : x)));
      setEditingId(null);
    } catch (err) { setEditError(errMessage(err, 'Could not save these details.')); } finally { setSavingEdit(false); }
  };

  if (rows === null && !error) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div>;
  // Rows render as soon as the first page arrives; a large event keeps
  // fetching further pages behind this, so the counts below are provisional
  // until it settles -- say so, or a still-growing "247 participants" reads
  // as a finished number rather than one still climbing.
  const loadingMore = stillLoading && rows !== null;
  const all = rows ?? [];
  const tiers = Array.from(new Set(all.map((r) => r.ticket_tier ?? ''))).filter(Boolean);
  const q = query.toLowerCase();
  const filtered = all.filter((r) =>
    (!tier || r.ticket_tier === tier) &&
    (!onlyPending || r.approval_status === 'pending') &&
    [r.attendee_name, r.attendee_email ?? '', r.buyer_name, r.buyer_email, r.ticket_code, r.order_code].some((v) => v.toLowerCase().includes(q))
  );
  const pending = all.filter((r) => r.approval_status === 'pending').length;
  const orders = new Set(all.map((r) => r.order_id)).size;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Participants', value: all.length, icon: 'users' },
          { label: 'Orders (payments)', value: orders, icon: 'receipt' },
          { label: 'Awaiting approval', value: pending, icon: 'hourglass' },
          { label: 'Checked in', value: all.filter((r) => r.checked_in).length, icon: 'scan-line' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}><Icon name={s.icon} size={14} />{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-heading)', marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loadingMore && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          <Icon name="loader" size={14} />Still loading more registrations — counts above will keep climbing.
        </div>
      )}

      {error && <div style={{ marginBottom: 16 }}><Notice tone="error">{error}</Notice></div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ flex: '1 1 260px' }}><Input icon="search" placeholder="Search name, email, ticket or order ID" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select value={tier} onChange={(e) => setTier(e.target.value)} style={{ height: 44, padding: '0 12px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-default)', fontFamily: 'var(--font-sans)', fontSize: 14, background: 'var(--surface-card)' }}>
          <option value="">All ticket types</option>
          {tiers.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {pending > 0 && (
          <button type="button" onClick={() => setOnlyPending((v) => !v)} style={{ height: 44, padding: '0 14px', borderRadius: 'var(--radius-pill)', border: `1px solid ${onlyPending ? 'var(--status-warning-text)' : 'var(--border-default)'}`, background: onlyPending ? 'var(--status-warning-bg)' : 'var(--surface-card)', fontWeight: 600, cursor: 'pointer' }}>Needs approval ({pending})</button>
        )}
        <div ref={exportRef} style={{ position: 'relative' }}>
          <Button variant="secondary" onClick={() => setExportOpen((o) => !o)} disabled={all.length === 0} aria-haspopup="menu" aria-expanded={exportOpen}>
            <Icon name="download" size={15} />Export<Icon name={exportOpen ? 'chevron-up' : 'chevron-down'} size={14} />
          </Button>
          {exportOpen && (
            <div role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 20, width: 260, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-modal)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.45 }}>Every participant with all registration-form fields, transaction ID and date, amounts, discount, promo code and payment status.</div>
              <select value={exportStatus} onChange={(e) => setExportStatus(e.target.value)} aria-label="Payments to include" style={{ height: 38, padding: '0 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-default)', fontFamily: 'var(--font-sans)', fontSize: 13.5, background: 'var(--surface-card)' }}>
                {EXPORT_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Button size="sm" loading={exporting === 'xlsx'} disabled={!!exporting} onClick={() => runExport('xlsx')}><Icon name="file-spreadsheet" size={14} />Excel (.xlsx)</Button>
              <Button size="sm" variant="secondary" loading={exporting === 'csv'} disabled={!!exporting} onClick={() => runExport('csv')}><Icon name="file-text" size={14} />CSV</Button>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="users" title={all.length === 0 ? 'No registrations yet' : 'No matches'} description={all.length === 0 ? 'Participants appear here as soon as tickets are booked.' : 'Try a different search or filter.'} />
        ) : filtered.map((r, i) => {
          const look = APPROVAL[r.approval_status] ?? APPROVAL.approved;
          const expanded = open === r.ticket_id;
          return (
            <div key={r.ticket_id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-default)' : 'none', opacity: busy === r.ticket_id ? 0.5 : 1 }}>
              <div onClick={() => setOpen(expanded ? null : r.ticket_id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{r.attendee_name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{r.attendee_email || r.buyer_email}</div>
                </div>
                <div style={{ flex: '1 1 160px', fontSize: 13.5 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-body)' }}>{r.ticket_tier}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontFamily: 'ui-monospace, monospace' }}>Ticket {r.ticket_code} · Order {r.order_code}</div>
                </div>
                <div style={{ width: 70, textAlign: 'right', fontWeight: 600 }}>{formatINR(r.unit_price)}</div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: look.bg, color: look.fg }}>{look.label}</span>
                {r.approval_status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" onClick={() => decide(r, true)}>Approve</Button>
                    <Button size="sm" variant="secondary" onClick={() => decide(r, false)}>Reject</Button>
                  </div>
                )}
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="var(--text-subtle)" />
              </div>
              {expanded && editingId === r.ticket_id && (
                <div style={{ padding: '4px 18px 18px' }}>
                  <AttendeeEditForm
                    attendee={r}
                    fields={formFields}
                    saving={savingEdit}
                    error={editError}
                    onSave={(body) => saveEdit(r.ticket_id, body)}
                    onCancel={() => { setEditingId(null); setEditError(null); }}
                  />
                </div>
              )}
              {expanded && editingId !== r.ticket_id && (
                <div style={{ padding: '4px 18px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }} onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="secondary" onClick={() => startEdit(r.ticket_id)}><Icon name="pencil" size={13} />Edit</Button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px 24px', fontSize: 13.5 }}>
                    <Detail label="Bought by" value={`${r.buyer_name} · ${r.buyer_email} · ${r.buyer_phone}`} />
                    <Detail label="Booked at" value={formatTimestamp(r.purchased_at)} />
                    {r.occurrence_date && <Detail label="Session" value={r.occurrence_date} />}
                    {r.attendee_phone && <Detail label="Participant phone" value={r.attendee_phone} />}
                    {r.attendee_answers.map((a) => <Detail key={a.field_label} label={a.field_label} value={answerText(a.answer)} />)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ color: 'var(--text-heading)', marginTop: 2, wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

/** Edits one issued ticket's own participant details -- name, email, phone,
 *  and whatever registration-form answers the event asks for. `fields` is
 *  null while the event's form is still being fetched (lazily, on first
 *  edit); the name/email/phone inputs don't need it so they render
 *  immediately, with the form-field section filling in once it arrives. */
function AttendeeEditForm({
  attendee,
  fields,
  saving,
  error,
  onSave,
  onCancel,
}: {
  attendee: Attendee;
  fields: FormField[] | null;
  saving: boolean;
  error: string | null;
  onSave: (body: AttendeeUpdateRequest) => void;
  onCancel: () => void;
}) {
  const answerFor = React.useCallback(
    (fieldId: string): string | string[] => attendee.attendee_answers.find((a) => a.field_id === fieldId)?.answer ?? '',
    [attendee]
  );

  const [name, setName] = React.useState(attendee.attendee_name);
  const [email, setEmail] = React.useState(attendee.attendee_email ?? '');
  const [phone, setPhone] = React.useState(toMobileDigits(attendee.attendee_phone));
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({});

  // Fields load asynchronously (and are cached across rows), so seed the
  // answer map once they're available rather than blocking the form on them.
  React.useEffect(() => {
    if (fields) setAnswers(Object.fromEntries(fields.map((f) => [f.id, answerFor(f.id)])));
  }, [fields, answerFor]);

  const setAnswer = (fieldId: string, value: string | string[]) => setAnswers((a) => ({ ...a, [fieldId]: value }));

  const toggleChoice = (fieldId: string, option: string, multi: boolean) => {
    setAnswers((a) => {
      if (!multi) return { ...a, [fieldId]: option };
      const list = Array.isArray(a[fieldId]) ? (a[fieldId] as string[]) : [];
      return { ...a, [fieldId]: list.includes(option) ? list.filter((o) => o !== option) : [...list, option] };
    });
  };

  const save = () => {
    onSave({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone || null,
      form_responses: (fields ?? [])
        .map((f) => ({ field_id: f.id, answer: answers[f.id] ?? '' }))
        .filter((r) => (Array.isArray(r.answer) ? r.answer.length > 0 : r.answer !== '')),
    });
  };

  return (
    <div style={{ display: 'grid', gap: 14, background: 'var(--color-off-white)', borderRadius: 'var(--radius-card)', padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <Input label="Participant name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Participant email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <PhoneInput label="Participant phone" value={phone} onChange={setPhone} />
      </div>

      {fields === null ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading registration form…</div>
      ) : fields.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {fields.map((f) => {
            const value = answers[f.id] ?? (f.field_type === 'multi_choice' ? [] : '');
            if (f.field_type === 'phone') {
              return <PhoneInput key={f.id} label={f.label} value={toMobileDigits(value as string)} onChange={(v) => setAnswer(f.id, v)} />;
            }
            if (f.field_type === 'date' || f.field_type === 'dob') {
              return <DateInput key={f.id} label={f.label} value={value as string} onChange={(v) => setAnswer(f.id, v)} />;
            }
            if (f.field_type === 'single_choice' || f.field_type === 'multi_choice') {
              const chosen = Array.isArray(value) ? value : value ? [value] : [];
              return (
                <div key={f.id}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>{f.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(f.options ?? []).map((opt) => {
                      const active = chosen.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleChoice(f.id, opt, f.field_type === 'multi_choice')}
                          style={{
                            padding: '6px 12px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontSize: 13,
                            border: `1px solid ${active ? 'transparent' : 'var(--border-default)'}`,
                            background: active ? 'var(--action-primary-bg)' : 'var(--surface-card)',
                            color: active ? 'var(--action-primary-text)' : 'var(--text-body)',
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return <Input key={f.id} label={f.label} value={value as string} onChange={(e) => setAnswer(f.id, e.target.value)} />;
          })}
        </div>
      ) : null}

      {error && <Notice tone="error">{error}</Notice>}

      <div style={{ display: 'flex', gap: 8 }}>
        <Button size="sm" loading={saving} onClick={save}>Save</Button>
        <Button size="sm" variant="secondary" disabled={saving} onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
