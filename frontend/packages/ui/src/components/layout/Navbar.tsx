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
  /** Called when the logo is clicked, instead of a plain "/" navigation
   *  (lets a Next.js host use its router rather than a full page load). */
  onLogoClick?: () => void;
  /** Organiser portal sign-in URL; shows an "Organiser Login" link top right. */
  organiserLoginUrl?: string;
  style?: React.CSSProperties;
}

/** Categories shown inline on desktop; the rest go under "More". */
const INLINE_CATEGORIES = 6;

const DEFAULT_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Ahmedabad', 'Chennai', 'Hyderabad', 'Kolkata'];

/** Navbar — public top navigation: wordmark, category links (in admin
 *  order; overflow under "More", a scrolling chip row on phones), city
 *  selector, search icon and the organiser login link. */
export function Navbar({
  categories = ['Music', 'Comedy', 'Workshops', 'Sports', 'Food'],
  cities = DEFAULT_CITIES,
  city = 'Mumbai',
  onSearchClick,
  onCategoryClick,
  onCityChange,
  onLogoClick,
  organiserLoginUrl,
  style,
}: NavbarProps) {
  const isMobile = useIsMobile();
  const [cityOpen, setCityOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const cityRef = React.useRef<HTMLDivElement>(null);
  const moreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!cityOpen && !moreOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [cityOpen, moreOpen]);

  const inline = categories.length > INLINE_CATEGORIES + 1 ? categories.slice(0, INLINE_CATEGORIES) : categories;
  const overflow = categories.slice(inline.length);
  const categoryLink = (c: string, linkStyle: React.CSSProperties, after?: () => void) => (
    <a
      key={c}
      href={`/category/${encodeURIComponent(c)}`}
      onClick={(e) => {
        after?.();
        if (!onCategoryClick || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        onCategoryClick(c);
      }}
      style={linkStyle}
    >
      {c}
    </a>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        rowGap: 10,
        padding: isMobile ? '14px 18px 10px' : '16px 32px',
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
        <a
          href="/"
          aria-label="Showtik home"
          onClick={onLogoClick ? (e) => { e.preventDefault(); onLogoClick(); } : undefined}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <LogoFull style={{ height: isMobile ? 24 : 30 }} />
        </a>
        {!isMobile && (
          <nav aria-label="Categories" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {inline.map((c) => categoryLink(c, { fontSize: 14, fontWeight: 600, color: 'var(--text-body)', textDecoration: 'none', whiteSpace: 'nowrap' }))}
            {overflow.length > 0 && (
              <div ref={moreRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: 'var(--text-body)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-sans)' }}
                >
                  More <Icon name={moreOpen ? 'chevron-up' : 'chevron-down'} size={14} color="var(--text-subtle)" />
                </button>
                {moreOpen && (
                  <div role="menu" style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, minWidth: 180, background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-modal)', border: '1px solid var(--border-default)', padding: 6, zIndex: 60 }}>
                    {overflow.map((c) => categoryLink(c, { display: 'block', padding: '9px 12px', borderRadius: 'var(--radius-control)', fontSize: 14, fontWeight: 500, color: 'var(--text-body)', textDecoration: 'none' }, () => setMoreOpen(false)))}
                  </div>
                )}
              </div>
            )}
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
        {organiserLoginUrl && (
          <a
            href={organiserLoginUrl}
            aria-label="Organiser login"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: isMobile ? 34 : 38, padding: isMobile ? '0 10px' : '0 16px', borderRadius: 10, background: 'var(--color-ink)', color: '#fff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            <Icon name="log-in" size={15} />{isMobile ? 'Organiser' : 'Organiser Login'}
          </a>
        )}
      </div>
      {isMobile && categories.length > 0 && (
        <nav aria-label="Categories" style={{ width: '100%', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -18px', padding: '0 18px' }}>
          {categories.map((c) => categoryLink(c, { flex: '0 0 auto', padding: '6px 12px', borderRadius: 999, border: '1px solid var(--border-default)', background: 'var(--surface-card)', fontSize: 13, fontWeight: 600, color: 'var(--text-body)', textDecoration: 'none', whiteSpace: 'nowrap' }))}
        </nav>
      )}
    </div>
  );
}
