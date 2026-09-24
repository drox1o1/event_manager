'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';
import { LogoFull } from '../brand/Logo';
import { useIsMobile } from '../../hooks/useMediaQuery';

export interface NavbarProps {
  categories?: string[];
  cities?: string[];
  city?: string;
  onSearchClick?: () => void;
  onCategoryClick?: (category: string) => void;
  onCityChange?: (city: string) => void;
  style?: React.CSSProperties;
}

const DEFAULT_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Ahmedabad', 'Chennai', 'Hyderabad', 'Kolkata'];

/** Navbar — public top navigation: wordmark, category links, city selector, search icon. */
export function Navbar({
  categories = ['Music', 'Comedy', 'Workshops', 'Sports', 'Food'],
  cities = DEFAULT_CITIES,
  city = 'Mumbai',
  onSearchClick,
  onCategoryClick,
  onCityChange,
  style,
}: NavbarProps) {
  const isMobile = useIsMobile();
  const [cityOpen, setCityOpen] = React.useState(false);
  const cityRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!cityOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [cityOpen]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '14px 18px' : '16px 32px',
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'saturate(180%) blur(12px)',
        WebkitBackdropFilter: 'saturate(180%) blur(12px)',
        borderBottom: '1px solid var(--border-default)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <LogoFull style={{ height: isMobile ? 24 : 30 }} />
        {!isMobile && (
          <nav style={{ display: 'flex', gap: 24 }}>
            {categories.map((c) => (
              <a
                key={c}
                href={`/category/${encodeURIComponent(c)}`}
                onClick={onCategoryClick ? (e) => { e.preventDefault(); onCategoryClick(c); } : undefined}
                style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-body)', textDecoration: 'none' }}
              >
                {c}
              </a>
            ))}
          </nav>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 20 }}>
        <div ref={cityRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setCityOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={cityOpen}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-body)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-sans)' }}
          >
            <Icon name="map-pin" size={15} color="var(--text-muted)" /> {city} <Icon name={cityOpen ? 'chevron-up' : 'chevron-down'} size={14} color="var(--text-subtle)" />
          </button>
          {cityOpen && (
            <div
              role="listbox"
              style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0, minWidth: 180,
                background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-modal)',
                border: '1px solid var(--border-default)', padding: 6, zIndex: 60, maxHeight: 320, overflowY: 'auto',
              }}
            >
              {cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="option"
                  aria-selected={c === city}
                  onClick={() => { onCityChange && onCityChange(c); setCityOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                    padding: '9px 12px', borderRadius: 'var(--radius-control)', border: 'none', cursor: 'pointer',
                    background: c === city ? 'var(--surface-accent-tint)' : 'transparent',
                    color: c === city ? 'var(--color-accent)' : 'var(--text-body)',
                    fontWeight: c === city ? 700 : 500, fontSize: 14, fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Icon name="map-pin" size={14} />{c}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onSearchClick} aria-label="Search" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-heading)', display: 'flex' }}>
          <Icon name="search" size={19} />
        </button>
      </div>
    </div>
  );
}
