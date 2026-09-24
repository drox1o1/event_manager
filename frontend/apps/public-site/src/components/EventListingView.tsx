'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, EventCard, FilterControl, Checkbox, EmptyState, useIsMobile } from '@showtik/ui';
import { formatEventDate, formatINR } from '@showtik/api-client';
import type { CategorySummary, EventSummary } from '@showtik/api-client';

export interface EventListingViewProps {
  events: EventSummary[];
  categories: CategorySummary[];
  /** Comma-separated list of active categories/cities from the URL (?category=Sports,Music). */
  activeCategory?: string;
  activeCity?: string;
  keyword?: string;
  page: number;
}

function parseList(v?: string): string[] {
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

/** EventListing — filter sidebar (true multi-select category + city), result
 *  grid, pagination. All filtering happens client-side against the fetched
 *  page of events, so checking several categories/cities at once actually
 *  combines results instead of replacing the previous selection. */
export function EventListingView({ events, categories, activeCategory, activeCity, keyword, page }: EventListingViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const selectedCategories = React.useMemo(() => new Set(parseList(activeCategory)), [activeCategory]);
  const selectedCities = React.useMemo(() => new Set(parseList(activeCity)), [activeCity]);

  const cities = React.useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.city));
    selectedCities.forEach((c) => set.add(c));
    return Array.from(set).sort();
  }, [events, selectedCities]);

  const filtered = React.useMemo(() => {
    return events.filter((e) => {
      if (keyword && !e.title.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (selectedCategories.size > 0 && !(e.category && selectedCategories.has(e.category))) return false;
      if (selectedCities.size > 0 && !selectedCities.has(e.city)) return false;
      return true;
    });
  }, [events, keyword, selectedCategories, selectedCities]);

  const pushFilters = (nextCategories: Set<string>, nextCities: Set<string>) => {
    const params = new URLSearchParams();
    if (nextCategories.size > 0) params.set('category', Array.from(nextCategories).join(','));
    if (nextCities.size > 0) params.set('city', Array.from(nextCities).join(','));
    if (keyword) params.set('q', keyword);
    router.push(`/events${params.toString() ? `?${params}` : ''}`);
  };

  const toggleCategory = (name: string) => {
    const next = new Set(selectedCategories);
    next.has(name) ? next.delete(name) : next.add(name);
    pushFilters(next, selectedCities);
  };

  const toggleCity = (name: string) => {
    const next = new Set(selectedCities);
    next.has(name) ? next.delete(name) : next.add(name);
    pushFilters(selectedCategories, next);
  };

  const clearFilters = () => router.push('/events');

  const heading = selectedCities.size === 1 ? `Events in ${Array.from(selectedCities)[0]}` : 'All events';
  const hasActiveFilters = selectedCategories.size > 0 || selectedCities.size > 0 || !!keyword;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--text-heading)', margin: '0 0 6px' }}>
          <span aria-hidden style={{ width: 5, height: 28, background: 'var(--gradient-brand)', borderRadius: 3, flex: 'none' }} />
          {heading}
        </h1>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 17 }}>{filtered.length} events found</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', gap: isMobile ? 20 : 32 }}>
        <aside>
          <FilterControl title="Category" icon="filter">
            {categories.map((c) => (
              <Checkbox
                key={c.id}
                label={c.name}
                checked={selectedCategories.has(c.name)}
                onChange={() => toggleCategory(c.name)}
              />
            ))}
          </FilterControl>
          {cities.length > 0 && (
            <FilterControl title="City" icon="map-pin">
              {cities.map((c) => (
                <Checkbox
                  key={c}
                  label={c}
                  checked={selectedCities.has(c)}
                  onChange={() => toggleCity(c)}
                />
              ))}
            </FilterControl>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
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
          {!hasActiveFilters && (page > 1 || events.length >= 24) && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
              <PageChip disabled={page <= 1} onClick={() => setPage(router, page - 1)}>
                <Icon name="chevron-left" size={16} />
              </PageChip>
              <span style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, background: 'var(--color-accent)', color: '#fff' }}>
                {page}
              </span>
              <PageChip disabled={events.length < 24} onClick={() => setPage(router, page + 1)}>
                <Icon name="chevron-right" size={16} />
              </PageChip>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function setPage(router: ReturnType<typeof useRouter>, nextPage: number) {
  const params = new URLSearchParams();
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
