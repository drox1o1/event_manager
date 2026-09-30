'use client';

import * as React from 'react';
import { StatCard } from '@showtik/ui';
import type { OrganiserEventDetail } from '@showtik/api-client';

// Balance/payable figures are money totals, so a zero should read "₹0.00", not
// the "Free" that formatINR returns (that mapping is for ticket prices).
function inr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  live: 'Published',
  soldout: 'Sold out',
};

/** EventDashboard — the event overview, all from the loaded event's ticket
 *  tiers: status, gross sales, tickets sold, capacity left and a per-category
 *  sales breakdown. (No per-day orders API yet, so no date chart.) */
export function EventDashboardPanel({ event }: { event?: OrganiserEventDetail | null }) {
  const tiers = event?.ticket_tiers ?? [];
  const sold = tiers.reduce((n, t) => n + t.quantity_sold, 0);
  const total = tiers.reduce((n, t) => n + t.quantity_total, 0);
  const revenue = tiers.reduce((sum, t) => sum + t.quantity_sold * (Number(t.price) || 0), 0);
  const statusLabel = event ? STATUS_LABEL[event.status] ?? event.status : '—';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 28 }}>
        <div style={{ background: 'linear-gradient(135deg, var(--color-accent-secondary), color-mix(in srgb, var(--color-accent-secondary) 78%, black))', borderRadius: 'var(--radius-card)', padding: 22, color: '#fff', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>Status</div>
          <div style={{ fontSize: 30, fontWeight: 600, marginTop: 6 }}>{statusLabel}</div>
        </div>
        <StatCard label="Gross sales" value={inr(revenue)} icon="receipt" />
        <StatCard label="Tickets sold" value={sold} icon="users" />
        <StatCard label="Spots left" value={Math.max(0, total - sold)} icon="ticket" />
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 14 }}>Sales by category</div>
        {tiers.length === 0 ? (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No ticket categories yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-subtle)', fontSize: 12.5 }}>
                <th style={{ padding: '8px 0', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right' }}>Sold</th>
                <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right' }}>Capacity</th>
                <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right' }}>Sales</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-heading)' }}>{t.name}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>{t.quantity_sold}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>{t.quantity_total}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{inr(t.quantity_sold * (Number(t.price) || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
