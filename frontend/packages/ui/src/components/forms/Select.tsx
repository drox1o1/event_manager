'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: (SelectOption | string)[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  style?: React.CSSProperties;
}

/** Select — single-choice dropdown (category, city, sort order). */
export function Select({ label, value, onChange, options = [], placeholder = 'Select…', disabled = false, error, style }: SelectProps) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-sans)', width: '100%', ...style }}>
      {label && <span style={{ fontSize: 13, fontWeight: 'var(--text-label-weight)' as unknown as number, color: 'var(--text-heading)' }}>{label}</span>}
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            appearance: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            padding: '11px 38px 11px 14px',
            borderRadius: 'var(--radius-control)',
            border: `1px solid ${error ? 'var(--color-error)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
            outline: 'none',
            background: disabled ? 'var(--color-muted-bg)' : 'var(--surface-card)',
            color: value ? 'var(--text-body)' : 'var(--text-subtle)',
            boxShadow: focus && !error ? 'var(--shadow-focus-ring)' : 'none',
            boxSizing: 'border-box',
          }}
        >
          <option value="" disabled hidden>{placeholder}</option>
          {options.map((o) => {
            const optValue = typeof o === 'string' ? o : o.value;
            const optLabel = typeof o === 'string' ? o : o.label;
            return (
              <option key={optValue} value={optValue}>{optLabel}</option>
            );
          })}
        </select>
        <span style={{ position: 'absolute', right: 12, pointerEvents: 'none', color: 'var(--text-subtle)', display: 'flex' }}>
          <Icon name="chevron-down" size={16} />
        </span>
      </span>
    </label>
  );
}
