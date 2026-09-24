import * as React from 'react';
import { Icon } from '../icons/Icon';

export interface StatCardProps {
  label: string;
  value: string | number;
  /** e.g. "+12% vs last week"; leading +/- colors the delta green/red. */
  delta?: string;
  /** Lucide icon name shown top-right. */
  icon?: string;
  style?: React.CSSProperties;
}

/** StatCard — dashboard metric: label, value, optional delta (up/down). */
export function StatCard({ label, value, delta, icon, style }: StatCardProps) {
  const up = typeof delta === 'string' && delta.trim().startsWith('+');
  const down = typeof delta === 'string' && delta.trim().startsWith('-');
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: 20,
        fontFamily: 'var(--font-sans)',
        minWidth: 180,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        {icon && <Icon name={icon} size={16} color="var(--text-subtle)" />}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>{value}</div>
      {delta && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, marginTop: 8, padding: '3px 8px', borderRadius: 'var(--radius-pill)', background: up ? 'var(--color-success-bg)' : down ? 'var(--color-error-bg)' : 'var(--color-muted-bg)', color: up ? 'var(--color-success)' : down ? 'var(--color-error)' : 'var(--text-muted)' }}>
          {up ? '▲' : down ? '▼' : ''} {delta}
        </div>
      )}
    </div>
  );
}
