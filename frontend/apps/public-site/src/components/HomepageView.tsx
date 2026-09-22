'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, EventCard, SearchBar } from '@showtik/ui';
import { formatEventDate, formatINR } from '@showtik/api-client';
import type { CategorySummary, EventSummary, HomepageContent, HomepageResolvedSection } from '@showtik/api-client';
import { iconForCategory } from '@/lib/categoryIcons';

export interface HomepageViewProps {
  content: HomepageContent;
}

/** Homepage — hero + optional announcement banner + CMS-controlled sections
 *  (category grid / event rows), all driven by the super-admin homepage CMS. */
export function HomepageView({ content }: HomepageViewProps) {
  const router = useRouter();
  const [city, setCity] = React.useState('');
  const [keyword, setKeyword] = React.useState('');

  const { hero, banner, sections } = content;

  const goSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (keyword) params.set('q', keyword);
    router.push(`/events${params.toString() ? `?${params}` : ''}`);
  };

  const openEvent = (id: string) => router.push(`/events/${id}`);

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {banner.enabled && banner.text && (
        <a
          href={banner.link_url || undefined}
          onClick={(e) => {
            if (banner.link_url && banner.link_url.startsWith('/')) { e.preventDefault(); router.push(banner.link_url); }
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--color-accent)', color: '#fff', padding: '10px 20px', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
        >
          <Icon name="megaphone" size={15} />{banner.text}
          {banner.link_url && <Icon name="arrow-right" size={14} />}
        </a>
      )}

      <div
        style={{
          position: 'relative',
          padding: 'clamp(64px, 11vw, 112px) clamp(20px, 5vw, 32px) clamp(84px, 13vw, 132px)',
          background: 'var(--gradient-hero)',
          color: '#fff',
          textAlign: 'center',
          overflow: 'hidden',
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 44px), 0 100%)',
        }}
      >
        {/* Diagonal brand-gradient energy streak */}
        <span aria-hidden style={{ position: 'absolute', top: '-30%', right: '-12%', width: '46%', height: '190%', background: 'var(--gradient-brand)', opacity: 0.5, transform: 'rotate(18deg)', filter: 'blur(2px)', borderRadius: 40 }} />
        <span aria-hidden style={{ position: 'absolute', bottom: '-40%', left: '-14%', width: '38%', height: '170%', background: 'radial-gradient(circle, rgba(34,83,246,0.55), transparent 70%)', transform: 'rotate(-12deg)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', marginBottom: 16 }}>
            <span style={{ width: 22, height: 2, background: 'var(--color-accent)', borderRadius: 2 }} />
            {hero.eyebrow}
            <span style={{ width: 22, height: 2, background: 'var(--color-accent)', borderRadius: 2 }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 7.5vw, 68px)', fontWeight: 800, lineHeight: 0.98, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: `0 0 ${hero.subheadline ? 18 : 34}px` }}>{hero.headline}</h1>
          {hero.subheadline && (
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.82)', maxWidth: 620, margin: '0 auto 34px', lineHeight: 1.5 }}>{hero.subheadline}</p>
          )}
          {hero.search_enabled && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SearchBar
                keyword={keyword}
                onKeywordChange={(e) => setKeyword(e.target.value)}
                location={city}
                onLocationChange={(e) => setCity(e.target.value)}
                onSubmit={goSearch}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: 'clamp(32px, 6vw, 48px) clamp(16px, 4vw, 32px)' }}>
        {sections.length === 0 && <EmptyEvents />}
        {sections.map((section, i) => (
          <SectionBlock
            key={`${section.type}-${i}`}
            section={section}
            onOpenEvent={openEvent}
            onOpenCategory={(name) => router.push(`/category/${encodeURIComponent(name)}`)}
            onSeeAll={() => router.push('/events')}
          />
        ))}
      </div>
    </div>
  );
}

function SectionBlock({
  section, onOpenEvent, onOpenCategory, onSeeAll,
}: {
  section: HomepageResolvedSection;
  onOpenEvent: (id: string) => void;
  onOpenCategory: (name: string) => void;
  onSeeAll: () => void;
}) {
  if (section.type === 'category_grid') {
    const categories = section.categories ?? [];
    if (categories.length === 0) return null;
    return (
      <div style={{ marginBottom: 56 }}>
        <SectionHeading title={section.title} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {categories.map((c: CategorySummary) => (
            <CategoryTile key={c.id} name={c.name} onClick={() => onOpenCategory(c.name)} />
          ))}
        </div>
      </div>
    );
  }

  const events = section.events ?? [];
  if (events.length === 0) return null;
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <SectionHeading title={section.title} />
        <a
          href="/events"
          onClick={(e) => { e.preventDefault(); onSeeAll(); }}
          style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-link)', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          See all &rarr;
        </a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
        {events.map((e: EventSummary) => (
          <EventCard
            key={e.id}
            title={e.title}
            date={formatEventDate(e.event_date)}
            city={e.city}
            priceFrom={formatINR(e.price_from)}
            category={e.category ?? undefined}
            soldOut={e.sold_out}
            onClick={() => onOpenEvent(e.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', color: 'var(--text-heading)', margin: 0 }}>
      <span aria-hidden style={{ width: 5, height: 26, background: 'var(--gradient-brand)', borderRadius: 3, flex: 'none' }} />
      {title}
    </h2>
  );
}

function CategoryTile({ name, onClick }: { name: string; onClick: () => void }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'var(--color-ink)' : 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: hover ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        padding: '22px 12px',
        textAlign: 'center',
        cursor: 'pointer',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
      }}
    >
      <Icon name={iconForCategory(name)} size={24} color={hover ? '#fff' : 'var(--color-accent)'} />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, letterSpacing: '0.01em', color: hover ? '#fff' : 'var(--text-heading)', marginTop: 10 }}>{name}</div>
    </div>
  );
}

function EmptyEvents() {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>
      No live events yet — check back soon.
    </div>
  );
}
