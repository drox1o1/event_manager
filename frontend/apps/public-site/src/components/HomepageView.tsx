'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, EventCard, SearchBar } from '@cyrokx/ui';
import { formatEventDate, formatINR } from '@cyrokx/api-client';
import type { CategorySummary, EventSummary } from '@cyrokx/api-client';
import { iconForCategory } from '@/lib/categoryIcons';

export interface HomepageViewProps {
  featured: EventSummary[];
  trending: EventSummary[];
  categories: CategorySummary[];
}

/** Homepage — hero search, category grid, featured + trending event rows. */
export function HomepageView({ featured, trending, categories }: HomepageViewProps) {
  const router = useRouter();
  const [city, setCity] = React.useState('');
  const [keyword, setKeyword] = React.useState('');

  const goSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (keyword) params.set('q', keyword);
    router.push(`/events${params.toString() ? `?${params}` : ''}`);
  };

  const openEvent = (id: string) => router.push(`/events/${id}`);

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
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
          Discover live events near you
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.2, margin: '0 0 32px' }}>Find your next night out</h1>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SearchBar
            keyword={keyword}
            onKeywordChange={(e) => setKeyword(e.target.value)}
            location={city}
            onLocationChange={(e) => setCity(e.target.value)}
            onSubmit={goSearch}
          />
        </div>
      </div>

      <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '48px 32px' }}>
        {categories.length > 0 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 20 }}>Browse by category</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 56 }}>
              {categories.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/category/${encodeURIComponent(c.name)}`)}
                  style={{
                    background: 'var(--surface-card)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '20px 12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Icon name={iconForCategory(c.name)} size={22} color="var(--color-accent)" />
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', marginTop: 8 }}>{c.name}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>Featured events</h2>
          <a
            href="/events"
            onClick={(e) => { e.preventDefault(); router.push('/events'); }}
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-link)', textDecoration: 'none' }}
          >
            See all &rarr;
          </a>
        </div>
        {featured.length === 0 ? (
          <EmptyEvents />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 56 }}>
            {featured.map((e) => (
              <EventCard
                key={e.id}
                title={e.title}
                date={formatEventDate(e.event_date)}
                city={e.city}
                priceFrom={formatINR(e.price_from)}
                category={e.category ?? undefined}
                soldOut={e.sold_out}
                onClick={() => openEvent(e.id)}
              />
            ))}
          </div>
        )}

        {trending.length > 0 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 20 }}>Trending this week</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {trending.map((e) => (
                <EventCard
                  key={e.id}
                  title={e.title}
                  date={formatEventDate(e.event_date)}
                  city={e.city}
                  priceFrom={formatINR(e.price_from)}
                  category={e.category ?? undefined}
                  soldOut={e.sold_out}
                  onClick={() => openEvent(e.id)}
                />
              ))}
            </div>
          </>
        )}
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
