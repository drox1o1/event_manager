'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, useIsMobile } from '@showtik/ui';
import type { FeaturedEvent } from '@showtik/api-client';

const INTERVAL_MS = 6500;

/** Homepage hero: the banners of the events the super admin featured, shown
 *  as-is (no text overlay) at a fixed 16:5 ratio (4:3 on phones, using the
 *  optional mobile artwork). Each banner is a link -- to the admin-set URL or
 *  the event page. Two or more banners auto-advance as a carousel with arrows,
 *  dots and keyboard support (pauses on hover/focus).
 *
 *  Artwork sizes shared with the client: 1920x600 desktop (keep content in the
 *  centre 1600x500), 1080x810 mobile. */
export function FeaturedHero({ events }: { events: FeaturedEvent[] }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = events.length;
  const multi = count > 1;

  const go = React.useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  React.useEffect(() => {
    if (!multi || paused) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, multi, go]);

  return (
    <section
      aria-roledescription={multi ? 'carousel' : undefined}
      aria-label="Featured events"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => { if (!multi) return; if (e.key === 'ArrowRight') go(index + 1); if (e.key === 'ArrowLeft') go(index - 1); }}
      style={{ position: 'relative', width: '100%', aspectRatio: isMobile ? '16 / 9' : '12 / 5', maxHeight: '72vh', overflow: 'hidden', background: 'var(--color-ink)' }}
    >
      {events.map((e, i) => {
        const active = i === index;
        const href = e.link_url || `/events/${e.id}`;
        const internal = href.startsWith('/');
        const image = (isMobile && e.mobile_banner_url) || e.banner_image_url;
        return (
          <a
            key={e.id}
            href={href}
            target={internal ? undefined : '_blank'}
            rel={internal ? undefined : 'noopener noreferrer'}
            onClick={(ev) => {
              if (!internal || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
              ev.preventDefault();
              router.push(href);
            }}
            tabIndex={active ? 0 : -1}
            role={multi ? 'group' : undefined}
            aria-roledescription={multi ? 'slide' : undefined}
            aria-label={multi ? `${e.title} (${i + 1} of ${count})` : e.title}
            aria-hidden={!active}
            style={{ position: 'absolute', inset: 0, display: 'block', opacity: active ? 1 : 0, transition: 'opacity 0.9s ease', pointerEvents: active ? 'auto' : 'none' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <>
              {/* Blurred copy fills the side gutters; the real banner is shown whole (never cropped). */}
              <img src={image ?? ''} alt="" aria-hidden loading={i === 0 ? 'eager' : 'lazy'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) brightness(0.85)', transform: 'scale(1.15)' }} />
              <img src={image ?? ''} alt={e.title} loading={i === 0 ? 'eager' : 'lazy'} style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            </>
              <HeroDetails e={e} isMobile={isMobile} multi={multi} />
          </a>
        );
      })}

      {multi && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: isMobile ? 12 : 20, maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: isMobile ? '0 16px' : '0 32px', display: 'flex', alignItems: 'center', gap: 16, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', gap: 8, flex: 1, justifyContent: 'center', pointerEvents: 'auto' }}>
            {events.map((e, i) => (
              <button key={e.id} type="button" aria-label={`Show ${e.title}`} aria-current={i === index} onClick={() => go(i)} style={{ position: 'relative', height: 4, width: i === index ? 40 : 20, borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer', background: 'rgba(255,255,255,0.45)', boxShadow: '0 0 4px rgba(0,0,0,0.35)', overflow: 'hidden', transition: 'width .4s ease' }}>
                {i === index && <span key={`${index}-${paused}`} style={{ position: 'absolute', inset: 0, background: '#fff', transformOrigin: 'left', animation: paused ? 'none' : `showtik-progress ${INTERVAL_MS}ms linear forwards` }} />}
              </button>
            ))}
          </div>
          <style>{'@keyframes showtik-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}'}</style>
        </div>
      )}
      {multi && !isMobile && (
        <>
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}><ArrowBtn dir="left" onClick={() => go(index - 1)} /></div>
          <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}><ArrowBtn dir="right" onClick={() => go(index + 1)} /></div>
        </>
      )}
    </section>
  );
}

function when(e: FeaturedEvent) {
  const d = new Date(`${e.event_date}T00:00:00`);
  const day = isNaN(d.getTime()) ? e.event_date : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const t = e.event_time ? (() => { const [h, m] = e.event_time.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; })() : null;
  return t ? `${day} · ${t}` : day;
}

function price(e: FeaturedEvent) {
  if (e.sold_out) return 'Sold out';
  const n = e.price_from == null ? null : Number(e.price_from);
  if (n == null || isNaN(n)) return null;
  return n > 0 ? `From ₹${n.toLocaleString('en-IN')}` : 'Free';
}

/** Always-visible event details over the banner: what it is, when/where,
 *  price and a clear CTA. Phones get a compact title + CTA strip. */
function HeroDetails({ e, isMobile, multi }: { e: FeaturedEvent; isMobile: boolean; multi: boolean }) {
  const cta = e.sold_out ? 'View event' : Number(e.price_from ?? 0) > 0 ? 'Book tickets' : 'Register now';
  const ctaEl = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: isMobile ? 34 : 40, padding: isMobile ? '0 14px' : '0 18px', borderRadius: 8, background: 'var(--action-primary-bg)', color: '#fff', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', flex: 'none' }}>
      {cta}<Icon name="arrow-right" size={15} />
    </span>
  );
  if (isMobile) {
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: `28px 14px ${multi ? 26 : 12}px`, background: 'linear-gradient(to top, rgba(5,12,32,0.85), rgba(5,12,32,0))', display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
        {ctaEl}
      </div>
    );
  }
  const where = [e.venue_name, e.city].filter(Boolean).join(', ') || (e.location_type === 'online' ? 'Online' : null);
  const p = price(e);
  return (
    <div
      style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end',
        background: 'linear-gradient(to top, rgba(5,12,32,0.88) 0%, rgba(5,12,32,0.55) 35%, rgba(5,12,32,0) 65%)',
        color: '#fff',
      }}
    >
      <div style={{ width: '100%', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: `0 88px ${multi ? 48 : 32}px`, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {e.category && <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)' }}>{e.category}</span>}
          <div style={{ fontSize: 'clamp(22px, 2.4vw, 32px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{e.headline || e.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 18px', fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={15} />{when(e)}</span>
            {where && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={15} />{where}</span>}
            {e.organiser_name && <span>by {e.organiser_name}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flex: 'none' }}>
          {p && <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{p}</span>}
          {ctaEl}
        </div>
      </div>
    </div>
  );
}

function ArrowBtn({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button type="button" aria-label={dir === 'left' ? 'Previous event' : 'Next event'} onClick={onClick} style={{ width: 46, height: 46, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.45)', background: 'rgba(5,23,71,0.35)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <Icon name={dir === 'left' ? 'chevron-left' : 'chevron-right'} size={20} />
    </button>
  );
}
