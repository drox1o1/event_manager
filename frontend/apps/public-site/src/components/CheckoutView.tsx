'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Input, Button, EmptyState } from '@cyrokx/ui';
import { publicApi, formatINR, ApiError } from '@cyrokx/api-client';
import { readCheckoutSelection, clearCheckoutSelection, type CheckoutSelection } from '@/lib/checkoutStore';

export interface CheckoutViewProps {
  eventId: string;
}

/** Checkout — buyer details form, order summary, pay button. No login (guest checkout).
 *  Payment is TEST-MODE: the backend records a real order + tickets with no gateway call. */
export function CheckoutView({ eventId }: CheckoutViewProps) {
  const router = useRouter();
  const [selection, setSelection] = React.useState<CheckoutSelection | null | undefined>(undefined);
  const [buyer, setBuyer] = React.useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; phone?: string }>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelection(readCheckoutSelection(eventId));
  }, [eventId]);

  const total = selection?.items.reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0) ?? 0;

  const validate = () => {
    const next: typeof errors = {};
    if (!buyer.name.trim()) next.name = 'Enter your name';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyer.email)) next.email = 'Enter a valid email';
    if (!buyer.phone.trim()) next.phone = 'Enter a phone number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const pay = async () => {
    if (!selection || !validate()) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const { order_id } = await publicApi.checkout(eventId, {
        buyer_name: buyer.name,
        buyer_email: buyer.email,
        buyer_phone: buyer.phone,
        items: selection.items.map((i) => ({ ticket_tier_id: i.ticket_tier_id, quantity: i.quantity })),
      });
      clearCheckoutSelection(eventId);
      router.push(`/order/${order_id}`);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (selection === undefined) {
    return <div style={{ maxWidth: 900, margin: '0 auto', padding: 32, color: 'var(--text-muted)' }}>Loading…</div>;
  }

  if (!selection || selection.items.length === 0) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 32px' }}>
        <EmptyState
          icon="shopping-cart"
          title="No tickets selected"
          description="Head back to the event and choose your tickets to check out."
          action={<Button onClick={() => router.push(`/events/${eventId}`)}>Back to event</Button>}
        />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 900, margin: '0 auto', padding: '32px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 24 }}>Checkout</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 14 }}>Buyer details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            <Input label="Full name" placeholder="Priya Shah" value={buyer.name} error={errors.name}
              onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
            <Input label="Email" type="email" placeholder="you@email.com" value={buyer.email} error={errors.email}
              onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
            <Input label="Phone" type="tel" placeholder="+91 98765 43210" value={buyer.phone} error={errors.phone}
              onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--color-accent-tint)', borderRadius: 'var(--radius-control)', padding: 14 }}>
            <Icon name="info" size={16} color="var(--color-accent)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--text-body)' }}>
              Test mode — this confirms your order and issues tickets instantly without a real payment gateway.
            </div>
          </div>
        </div>
        <div>
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 14px' }}>Order summary</h3>
            <div style={{ fontSize: 14, color: 'var(--text-body)', marginBottom: 10, fontWeight: 600 }}>{selection.eventTitle}</div>
            {selection.items.map((item) => (
              <div key={item.ticket_tier_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>{item.name} × {item.quantity}</span>
                <span>{formatINR(item.quantity * Number(item.unit_price))}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>
              <span>Booking fee</span><span>{formatINR(0)}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--color-accent)' }}>{formatINR(total)}</span>
            </div>
            {apiError && <div style={{ fontSize: 13, color: 'var(--color-error)', marginBottom: 12 }}>{apiError}</div>}
            <Button fullWidth size="lg" loading={submitting} onClick={pay}>Pay {formatINR(total)}</Button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}><Icon name="shield-check" size={14} /> Secure checkout, no account needed</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}><Icon name="lock" size={14} /> Your details are encrypted</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
