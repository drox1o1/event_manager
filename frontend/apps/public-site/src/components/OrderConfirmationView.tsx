'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Button } from '@showtik/ui';
import { publicApi, formatINR, formatDateTime, formatEventDate, formatTimestamp, ApiError } from '@showtik/api-client';
import type { OrderDetail, OrderQueryCategory, OrderTicket } from '@showtik/api-client';

export interface OrderConfirmationViewProps {
  order: OrderDetail;
}

const QUERY_TYPES: { value: OrderQueryCategory; label: string }[] = [
  { value: 'payment', label: 'Payment issue' },
  { value: 'details', label: 'Wrong participant / buyer details' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'other', label: 'Something else' },
];

const APPROVAL: Record<string, { label: string; bg: string; fg: string }> = {
  approved: { label: 'Confirmed', bg: 'var(--status-success-bg)', fg: 'var(--status-success-text)' },
  pending: { label: 'Awaiting organiser approval', bg: 'var(--status-warning-bg)', fg: 'var(--status-warning-text)' },
  rejected: { label: 'Not approved', bg: 'var(--status-error-bg)', fg: 'var(--status-error-text)' },
};

/** Order confirmation — one order (= one payment) with a separate ticket,
 *  ticket ID per participant, grouped by ticket type. */
export function OrderConfirmationView({ order }: OrderConfirmationViewProps) {
  const router = useRouter();
  const [queryOpen, setQueryOpen] = React.useState(false);
  const [viewing, setViewing] = React.useState<(OrderTicket & { item: OrderDetail['items'][number] }) | null>(null);
  const [queryType, setQueryType] = React.useState<OrderQueryCategory>('payment');
  const [message, setMessage] = React.useState('');
  const [queryState, setQueryState] = React.useState<'idle' | 'submitting' | 'done'>('idle');
  const [queryError, setQueryError] = React.useState<string | null>(null);

  const tickets = order.items.flatMap((item) => item.tickets.map((t, idx) => ({ ...t, item, idx })));
  const pending = tickets.some((t) => t.approval_status === 'pending');

  const submitQuery = async () => {
    if (message.trim().length < 5) { setQueryError('Please describe your query in a few words.'); return; }
    setQueryState('submitting');
    setQueryError(null);
    try {
      await publicApi.raiseOrderQuery(order.order_id, { category: queryType, message: message.trim() });
      setQueryState('done');
    } catch (err) {
      setQueryError(err instanceof ApiError ? err.message : 'Could not send your query. Please try again.');
      setQueryState('idle');
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 820, margin: '0 auto', padding: 'clamp(28px, 6vw, 56px) clamp(16px, 4vw, 32px)' }}>
      <div className="no-print" style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Icon name="party-popper" size={32} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-heading)', margin: '0 0 8px' }}>You&apos;re going!</h1>
        <p style={{ fontSize: 15.5, color: 'var(--text-muted)', margin: 0 }}>
          {tickets.length} ticket{tickets.length === 1 ? '' : 's'} booked · confirmation sent to <strong style={{ color: 'var(--text-body)' }}>{order.buyer_email}</strong>
        </p>
      </div>

      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: '0 2px 2px rgba(0,0,0,0.04)', marginBottom: 24 }}>
        <div style={{ position: 'relative', padding: '22px 24px', color: '#fff', background: order.banner_image_url ? `linear-gradient(90deg, rgba(5,23,71,0.95), rgba(5,23,71,0.65)), center/cover no-repeat url(${order.banner_image_url})` : 'var(--gradient-hero)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.1, marginBottom: 8 }}>{order.event_title}</div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>
            {order.event_date && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={15} />{order.occurrence_date ? formatEventDate(order.occurrence_date) : formatDateTime(order.event_date, order.event_time ?? undefined)}</span>}
            {order.venue_name && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={15} />{order.venue_name}{order.city ? `, ${order.city}` : ''}</span>}
          </div>
        </div>
        {/* Even label/value rows (works for any number of fields), total as footer. */}
        <dl style={{ margin: 0, padding: '6px 24px' }}>
          {([
            ['Order / Payment ID', order.order_code, true],
            ['Booked by', order.buyer_name, false],
            ...(order.payment_ref ? [['Transaction ID', order.payment_ref, true] as const] : []),
            ['Booked on', formatTimestamp(order.created_at), false],
          ] as const).map(([label, value, mono]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border-default)' }}>
              <dt style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</dt>
              <dd style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--text-heading)', textAlign: 'right', fontFamily: mono ? 'var(--font-mono)' : undefined }}>{value}</dd>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, padding: '14px 0 10px' }}>
            <dt style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>Total paid</dt>
            <dd style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-accent)' }}>{formatINR(order.total_amount)}</dd>
          </div>
        </dl>
        {order.online_url && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Icon name="monitor-play" size={18} color="var(--color-accent-secondary)" />
            <span style={{ fontWeight: 600 }}>Join online:</span>
            <a href={order.online_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent-secondary)', fontWeight: 600, wordBreak: 'break-all' }}>{order.online_url}</a>
          </div>
        )}
      </div>

      {pending && (
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'var(--status-warning-bg)', color: 'var(--text-body)', fontSize: 14, marginBottom: 20 }}>
          <Icon name="hourglass" size={17} color="var(--status-warning-text)" />Some tickets need the organiser&apos;s approval. They&apos;ll show as confirmed here once approved.
        </div>
      )}

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 14px' }}>Your tickets</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14, marginBottom: 28 }}>
        {tickets.map((t) => {
          const look = APPROVAL[t.approval_status] ?? APPROVAL.approved;
          return (
            <div key={t.id} style={{ display: 'flex', borderRadius: 16, overflow: 'hidden', background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}>
              <div style={{ width: 8, background: 'var(--gradient-brand)', flex: 'none' }} />
              <div style={{ flex: 1, padding: '16px 18px', minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>{t.item.ticket_tier_name}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: 'var(--text-heading)', margin: '4px 0 8px' }}>{t.attendee_name ?? order.buyer_name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>Ticket ID: <strong style={{ color: 'var(--text-heading)' }}>{t.ticket_code}</strong></div>
                <span style={{ display: 'inline-block', marginTop: 10, fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: look.bg, color: look.fg }}>{look.label}</span>
              </div>
              <div style={{ flex: 'none', borderLeft: '2px dashed var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px' }}>
                <Button size="sm" variant="secondary" onClick={() => setViewing(t)}>View ticket</Button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 20, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: 12 }}>Payment summary</div>
        {order.items.map((item) => (
          <div key={item.ticket_tier_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-body)' }}>{item.ticket_tier_name} × {item.quantity} <span style={{ color: 'var(--text-subtle)', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>({item.ticket_tier_code})</span></span>
            <span style={{ fontWeight: 600 }}>{formatINR(item.quantity * Number(item.unit_price))}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}><span>Booking fee</span><span>{Number(order.booking_fee) === 0 ? '₹0' : formatINR(order.booking_fee)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 12 }}>
          <span style={{ fontWeight: 600 }}>Total</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--color-accent)' }}>{formatINR(order.total_amount)}</span>
        </div>
      </div>

      {viewing && (
        <div role="dialog" aria-modal="true" aria-label="Ticket" onClick={() => setViewing(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,12,32,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(440px, 100%)', background: 'var(--surface-card)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 1px rgba(0,0,0,0.02), 0 8px 16px -4px rgba(0,0,0,0.04), 0 24px 32px -8px rgba(0,0,0,0.06)' }}>
            <div style={{ background: 'var(--gradient-brand)', color: '#fff', padding: '20px 22px' }}>
              <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.25 }}>{order.event_title}</div>
              <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 6 }}>
                {order.occurrence_date ? formatEventDate(order.occurrence_date) : order.event_date ? formatDateTime(order.event_date, order.event_time ?? undefined) : ''}
                {order.venue_name ? ` · ${order.venue_name}${order.city ? `, ${order.city}` : ''}` : ''}
              </div>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Category</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{viewing.item.ticket_tier_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Participant</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{viewing.attendee_name ?? order.buyer_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Ticket ID</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>{viewing.ticket_code}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
                <Button variant="secondary" onClick={() => window.print()}><Icon name="printer" size={16} />Print ticket</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <Button variant="secondary" onClick={() => window.print()}><Icon name="printer" size={16} />Print tickets</Button>
        <Button variant="secondary" onClick={() => router.push(`/events/${order.event_id}`)}>View event</Button>
        {!queryOpen && queryState !== 'done' && (
          <Button variant="ghost" onClick={() => setQueryOpen(true)}><Icon name="message-circle-question" size={16} />Raise a query</Button>
        )}
      </div>

      {queryState === 'done' && (
        <div role="status" style={{ fontSize: 14, color: 'var(--color-success)', fontWeight: 600, textAlign: 'center' }}>
          Query sent. The Showtik team will reply to {order.buyer_email}.
        </div>
      )}

      {queryOpen && queryState !== 'done' && (
        <div style={{ background: 'var(--surface-card)', borderRadius: 16, border: '1px solid var(--border-default)', padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>Raise a query related to this transaction</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Order {order.order_code}{order.payment_ref ? ` · Transaction ${order.payment_ref}` : ''}</div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 12 }}>
            What is it about?
            <select value={queryType} onChange={(e) => setQueryType(e.target.value as OrderQueryCategory)} style={{ height: 44, padding: '0 12px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-default)', fontFamily: 'var(--font-sans)', fontSize: 15, background: 'var(--surface-card)', fontWeight: 400 }}>
              {QUERY_TYPES.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
            </select>
          </label>
          <textarea
            value={message}
            onChange={(e) => { setMessage(e.target.value); setQueryError(null); }}
            rows={4}
            maxLength={2000}
            aria-label="Your query"
            placeholder="Describe the issue — e.g. amount charged, participant name to correct…"
            style={{ width: '100%', fontFamily: 'var(--font-sans)', fontSize: 15, padding: '11px 14px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-default)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
          />
          {queryError && <div role="alert" style={{ fontSize: 13, color: 'var(--color-error)', marginBottom: 10 }}>{queryError}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setQueryOpen(false)}>Cancel</Button>
            <Button loading={queryState === 'submitting'} disabled={!message.trim()} onClick={submitQuery}>Send query</Button>
          </div>
        </div>
      )}
    </div>
  );
}
