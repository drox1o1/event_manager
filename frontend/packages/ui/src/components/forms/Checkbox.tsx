'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';

export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Checkbox — labeled checkbox with accent-filled checked state. */
export function Checkbox({ label, checked = false, onChange, disabled = false, style }: CheckboxProps) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: disabled ? 0.5 : 1, ...style }}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={{ display: 'none' }} />
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          border: `1.5px solid ${checked ? 'var(--color-accent)' : 'var(--border-default)'}`,
          background: checked ? 'var(--color-accent)' : 'var(--surface-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
          transition: 'background 0.15s ease, border-color 0.15s ease',
        }}
      >
        {checked && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
      </span>
      {label && <span style={{ fontSize: 15, color: 'var(--text-body)' }}>{label}</span>}
    </label>
  );
}
