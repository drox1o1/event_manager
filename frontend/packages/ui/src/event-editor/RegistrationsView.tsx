'use client';

import * as React from 'react';
import type { Attendee, AttendeeListResponse, RegistrationExport, RegistrationExportFormat } from '@showtik/api-client';
import { formatINR, formatTimestamp } from '@showtik/api-client';
import { Icon } from '../components/icons/Icon';
import { Input } from '../components/forms/Input';
import { Button } from '../components/forms/Button';
import { EmptyState } from '../components/feedback/EmptyState';
import { Notice, errMessage } from './ui';

export interface RegistrationsApi {
  listAttendees(token: string, eventId: string): Promise<AttendeeListResponse>;
  exportAttendees(token: string, eventId: string, format: RegistrationExportFormat, status?: string): Promise<RegistrationExport>;
  approveTicket(token: string, eventId: string, ticketId: string): Promise<unknown>;
  rejectTicket(token: string, eventId: string, ticketId: string): Promise<unknown>;
}

function answerText(a: string | string[]): string {
  return Array.isArray(a) ? a.join(', ') : a;
}

/** Saves a server-built export (base64 in JSON) as a file. */
function downloadExport(file: RegistrationExport) {
  const bytes = Uint8Array.from(atob(file.data), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: file.content_type }));
  const a = document.createElement('a');
  a.href = url; a.download = file.filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    api.listAttendees(token, eventId).then((r) => setRows(r.attendees)).catch((err) => setError(errMessage(err, 'Could not load registrations.')));
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

  if (rows === null && !error) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div>;
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
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-heading)', marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

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
                  <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.attendee_name}</div>
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
              {expanded && (
                <div style={{ padding: '4px 18px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px 24px', fontSize: 13.5 }}>
                  <Detail label="Bought by" value={`${r.buyer_name} · ${r.buyer_email} · ${r.buyer_phone}`} />
                  <Detail label="Booked at" value={formatTimestamp(r.purchased_at)} />
                  {r.occurrence_date && <Detail label="Session" value={r.occurrence_date} />}
                  {r.attendee_phone && <Detail label="Participant phone" value={r.attendee_phone} />}
                  {r.attendee_answers.map((a) => <Detail key={a.field_label} label={a.field_label} value={answerText(a.answer)} />)}
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
