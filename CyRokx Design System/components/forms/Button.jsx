import React, { useState } from 'react';

const SIZES = {
  sm: { padding: '6px 14px', fontSize: 14, gap: 6, height: 32 },
  md: { padding: '10px 20px', fontSize: 16, gap: 8, height: 44 },
  lg: { padding: '14px 28px', fontSize: 18, gap: 8, height: 52 },
};

function look(variant, disabled, hover, active) {
  if (disabled) {
    return { background: 'var(--color-muted-bg)', color: 'var(--text-subtle)', border: '1px solid transparent' };
  }
  switch (variant) {
    case 'secondary':
      return {
        background: active ? 'var(--action-secondary-bg-hover)' : hover ? 'var(--action-secondary-bg-hover)' : 'transparent',
        color: 'var(--action-secondary-text)',
        border: '1px solid var(--action-secondary-border)',
      };
    case 'ghost':
      return {
        background: active ? 'var(--action-ghost-bg-hover)' : hover ? 'var(--action-ghost-bg-hover)' : 'transparent',
        color: 'var(--action-ghost-text)',
        border: '1px solid transparent',
      };
    case 'destructive':
      return {
        background: active ? 'var(--action-destructive-bg-hover)' : hover ? 'var(--action-destructive-bg-hover)' : 'var(--action-destructive-bg)',
        color: '#fff',
        border: '1px solid transparent',
      };
    default:
      return {
        background: active ? 'var(--action-primary-bg-active)' : hover ? 'var(--action-primary-bg-hover)' : 'var(--action-primary-bg)',
        color: 'var(--action-primary-text)',
        border: '1px solid transparent',
      };
  }
}

/** Button — primary/secondary/ghost/destructive action, three sizes, loading + disabled states. */
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button',
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const [focus, setFocus] = useState(false);
  const dim = SIZES[size] || SIZES.md;
  const colors = look(variant, disabled, hover, active);

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--text-button-weight)',
        fontSize: dim.fontSize,
        padding: dim.padding,
        height: dim.height,
        borderRadius: 'var(--radius-control)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: dim.gap,
        width: fullWidth ? '100%' : 'auto',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: 'background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        boxShadow: focus && !disabled ? 'var(--shadow-focus-ring)' : 'none',
        opacity: loading ? 0.75 : 1,
        ...colors,
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span
          style={{
            width: dim.fontSize,
            height: dim.fontSize,
            borderRadius: '50%',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            display: 'inline-block',
            animation: 'cyrokx-spin 0.7s linear infinite',
          }}
        />
      )}
      <style>{'@keyframes cyrokx-spin{to{transform:rotate(360deg)}}'}</style>
      {children}
    </button>
  );
}
