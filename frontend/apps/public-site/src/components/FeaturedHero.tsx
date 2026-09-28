'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, useIsMobile } from '@showtik/ui';
import { formatDateTime, formatINR } from '@showtik/api-client';
import type { FeaturedEvent } from '@showtik/api-client';

const INTERVAL_MS = 6500;

/** Homepage hero built from the events the super admin featured. One event =
 *  a single full-bleed hero; two or more = an auto-advancing carousel with
 *  arrows, dots and keyboard support (pauses on hover/focus). */
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
      style={{ position: 'relative', height: isMobile ? 560 : 'min(78vh, 680px)', minHeight: isMobile ? 520 : 540, overflow: 'hidden', background: 'var(--color-ink)', color: '#fff' }}
    >
      {events.map((e, i) => {
        const active = i === index;
        return (
          <div
            key={e.id}
            role={multi ? 'group' : undefined}
            aria-roledescription={multi ? 'slide' : undefined}
            aria-label={multi ? `${i + 1} of ${count}` : undefined}
            aria-hidden={!active}
            style={{ position: 'absolute', inset: 0, opacity: active ? 1 : 0, transition: 'opacity 0.9s ease', pointerEvents: active ? 'auto' : 'none' }}
          >
            <div style={{ position: 'absolute', inset: 0, background: `center/cover no-repeat url(${e.banner_image_url})`, transform: active ? 'scale(1.04)' : 'scale(1.12)', transition: 'transform 7s ease-out' }} />
            <div style={{ position: 'absolute', inset: 0, background: isMobile
              ? 'linear-gradient(180deg, rgba(5,23,71,0.15) 0%, rgba(5,23,71,0.55) 45%, rgba(5,23,71,0.96) 100%)'
              : 'linear-gradient(90deg, rgba(5,23,71,0.95) 0%, rgba(5,23,71,0.78) 38%, rgba(5,23,71,0.15) 75%), linear-gradient(0deg, rgba(5,23,71,0.6) 0%, rgba(5,23,71,0) 35%)' }} />
            <div style={{ position: 'relative', height: '100%', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: isMobile ? '0 20px 88px' : '0 32px 96px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: 680, transform: active ? 'translateY(0)' : 'translateY(18px)', opacity: active ? 1 : 0, transition: 'transform 0.8s ease 0.15s, opacity 0.8s ease 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'var(--color-accent)', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    <Icon name="sparkles" size={13} /> Featured
                  </span>
                  {e.category && <span style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.35)', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{e.category}</span>}
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 'clamp(34px, 10vw, 46px)' : 'clamp(48px, 6.2vw, 84px)', fontWeight: 900, lineHeight: 0.94, letterSpacing: '-0.03em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                  {e.headline}
                </h1>
                {e.headline !== e.title && <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>{e.title}</div>}
                <div style={{ display: 'flex', gap: isMobile ? 12 : 22, flexWrap: 'wrap', fontSize: 15, color: 'rgba(255,255,255,0.88)', marginBottom: 28 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="calendar" size={16} />{formatDateTime(e.event_date, e.event_time ?? undefined)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="map-pin" size={16} />{e.location_type === 'venue' && e.venue_name ? `${e.venue_name}, ${e.city}` : e.city}</span>
                  {e.price_from !== null && <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="ticket" size={16} />{e.price_from === '0' || Number(e.price_from) === 0 ? 'Free entry' : `From ${formatINR(e.price_from)}`}</span>}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" tabIndex={active ? 0 : -1} onClick={() => router.push(`/events/${e.id}?book=1`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 52, padding: '0 28px', borderRadius: 12, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 30px rgba(196,20,63,0.45)' }}>
                    <Icon name="zap" size={17} /> {e.sold_out ? 'Sold out' : 'Book tickets'}
                  </button>
                  <button type="button" tabIndex={active ? 0 : -1} onClick={() => router.push(`/events/${e.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 52, padding: '0 24px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(6px)' }}>
                    View details <Icon name="arrow-right" size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {multi && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: isMobile ? 28 : 36, maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: isMobile ? '0 20px' : '0 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            {events.map((e, i) => (
              <button key={e.id} type="button" aria-label={`Show ${e.title}`} aria-current={i === index} onClick={() => go(i)} style={{ position: 'relative', height: 4, width: i === index ? 56 : 28, borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer', background: 'rgba(255,255,255,0.3)', overflow: 'hidden', transition: 'width .4s ease' }}>
                {i === index && <span key={`${index}-${paused}`} style={{ position: 'absolute', inset: 0, background: '#fff', transformOrigin: 'left', animation: paused ? 'none' : `showtik-progress ${INTERVAL_MS}ms linear forwards` }} />}
              </button>
            ))}
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', gap: 10 }}>
              <ArrowBtn dir="left" onClick={() => go(index - 1)} />
              <ArrowBtn dir="right" onClick={() => go(index + 1)} />
            </div>
          )}
          <style>{'@keyframes showtik-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}'}</style>
        </div>
      )}
    </section>
  );
}

function ArrowBtn({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button type="button" aria-label={dir === 'left' ? 'Previous event' : 'Next event'} onClick={onClick} style={{ width: 46, height: 46, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.45)', background: 'rgba(5,23,71,0.35)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <Icon name={dir === 'left' ? 'chevron-left' : 'chevron-right'} size={20} />
    </button>
  );
}
