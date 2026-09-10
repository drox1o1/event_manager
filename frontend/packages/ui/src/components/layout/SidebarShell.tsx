'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';
import { useIsMobile } from '../../hooks/useMediaQuery';

export interface SidebarNavItem {
  key: string;
  label: string;
  /** Lucide icon name. */
  icon?: string;
}

export interface SidebarShellProps {
  brandLabel?: string;
  navItems: SidebarNavItem[];
  activeKey?: string;
  onNavigate?: (key: string) => void;
  footer?: React.ReactNode;
  accentColor?: string;
  children?: React.ReactNode;
}

function Wordmark({ brandLabel }: { brandLabel: string }) {
  return (
    <span style={{ fontSize: 19, fontWeight: 700, color: '#fff' }}>
      {brandLabel.replace(/x$/i, '')}
      <span style={{ color: 'var(--color-accent)' }}>x</span>
    </span>
  );
}

/** SidebarShell — logged-in dashboard layout: left nav + content area. Shared by organiser and admin portals.
 *  On phones the fixed sidebar collapses into a top bar with a hamburger that opens the nav as an overlay drawer.
 *  accentColor lets a surface signal its own identity (e.g. the Super Admin Panel uses the secondary
 *  brand blue) while every primary action elsewhere still uses the one confident accent. */
export function SidebarShell({ brandLabel = 'CyRokx', navItems = [], activeKey, onNavigate, footer, accentColor = 'var(--color-accent)', children }: SidebarShellProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const navList = (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', flex: 1 }}>
      {navItems.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            onClick={() => { onNavigate && onNavigate(item.key); setDrawerOpen(false); }}
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
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: 'var(--font-sans)', background: 'var(--surface-page)' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-ink)', position: 'sticky', top: 0, zIndex: 30 }}>
          <Wordmark brandLabel={brandLabel} />
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <Icon name="menu" size={24} />
          </button>
        </header>

        {drawerOpen && (
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}>
            <aside
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 260, maxWidth: '82vw', background: 'var(--color-ink)', color: 'rgba(255,255,255,0.75)', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 24px rgba(0,0,0,0.3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px' }}>
                <Wordmark brandLabel={brandLabel} />
                <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex' }}>
                  <Icon name="x" size={22} />
                </button>
              </div>
              {navList}
              {footer && <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>{footer}</div>}
            </aside>
          </div>
        )}

        <main style={{ flex: 1, padding: 18, overflow: 'auto' }}>{children}</main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100%', fontFamily: 'var(--font-sans)', background: 'var(--surface-page)' }}>
      <aside style={{ width: 232, background: 'var(--color-ink)', color: 'rgba(255,255,255,0.75)', display: 'flex', flexDirection: 'column', flex: 'none' }}>
        <div style={{ padding: '22px 24px' }}><Wordmark brandLabel={brandLabel} /></div>
        {navList}
        {footer && <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>{footer}</div>}
      </aside>
      <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
