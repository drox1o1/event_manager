'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';

export interface EventCardProps {
  image?: string;
  title: string;
  date: string;
  city: string;
  priceFrom: string;
  category?: string;
  soldOut?: boolean;
  /** Event page URL. When set the card is a real link (open in new tab,
   *  crawlable); a plain left-click still calls onClick for in-app routing. */
  href?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** EventCard — the core discovery unit: poster image with category chip,
 *  title, date, city and price-from. Image zooms and card lifts on hover. */
export function EventCard({ image, title, date, city, priceFrom, category, soldOut = false, href, onClick, style }: EventCardProps) {
  const [hover, setHover] = React.useState(false);
  const [day, ...rest] = date.split(' ');
  const Root = href ? 'a' : 'div';
  return (
    <Root
      href={href}
      onClick={(e: React.MouseEvent) => {
        if (!onClick) return;
        if (href && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
        e.preventDefault();
        onClick();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role={!href && onClick ? 'link' : undefined}
      tabIndex={!href && onClick ? 0 : undefined}
      onKeyDown={(e: React.KeyboardEvent) => { if (!href && onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
      style={{
        color: 'inherit',
        textDecoration: 'none',
        borderRadius: 18,
        background: 'var(--surface-card)',
        overflow: 'hidden',
        cursor: onClick || href ? 'pointer' : 'default',
        boxShadow: hover ? '0 18px 40px rgba(5,23,71,0.16)' : '0 2px 10px rgba(5,23,71,0.06)',
        transform: hover ? 'translateY(-4px)' : 'none',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', background: 'var(--gradient-poster)' }}>
        {image ? (
          <div style={{ position: 'absolute', inset: 0, background: `center/cover no-repeat url(${image})`, transform: hover ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.5s ease' }} />
        ) : (
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-hero)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '-0.01em', padding: '0 20px', textAlign: 'center', lineHeight: 1.05 }}>{title}</span>
          </span>
        )}
        <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,23,71,0) 55%, rgba(5,23,71,0.55) 100%)' }} />
        {category && (
          <span style={{ position: 'absolute', top: 12, left: 12, padding: '5px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', color: 'var(--text-heading)', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{category}</span>
        )}
        <span style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'baseline', gap: 6, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
          {day} <span style={{ fontWeight: 600, fontSize: 13.5, opacity: 0.92 }}>{rest.join(' ')}</span>
        </span>
        {soldOut && (
          <span style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,13,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.12em' }}>
            SOLD OUT
          </span>
        )}
      </div>
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8, lineHeight: 1.25, letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          <Icon name="map-pin" size={13} /> {city}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, fontSize: 12.5, color: 'var(--text-subtle)' }}>
            {priceFrom === 'Free' ? '' : 'from'} <span style={{ fontFamily: 'var(--font-display)', color: priceFrom === 'Free' ? 'var(--color-success)' : 'var(--color-accent)', fontWeight: 800, fontSize: 17 }}>{priceFrom}</span>
          </span>
          <span style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hover ? 'var(--color-accent)' : 'var(--color-off-white)', color: hover ? '#fff' : 'var(--text-heading)', transition: 'background .2s ease, color .2s ease' }}>
            <Icon name="arrow-up-right" size={15} />
          </span>
        </div>
      </div>
    </Root>
  );
}
