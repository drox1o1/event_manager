import React, { useState } from 'react';
import { Icon } from '../icons/Icon';

/** Input — text/email/phone/number/search/date field with label, error and disabled states. */
export function Input({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  icon,
  style,
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-sans)', width: '100%', ...style }}>
      {label && (
        <span style={{ fontSize: 13, fontWeight: 'var(--text-label-weight)', color: 'var(--text-heading)' }}>{label}</span>
      )}
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 12, display: 'flex', color: 'var(--text-subtle)' }}>
            <Icon name={icon} size={16} />
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            padding: icon ? '11px 14px 11px 38px' : '11px 14px',
            borderRadius: 'var(--radius-control)',
            border: `1px solid ${error ? 'var(--color-error)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
            outline: 'none',
            background: disabled ? 'var(--color-muted-bg)' : 'var(--surface-card)',
            color: 'var(--text-body)',
            boxShadow: focus && !error ? 'var(--shadow-focus-ring)' : 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          {...rest}
        />
      </span>
      {error && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>{error}</span>}
    </label>
  );
}
