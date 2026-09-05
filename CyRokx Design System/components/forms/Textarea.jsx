import React, { useState } from 'react';

/** Textarea — multi-line field for descriptions (event details, moderation reject reason). */
export function Textarea({ label, placeholder, value, onChange, error, disabled = false, rows = 4, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-sans)', width: '100%', ...style }}>
      {label && <span style={{ fontSize: 13, fontWeight: 'var(--text-label-weight)', color: 'var(--text-heading)' }}>{label}</span>}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%',
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          padding: '11px 14px',
          borderRadius: 'var(--radius-control)',
          border: `1px solid ${error ? 'var(--color-error)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
          outline: 'none',
          resize: 'vertical',
          background: disabled ? 'var(--color-muted-bg)' : 'var(--surface-card)',
          color: 'var(--text-body)',
          boxShadow: focus && !error ? 'var(--shadow-focus-ring)' : 'none',
          boxSizing: 'border-box',
        }}
        {...rest}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>{error}</span>}
    </label>
  );
}
