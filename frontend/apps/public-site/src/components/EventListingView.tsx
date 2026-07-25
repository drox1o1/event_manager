'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, EventCard, FilterControl, Checkbox, EmptyState } from '@cyrokx/ui';
import { formatEventDate, formatINR } from '@cyrokx/api-client';
import type { CategorySummary, EventSummary } from '@cyrokx/api-client';

export interface EventListingViewProps {
  events: EventSummary[];
  categories: CategorySummary[];
  activeCategory?: string;
  activeCity?: string;
  keyword?: string;
  page: number;
}

/** EventListing — filter sidebar, result grid, pagination. Filters navigate (server refetch). */
export function EventListingView({ events, categories, activeCategory, activeCity, keyword, page }: EventListingViewProps) {
  const router = useRouter();

  const cities = React.useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.city));
    if (activeCity) set.add(activeCity);
    return Array.from(set).sort();
  }, [events, activeCity]);

  const filtered = keyword
    ? events.filter((e) => e.title.toLowerCase().includes(keyword.toLowerCase()))
    : events;

  const setFilter = (patch: { category?: string | null; city?: string | null }) => {
    const params = new URLSearchParams();
    const nextCategory = patch.category === undefined ? activeCategory : patch.category;
    const nextCity = patch.city === undefined ? activeCity : patch.city;
    if (nextCategory) params.set('category', nextCategory);
    if (nextCity) params.set('city', nextCity);
    if (keyword) params.set('q', keyword);
    router.push(`/events${params.toString() ? `?${params}` : ''}`);
  };

  const heading = activeCity ? `Events in ${activeCity}` : 'All events';

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 6px' }}>{heading}</h1>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{filtered.length} events found</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32 }}>
        <aside>
          <FilterControl title="Category" icon="filter">
            {categories.map((c) => (
              <Checkbox
                key={c.id}
                label={c.name}
                checked={activeCategory === c.name}
                onChange={() => setFilter({ category: activeCategory === c.name ? null : c.name })}
              />
            ))}
          </FilterControl>
          {cities.length > 0 && (
            <FilterControl title="City" icon="map-pin">
              {cities.map((c) => (
                <Checkbox
                  key={c}
                  label={c}
                  checked={activeCity === c}
                  onChange={() => setFilter({ city: activeCity === c ? null : c })}
                />
              ))}
            </FilterControl>
          )}
          {(activeCategory || activeCity || keyword) && (
            <button
              onClick={() => router.push('/events')}
              style={{ marginTop: 16, fontSize: 12, color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear filters
            </button>
          )}
        </aside>
        <div>
          {filtered.length === 0 ? (
            <EmptyState icon="search" title="No events match your filters" description="Try widening your date range or clearing a filter." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {filtered.map((e) => (
                <EventCard
                  key={e.id}
                  title={e.title}
                  date={formatEventDate(e.event_date)}
                  city={e.city}
                  priceFrom={formatINR(e.price_from)}
                  category={e.category ?? undefined}
                  soldOut={e.sold_out}
                  onClick={() => router.push(`/events/${e.id}`)}
                />
              ))}
            </div>
          )}
          {(page > 1 || filtered.length >= 24) && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
              <PageChip disabled={page <= 1} onClick={() => setPage(router, activeCategory, activeCity, keyword, page - 1)}>
                <Icon name="chevron-left" size={16} />
              </PageChip>
              <span style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, background: 'var(--color-accent)', color: '#fff' }}>
                {page}
              </span>
              <PageChip disabled={filtered.length < 24} onClick={() => setPage(router, activeCategory, activeCity, keyword, page + 1)}>
                <Icon name="chevron-right" size={16} />
              </PageChip>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function setPage(
  router: ReturnType<typeof useRouter>,
  category: string | undefined,
  city: string | undefined,
  keyword: string | undefined,
  nextPage: number
) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (city) params.set('city', city);
  if (keyword) params.set('q', keyword);
  if (nextPage > 1) params.set('page', String(nextPage));
  router.push(`/events${params.toString() ? `?${params}` : ''}`);
}

function PageChip({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        color: disabled ? 'var(--text-subtle)' : 'var(--text-body)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
