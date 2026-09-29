'use client';

import * as React from 'react';

export interface PhoneInputProps {
  label?: string;
  /** The 10-digit mobile number without the country code. */
  value: string;
  onChange: (digits: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}

/** Indian mobile number: 10 digits starting 6-9. */
export const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

/** Strips a stored "+91XXXXXXXXXX" (or any formatting) down to the 10 digits. */
export function toMobileDigits(value: string | null | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits.length > 10 && digits.startsWith('91') ? digits.slice(-10) : digits.slice(0, 10);
}

/** PhoneInput — mobile number with a fixed +91 prefix. Accepts digits only
 *  (letters and symbols are dropped as they're typed or pasted) and at most
 *  10 of them. */
export function PhoneInput({ label, value, onChange, error, disabled = false, placeholder = '98765 43210', style }: PhoneInputProps) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-sans)', width: '100%', ...style }}>
      {label && <span style={{ fontSize: 13, fontWeight: 'var(--text-label-weight)' as unknown as number, color: 'var(--text-heading)' }}>{label}</span>}
      <span
        style={{
          display: 'flex', alignItems: 'stretch', borderRadius: 'var(--radius-control)', overflow: 'hidden',
          border: `1px solid ${error ? 'var(--color-error)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
          boxShadow: focus && !error ? 'var(--shadow-focus-ring)' : 'none',
          background: disabled ? 'var(--color-muted-bg)' : 'var(--surface-card)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', background: 'var(--color-off-white)', borderRight: '1px solid var(--border-default)' }}>+91</span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-sans)', fontSize: 15, padding: '11px 14px', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-body)', letterSpacing: '0.02em' }}
        />
      </span>
      {error && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>{error}</span>}
    </label>
  );
}
