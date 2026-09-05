import React from 'react';
import { Icon } from '../icons/Icon';

/** SidebarShell — logged-in dashboard layout: left nav + content area. Shared by organiser and admin portals.
 *  accentColor lets a surface signal its own identity (e.g. the Super Admin Panel uses the secondary
 *  brand blue) while every primary action elsewhere still uses the one confident accent. */
export function SidebarShell({ brandLabel = 'CyRokx', navItems = [], activeKey, onNavigate, footer, accentColor = 'var(--color-accent)', children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100%', fontFamily: 'var(--font-sans)', background: 'var(--surface-page)' }}>
      <aside style={{ width: 232, background: 'var(--color-ink)', color: 'rgba(255,255,255,0.75)', display: 'flex', flexDirection: 'column', flex: 'none' }}>
        <div style={{ padding: '22px 24px', fontSize: 19, fontWeight: 700, color: '#fff' }}>
          {brandLabel.replace(/x$/i, '')}<span style={{ color: 'var(--color-accent)' }}>x</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', flex: 1 }}>
          {navItems.map((item) => {
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate && onNavigate(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: active ? `color-mix(in srgb, ${accentColor} 16%, transparent)` : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {item.icon && <Icon name={item.icon} size={17} />}
                {item.label}
              </button>
            );
          })}
        </nav>
        {footer && <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>{footer}</div>}
      </aside>
      <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
