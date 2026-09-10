'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';
import { useIsMobile } from '../../hooks/useMediaQuery';

export interface NavbarProps {
  categories?: string[];
  city?: string;
  onSearchClick?: () => void;
  style?: React.CSSProperties;
}

/** Navbar — public top navigation: wordmark, category links, city selector, search icon. */
export function Navbar({ categories = ['Music', 'Comedy', 'Workshops', 'Sports', 'Food'], city = 'Mumbai', onSearchClick, style }: NavbarProps) {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '14px 18px' : '16px 32px',
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-default)',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>
          CyRok<span style={{ color: 'var(--color-accent)' }}>x</span>
        </span>
        {!isMobile && (
          <nav style={{ display: 'flex', gap: 24 }}>
            {categories.map((c) => (
              <a key={c} href="#" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-body)', textDecoration: 'none' }}>{c}</a>
            ))}
          </nav>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 20 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-body)', cursor: 'pointer' }}>
          <Icon name="map-pin" size={15} color="var(--text-muted)" /> {city} <Icon name="chevron-down" size={14} color="var(--text-subtle)" />
        </span>
        <button onClick={onSearchClick} aria-label="Search" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-heading)', display: 'flex' }}>
          <Icon name="search" size={19} />
        </button>
      </div>
    </div>
  );
}
