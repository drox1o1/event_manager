'use client';

import * as React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  label?: string;
  style?: React.CSSProperties;
}

/** Switch — on/off toggle (notification preferences, check-in status). */
export function Switch({ checked = false, onChange, disabled = false, label, style }: SwitchProps) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: disabled ? 0.5 : 1, ...style }}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={{ display: 'none' }} />
      <span
        style={{
          width: 40,
          height: 24,
          borderRadius: 'var(--radius-pill)',
          background: checked ? 'var(--color-accent)' : 'var(--color-rule)',
          position: 'relative',
          transition: 'background 0.15s ease',
          flex: 'none',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 19 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.15s ease',
          }}
        />
      </span>
      {label && <span style={{ fontSize: 15, color: 'var(--text-body)' }}>{label}</span>}
    </label>
  );
}
