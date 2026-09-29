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
      style={{ position: 'relative', width: '100%', aspectRatio: isMobile ? '4 / 3' : '16 / 5', overflow: 'hidden', background: 'var(--color-ink)' }}
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
            <img src={image ?? ''} alt={e.title} loading={i === 0 ? 'eager' : 'lazy'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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

function ArrowBtn({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button type="button" aria-label={dir === 'left' ? 'Previous event' : 'Next event'} onClick={onClick} style={{ width: 46, height: 46, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.45)', background: 'rgba(5,23,71,0.35)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <Icon name={dir === 'left' ? 'chevron-left' : 'chevron-right'} size={20} />
    </button>
  );
}
