'use client';

import * as React from 'react';

export interface TicketTierRowProps {
  name: string;
  price: string;
  description?: string;
  available?: boolean;
  remaining?: number;
  quantity?: number;
  onQuantityChange?: (q: number) => void;
  style?: React.CSSProperties;
}

const stepBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  border: 'none',
  background: 'none',
  fontSize: 16,
  cursor: 'pointer',
  color: 'var(--text-heading)',
};

/** TicketTierRow — one ticket tier line in the buy panel: name, price, quantity stepper, availability. */
export function TicketTierRow({ name, price, description, available = true, remaining, quantity = 0, onQuantityChange, style }: TicketTierRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '16px 0',
        borderBottom: '1px solid var(--border-default)',
        fontFamily: 'var(--font-sans)',
        opacity: available ? 1 : 0.5,
        ...style,
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>{name}</div>
        {description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
        {remaining != null && available && (
          <div style={{ fontSize: 12, color: 'var(--color-warning)', marginTop: 4, fontWeight: 600 }}>{remaining} left</div>
        )}
        {!available && <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 4, fontWeight: 600 }}>Sold out</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 'none' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-accent)' }}>{price}</div>
        {available && (
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)' }}>
            <button onClick={() => onQuantityChange && onQuantityChange(Math.max(0, quantity - 1))} style={stepBtn}>−</button>
            <span style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{quantity}</span>
            <button onClick={() => onQuantityChange && onQuantityChange(quantity + 1)} style={stepBtn}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}
