'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Avatar, TicketTierRow, Button } from '@cyrokx/ui';
import { formatDateTime, formatINR } from '@cyrokx/api-client';
import type { EventDetail } from '@cyrokx/api-client';
import { persistCheckoutSelection } from '@/lib/checkoutStore';

export interface EventDetailViewProps {
  event: EventDetail;
}

/** EventDetail — hero, description, ticket tiers panel with quantity steppers, sticky buy CTA. */
export function EventDetailView({ event }: EventDetailViewProps) {
  const router = useRouter();
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});

  const total = event.ticket_tiers.reduce((sum, tier) => {
    const qty = quantities[tier.id] || 0;
    return sum + qty * Number(tier.price);
  }, 0);

  const setQty = (tierId: string, qty: number) => setQuantities((prev) => ({ ...prev, [tierId]: qty }));

  const buy = () => {
    const items = event.ticket_tiers
      .filter((t) => (quantities[t.id] || 0) > 0)
      .map((t) => ({ ticket_tier_id: t.id, quantity: quantities[t.id], name: t.name, unit_price: t.price }));
    if (items.length === 0) return;
    persistCheckoutSelection(event.id, { eventTitle: event.title, items });
    router.push(`/checkout/${event.id}`);
  };

  const remainingFor = (tier: EventDetail['ticket_tiers'][number]) => tier.quantity_total - tier.quantity_sold;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '32px', paddingBottom: 120 }}>
      <div
        style={{
          aspectRatio: '16/6',
          borderRadius: 'var(--radius-card)',
          marginBottom: 32,
          background: event.banner_image_url
            ? `center/cover no-repeat url(${event.banner_image_url})`
            : 'linear-gradient(135deg,#efeae4,#e2dcd3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-subtle)',
        }}
      >
        {!event.banner_image_url && <Icon name="image" size={36} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 48 }}>
        <div>
          {event.category && (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              {event.category}
            </div>
          )}
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 16px' }}>{event.title}</h1>
          <div style={{ display: 'flex', gap: 24, marginBottom: 28, fontSize: 15, color: 'var(--text-body)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="calendar" size={16} color="var(--text-muted)" /> {formatDateTime(event.event_date, event.event_time)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="map-pin" size={16} color="var(--text-muted)" /> {event.venue_name}, {event.city}
            </span>
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 10 }}>About this event</h3>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-body)', marginBottom: 28, whiteSpace: 'pre-wrap' }}>{event.description}</p>

          {event.gallery_images && event.gallery_images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(event.gallery_images.length, 3)}, 1fr)`, gap: 12, marginBottom: 28 }}>
              {event.gallery_images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src + i} src={src} alt={`${event.title} photo ${i + 1}`} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-default)' }} />
              ))}
            </div>
          )}

          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12 }}>Venue</h3>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 28 }}>
            <Icon name="map-pin" size={18} color="var(--text-muted)" style={{ marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{event.venue_name}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{event.venue_address}</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ position: 'sticky', top: 24, background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 20 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px' }}>Tickets</h3>
            {event.ticket_tiers.length === 0 && (
              <div style={{ fontSize: 14, color: 'var(--text-muted)', padding: '12px 0' }}>No tickets on sale yet.</div>
            )}
            {event.ticket_tiers.map((tier) => {
              const remaining = remainingFor(tier);
              const available = remaining > 0;
              return (
                <TicketTierRow
                  key={tier.id}
                  name={tier.name}
                  price={formatINR(tier.price)}
                  available={available}
                  remaining={available && remaining <= 20 ? remaining : undefined}
                  quantity={quantities[tier.id] || 0}
                  onQuantityChange={(v) => setQty(tier.id, Math.min(v, remaining))}
                />
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-accent)' }}>{formatINR(total)}</span>
            </div>
            <Button fullWidth style={{ marginTop: 16 }} disabled={total === 0} onClick={buy}>Buy tickets</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
