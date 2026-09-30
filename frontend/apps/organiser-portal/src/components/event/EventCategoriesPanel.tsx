'use client';

import * as React from 'react';
import { Icon, Button, Badge } from '@showtik/ui';
import type { OrganiserEventDetail, OrganiserEventTier } from '@showtik/api-client';
import { PanelHead } from './PanelHead';

function priceLabel(t: OrganiserEventTier) {
  if (t.ticket_type === 'free') return 'Free';
  if (t.ticket_type === 'donation') return 'Donation';
  const n = Number(t.price);
  return isNaN(n) ? t.price : `₹${n.toLocaleString('en-IN')}`;
}

function ageLabel(t: OrganiserEventTier) {
  if (t.min_age != null && t.max_age != null) return `Age ${t.min_age}–${t.max_age}`;
  if (t.min_age != null) return `Age ${t.min_age}+`;
  if (t.max_age != null) return `Up to age ${t.max_age}`;
  return null;
}

/** Registration categories = the event's ticket tiers (live data). Editing
 *  happens in the event editor's Tickets step, which saves to the API. */
export function EventCategoriesPanel({ event, onEdit }: { event?: OrganiserEventDetail | null; onEdit: () => void }) {
  const tiers = [...(event?.ticket_tiers ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return (
    <div>
      <PanelHead title="Categories" subtitle="Distances, capacity and pricing participants choose at registration.">
        <Button onClick={onEdit}><Icon name="pencil" size={15} />Edit tickets</Button>
      </PanelHead>
      {tiers.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No categories yet. Add ticket categories to open registration.
          <div style={{ marginTop: 14 }}><Button onClick={onEdit}><Icon name="plus" size={15} />Add category</Button></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {tiers.map((t) => {
            const pct = t.quantity_total > 0 ? Math.min(100, (t.quantity_sold / t.quantity_total) * 100) : 0;
            const age = ageLabel(t);
            const onSale = t.sale_status === 'on_sale';
            return (
              <div key={t.id} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>{t.name}</div>
                  <Badge status={onSale ? 'live' : 'draft'}>{onSale ? 'On sale' : t.sale_status.replace(/_/g, ' ')}</Badge>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 13.5, color: 'var(--text-muted)' }}>
                  <span>{priceLabel(t)}</span>
                  {age && <span>{age}</span>}
                  {t.requires_approval && <span>Needs approval</span>}
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{t.code}</span>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: 'var(--color-muted-bg)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-accent)' }} />
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{t.quantity_sold} / {t.quantity_total} sold</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
