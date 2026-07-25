'use client';

import * as React from 'react';

export interface RadioProps {
  label?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  name?: string;
  style?: React.CSSProperties;
}

/** Radio — single-choice radio button (payment method, ticket tier selection). */
export function Radio({ label, checked = false, onChange, disabled = false, name, style }: RadioProps) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: disabled ? 0.5 : 1, ...style }}>
      <input type="radio" name={name} checked={checked} onChange={onChange} disabled={disabled} style={{ display: 'none' }} />
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: `1.5px solid ${checked ? 'var(--color-accent)' : 'var(--border-default)'}`,
          background: 'var(--surface-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {checked && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)' }} />}
      </span>
      {label && <span style={{ fontSize: 15, color: 'var(--text-body)' }}>{label}</span>}
    </label>
  );
}
