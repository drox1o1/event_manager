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
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)' }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: up ? 'var(--color-success)' : down ? 'var(--color-error)' : 'var(--text-muted)' }}>
          {delta}
        </div>
      )}
    </div>
  );
}
