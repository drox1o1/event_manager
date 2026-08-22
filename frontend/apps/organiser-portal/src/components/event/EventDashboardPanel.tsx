'use client';

import * as React from 'react';
import { StatCard } from '@cyrokx/ui';
import type { OrganiserEventDetail } from '@cyrokx/api-client';

// Balance/payable figures are money totals, so a zero should read "₹0.00", not
// the "Free" that formatINR returns (that mapping is for ticket prices).
function inr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ORDERS_SERIES = [
  { d: '02', v: 12 }, { d: '03', v: 5 }, { d: '04', v: 3 }, { d: '05', v: 4 }, { d: '06', v: 7 }, { d: '07', v: 3 }, { d: '08', v: 8 },
  { d: '09', v: 10 }, { d: '10', v: 29 }, { d: '11', v: 3 }, { d: '12', v: 5 }, { d: '13', v: 12 }, { d: '14', v: 5 }, { d: '15', v: 2 },
];

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  live: 'Published',
  soldout: 'Sold out',
};

function OrdersChart() {
  const W = 1120, H = 300, pad = { l: 34, r: 12, t: 12, b: 28 };
  const data = ORDERS_SERIES;
  const max = 30;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (i / (data.length - 1)) * iw;
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const pts = data.map((p, i) => [x(i), y(p.v)] as const);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${pad.l},${y(0)} Z`;
  const ticks = [0, 5, 10, 15, 20, 25, 30];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="ordFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-accent-secondary)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--color-accent-secondary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border-default)" strokeWidth="1" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-subtle)" fontFamily="var(--font-sans)">{t}</text>
        </g>
      ))}
      <path d={area} fill="url(#ordFill)" />
      <path d={line} fill="none" stroke="var(--color-accent-secondary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={data[i].v === max ? 4.5 : 3} fill="#fff" stroke="var(--color-accent-secondary)" strokeWidth="2" />)}
      {data.map((p, i) => <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-subtle)" fontFamily="var(--font-sans)">{p.d}-Jul</text>)}
    </svg>
  );
}

/** EventDashboard — the event overview: status, balance, orders and attendee
 *  counts (from the loaded event's ticket tiers) plus an orders-by-date chart. */
export function EventDashboardPanel({ event }: { event?: OrganiserEventDetail | null }) {
  const tiers = event?.ticket_tiers ?? [];
  const sold = tiers.reduce((n, t) => n + t.quantity_sold, 0);
  const revenue = tiers.reduce((sum, t) => sum + t.quantity_sold * Number(t.price), 0);
  const statusLabel = event ? STATUS_LABEL[event.status] ?? event.status : '—';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        <div style={{ background: 'linear-gradient(135deg, var(--color-accent-secondary), color-mix(in srgb, var(--color-accent-secondary) 78%, black))', borderRadius: 'var(--radius-card)', padding: 22, color: '#fff', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>Status</div>
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 6 }}>{statusLabel}</div>
        </div>
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', padding: 22, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)' }}>Balance</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-heading)', marginTop: 6 }}>{inr(0)}</div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span>Payable</span><span style={{ fontWeight: 600 }}>{inr(revenue)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 3 }}><span>Paid</span><span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{inr(revenue)}</span></div>
          </div>
        </div>
        <StatCard label="Orders" value={sold} icon="receipt" />
        <StatCard label="Attendees" value={sold} icon="users" />
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 18 }}>Orders by date</div>
        <OrdersChart />
      </div>
    </div>
  );
}
