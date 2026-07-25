'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, EventCard, EmptyState } from '@cyrokx/ui';
import { formatEventDate, formatINR } from '@cyrokx/api-client';
import type { EventSummary } from '@cyrokx/api-client';
import { iconForCategory } from '@/lib/categoryIcons';

export interface CategoryPageViewProps {
  category: string;
  events: EventSummary[];
}

/** CategoryPage — category header (icon, name, count) + filtered event grid. */
export function CategoryPageView({ category, events }: CategoryPageViewProps) {
  const router = useRouter();

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '32px' }}>
      <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 20 }}>
        <a href="/" onClick={(e) => { e.preventDefault(); router.push('/'); }} style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}>Home</a>
        {' / '}<span style={{ color: 'var(--text-muted)' }}>{category}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-card)', background: 'var(--color-accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={iconForCategory(category)} size={26} color="var(--color-accent)" />
        </div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 4px' }}>{category}</h1>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{events.length} event{events.length === 1 ? '' : 's'} found</div>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState icon="calendar-x" title={`No upcoming ${category.toLowerCase()} events`} description="Check back soon, or explore another category." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {events.map((e) => (
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
  );
}
