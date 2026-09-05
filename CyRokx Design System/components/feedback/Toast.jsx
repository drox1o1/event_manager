import React from 'react';
import { Icon } from '../icons/Icon';

const LOOK = {
  success: { icon: 'check-circle', fg: 'var(--color-success)', bg: '#fff' },
  error: { icon: 'alert-circle', fg: 'var(--color-error)', bg: '#fff' },
  info: { icon: 'info', fg: 'var(--color-ink)', bg: '#fff' },
};

/** Toast — transient inline alert (success/error/info), fixed bottom-right in product shells. */
export function Toast({ variant = 'info', title, description, onClose, style }) {
  const look = LOOK[variant] || LOOK.info;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        background: look.bg,
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-modal)',
        padding: '14px 16px',
        width: 340,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <span style={{ color: look.fg, flex: 'none', marginTop: 2 }}><Icon name={look.icon} size={18} /></span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>{title}</div>
        {description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: 2 }}>
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}
