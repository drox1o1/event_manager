import * as React from 'react';

export interface TagProps {
  children?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** Tag — category chip (Music, Comedy, Workshops…), neutral by default. */
export function Tag({ children, active = false, onClick, style }: TagProps) {
  const clickable = typeof onClick === 'function';
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 14px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        background: active ? 'var(--color-accent-tint)' : 'var(--surface-card)',
        color: active ? 'var(--color-accent)' : 'var(--text-body)',
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--border-default)'}`,
        cursor: clickable ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
