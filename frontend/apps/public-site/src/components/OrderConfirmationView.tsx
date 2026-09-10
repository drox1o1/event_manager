'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Button } from '@cyrokx/ui';
import { publicApi, formatINR, ApiError } from '@cyrokx/api-client';
import type { OrderDetail } from '@cyrokx/api-client';

export interface OrderConfirmationViewProps {
  order: OrderDetail;
}

/** OrderConfirmation — success state, order summary, ticket QR tokens, refund request. */
export function OrderConfirmationView({ order }: OrderConfirmationViewProps) {
  const router = useRouter();
  const [refundOpen, setRefundOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [refundState, setRefundState] = React.useState<'idle' | 'submitting' | 'done'>('idle');
  const [refundError, setRefundError] = React.useState<string | null>(null);

  const ticketCount = order.items.reduce((n, item) => n + item.tickets.length, 0);
  const shortId = order.order_id.slice(0, 8).toUpperCase();

  const submitRefund = async () => {
    if (!reason.trim()) return;
    setRefundState('submitting');
    setRefundError(null);
    try {
      await publicApi.requestRefund(order.order_id, { reason });
      setRefundState('done');
    } catch (err) {
      setRefundError(err instanceof ApiError ? err.message : 'Could not submit refund request.');
      setRefundState('idle');
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 560, margin: '0 auto', padding: 'clamp(32px, 8vw, 64px) clamp(16px, 4vw, 32px)', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Icon name="check-circle" size={30} />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px' }}>You&apos;re going!</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 32px' }}>Order #{shortId} confirmed.</p>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, textAlign: 'left', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-heading)', marginBottom: 14 }}>{order.event_title}</div>
        {order.items.map((item) => (
          <div key={item.ticket_tier_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-body)' }}>{item.ticket_tier_name} × {item.quantity}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{formatINR(item.quantity * Number(item.unit_price))}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 14, marginTop: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>Total paid</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent)' }}>{formatINR(order.total_amount)}</span>
        </div>
      </div>

      {order.form_responses && order.form_responses.length > 0 && (
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, textAlign: 'left', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-heading)', marginBottom: 14 }}>Registration details</div>
          {order.form_responses.map((r, i) => (
            <div key={r.field_label + i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.field_label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-heading)', textAlign: 'right' }}>{Array.isArray(r.answer) ? r.answer.join(', ') : r.answer}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--color-accent-tint)', borderRadius: 'var(--radius-control)', padding: 14, marginBottom: 28, textAlign: 'left' }}>
        <Icon name="ticket" size={16} color="var(--color-accent)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--text-body)' }}>
          {ticketCount} ticket{ticketCount === 1 ? '' : 's'} issued to {order.buyer_email}. Your QR codes are on your tickets below.
        </div>
      </div>

      <div style={{ textAlign: 'left', marginBottom: 28 }}>
        {order.items.flatMap((item) =>
          item.tickets.map((ticket, idx) => (
            <div key={ticket.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-card)', borderRadius: 'var(--radius-control)', boxShadow: 'var(--shadow-card)', marginBottom: 8 }}>
              <Icon name="qr-code" size={20} color="var(--text-muted)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{item.ticket_tier_name} · Ticket {idx + 1}</div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontFamily: 'monospace' }}>{ticket.qr_code_token}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
        <Button variant="secondary" onClick={() => router.push('/')}>Back to homepage</Button>
        {order.payment_status === 'success' && !refundOpen && refundState !== 'done' && (
          <Button variant="ghost" onClick={() => setRefundOpen(true)}>Request refund</Button>
        )}
      </div>

      {refundState === 'done' && (
        <div style={{ fontSize: 14, color: 'var(--color-success)', fontWeight: 600 }}>
          Refund request submitted — we&apos;ll review it within 24 hours.
        </div>
      )}

      {refundOpen && refundState !== 'done' && (
        <div style={{ textAlign: 'left', background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 10 }}>Request a refund</div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Tell us why you'd like a refund…"
            style={{ width: '100%', fontFamily: 'var(--font-sans)', fontSize: 15, padding: '11px 14px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-default)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
          />
          {refundError && <div style={{ fontSize: 13, color: 'var(--color-error)', marginBottom: 10 }}>{refundError}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button loading={refundState === 'submitting'} disabled={!reason.trim()} onClick={submitRefund}>Submit request</Button>
          </div>
        </div>
      )}
    </div>
  );
}
