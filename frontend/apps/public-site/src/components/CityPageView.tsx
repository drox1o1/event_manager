'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, EventCard, Tag, EmptyState } from '@cyrokx/ui';
import { formatEventDate, formatINR } from '@cyrokx/api-client';
import type { EventSummary } from '@cyrokx/api-client';

export interface CityPageViewProps {
  city: string;
  events: EventSummary[];
}

/** CityPage — dark city header, category quick-filter tags, event grid. */
export function CityPageView({ city, events }: CityPageViewProps) {
  const router = useRouter();
  const [active, setActive] = React.useState('All');

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.category && set.add(e.category));
    return ['All', ...Array.from(set).sort()];
  }, [events]);

  const filtered = active === 'All' ? events : events.filter((e) => e.category === active);

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      <div style={{ padding: '56px 32px', background: 'var(--color-ink)', color: '#fff' }}>
        <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
            <a href="/" onClick={(e) => { e.preventDefault(); router.push('/'); }} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>Home</a>
            {' / '}<span style={{ color: 'rgba(255,255,255,0.8)' }}>{city}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Icon name="map-pin" size={22} color="var(--color-accent)" />
            <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0 }}>Events in {city}</h1>
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)' }}>{events.length} events happening across {city}</div>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {categories.map((c) => (
            <Tag key={c} active={active === c} onClick={() => setActive(c)}>{c}</Tag>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="map-pin" title={`No ${active.toLowerCase()} events in ${city} right now`} description="Try another category or check back soon." />
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
      </div>
    </div>
  );
}
