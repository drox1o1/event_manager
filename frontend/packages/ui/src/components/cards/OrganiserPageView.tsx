'use client';

import * as React from 'react';
import type { OrganiserPublicPage } from '@showtik/api-client';
import { formatEventDate, formatINR } from '@showtik/api-client';
import { Icon } from '../icons/Icon';
import { EventCard } from './EventCard';
import { useIsMobile } from '../../hooks/useMediaQuery';

export interface OrganiserPageViewProps {
  page: OrganiserPublicPage;
  onOpenEvent?: (eventId: string) => void;
  /** Shown as a small ribbon when rendered inside the organiser portal. */
  previewLabel?: string;
}

/** Public organiser page — cover, logo, name, bio, links and live events.
 *  Rendered by the public site and as the live preview in the organiser portal. */
export function OrganiserPageView({ page, onOpenEvent, previewLabel }: OrganiserPageViewProps) {
  const isMobile = useIsMobile();
  const since = new Date(page.member_since);
  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: 'var(--surface-page)' }}>
      <div style={{ position: 'relative', height: isMobile ? 180 : 280, background: page.cover_url ? `center/cover no-repeat url(${page.cover_url})` : 'var(--gradient-hero)', overflow: 'hidden' }}>
        {!page.cover_url && <span aria-hidden style={{ position: 'absolute', top: '-40%', right: '-8%', width: '40%', height: '200%', background: 'var(--gradient-brand)', opacity: 0.45, transform: 'rotate(18deg)', borderRadius: 40 }} />}
        {previewLabel && <span style={{ position: 'absolute', top: 14, left: 14, padding: '5px 12px', borderRadius: 'var(--radius-pill)', background: 'rgba(5,23,71,0.75)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{previewLabel}</span>}
      </div>
      <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: isMobile ? '0 16px 48px' : '0 32px 64px' }}>
        {/* Only the logo overlaps the cover; the name/meta row sits below it so
            dark text never lands on the dark cover. */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 20, marginTop: 16, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ marginTop: isMobile ? -60 : -80, width: isMobile ? 88 : 128, height: isMobile ? 88 : 128, borderRadius: 24, border: '4px solid var(--surface-card)', background: page.logo_url ? `center/cover no-repeat url(${page.logo_url})` : 'var(--gradient-brand)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 34 : 48, flex: 'none', position: 'relative' }}>
            {!page.logo_url && page.org_name.charAt(0).toUpperCase()}
          </div>
          <div style={{ paddingBottom: 6, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-accent)' }}><Icon name="badge-check" size={15} />Verified organiser</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 28 : 40, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-heading)', margin: '6px 0 6px', lineHeight: 1.05 }}>{page.org_name}</h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-muted)' }}>
              {page.city && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="map-pin" size={14} />{page.city}</span>}
              {!Number.isNaN(since.getTime()) && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="calendar-check" size={14} />On Showtik since {since.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="ticket" size={14} />{page.events.length} upcoming event{page.events.length === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
            {page.website_url && <a href={page.website_url} target="_blank" rel="noreferrer" style={linkBtn}><Icon name="globe" size={15} />Website</a>}
            {page.instagram_url && <a href={page.instagram_url} target="_blank" rel="noreferrer" style={linkBtn}><Icon name="instagram" size={15} />Instagram</a>}
          </div>
        </div>

        {page.bio && (
          <div style={{ marginTop: 32, maxWidth: 760, fontSize: 16, lineHeight: 1.7, color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{page.bio}</div>
        )}

        <h2 style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-heading)', margin: '44px 0 20px' }}>
          <span aria-hidden style={{ width: 5, height: 26, background: 'var(--gradient-brand)', borderRadius: 3 }} />Upcoming events
        </h2>
        {page.events.length === 0 ? (
          <div style={{ padding: '36px 24px', textAlign: 'center', background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', color: 'var(--text-muted)' }}>No upcoming events right now — check back soon.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
            {page.events.map((e) => (
              <EventCard key={e.id} image={e.banner_image_url ?? undefined} title={e.title} date={formatEventDate(e.event_date)} city={e.city} priceFrom={formatINR(e.price_from)} category={e.category ?? undefined} soldOut={e.sold_out} onClick={onOpenEvent ? () => onOpenEvent(e.id) : undefined} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const linkBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)', fontWeight: 600, fontSize: 14, textDecoration: 'none' };
