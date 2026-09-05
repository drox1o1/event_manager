'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, EventCard, SearchBar } from '@cyrokx/ui';
import { formatEventDate, formatINR } from '@cyrokx/api-client';
import type { CategorySummary, EventSummary, HomepageContent, HomepageResolvedSection } from '@cyrokx/api-client';
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
          padding: '96px 32px 120px',
          background: 'linear-gradient(135deg, #241f1c, #3a2e28)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
          {hero.eyebrow}
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.2, margin: `0 0 ${hero.subheadline ? 16 : 32}px` }}>{hero.headline}</h1>
        {hero.subheadline && (
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)', maxWidth: 620, margin: '0 auto 32px', lineHeight: 1.5 }}>{hero.subheadline}</p>
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

      <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '48px 32px' }}>
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
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 20 }}>{section.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {categories.map((c: CategorySummary) => (
            <div
              key={c.id}
              onClick={() => onOpenCategory(c.name)}
              style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '20px 12px', textAlign: 'center', cursor: 'pointer' }}
            >
              <Icon name={iconForCategory(c.name)} size={22} color="var(--color-accent)" />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', marginTop: 8 }}>{c.name}</div>
            </div>
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
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>{section.title}</h2>
        <a
          href="/events"
          onClick={(e) => { e.preventDefault(); onSeeAll(); }}
          style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-link)', textDecoration: 'none' }}
        >
          See all &rarr;
        </a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
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

function EmptyEvents() {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>
      No live events yet — check back soon.
    </div>
  );
}
