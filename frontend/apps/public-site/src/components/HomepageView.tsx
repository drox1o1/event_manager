'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, EventCard, SearchBar, useIsMobile } from '@showtik/ui';
import { formatEventDate, formatINR } from '@showtik/api-client';
import type { CategorySummary, EventSummary, HomepageContent, HomepageResolvedSection } from '@showtik/api-client';
import { iconForCategory } from '@/lib/categoryIcons';
import { FeaturedHero } from '@/components/FeaturedHero';

export interface HomepageViewProps {
  content: HomepageContent;
}

/** Homepage — featured-event hero carousel (super-admin picked) or the CMS
 *  headline hero, a floating search, the CMS sections (category grid / event
 *  rows) and an organiser call-to-action. */
export function HomepageView({ content }: HomepageViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [city, setCity] = React.useState('');
  const [keyword, setKeyword] = React.useState('');

  const { hero, banner, sections } = content;
  const featured = content.featured ?? [];

  const goSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (keyword) params.set('q', keyword);
    router.push(`/events${params.toString() ? `?${params}` : ''}`);
  };

  const openEvent = (id: string) => router.push(`/events/${id}`);

  const search = hero.search_enabled && (
    <SearchBar
      keyword={keyword}
      onKeywordChange={(e) => setKeyword(e.target.value)}
      location={city}
      onLocationChange={(e) => setCity(e.target.value)}
      onSubmit={goSearch}
    />
  );

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {banner.enabled && banner.text && (
        <a
          href={banner.link_url || undefined}
          onClick={(e) => {
            if (banner.link_url && banner.link_url.startsWith('/')) { e.preventDefault(); router.push(banner.link_url); }
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--gradient-brand)', color: '#fff', padding: '10px 20px', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
        >
          <Icon name="megaphone" size={15} />{banner.text}
          {banner.link_url && <Icon name="arrow-right" size={14} />}
        </a>
      )}

      {featured.length > 0 ? (
        <>
          <FeaturedHero events={featured} />
          {search && (
            <div style={{ position: 'relative', zIndex: 5, maxWidth: 'var(--content-max-width)', margin: isMobile ? '16px auto 0' : '24px auto 0', padding: '0 clamp(16px, 4vw, 32px)', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: 860, background: 'var(--surface-card)', borderRadius: 20, boxShadow: '0 20px 50px rgba(5,23,71,0.18)', padding: isMobile ? 10 : 14 }}>
                {search}
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            position: 'relative',
            padding: 'clamp(72px, 12vw, 128px) clamp(20px, 5vw, 32px) clamp(92px, 14vw, 148px)',
            background: 'var(--gradient-hero)',
            color: '#fff',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          <span aria-hidden style={{ position: 'absolute', top: '-30%', right: '-12%', width: '46%', height: '190%', background: 'var(--gradient-brand)', opacity: 0.5, transform: 'rotate(18deg)', filter: 'blur(2px)', borderRadius: 40 }} />
          <span aria-hidden style={{ position: 'absolute', bottom: '-40%', left: '-14%', width: '38%', height: '170%', background: 'radial-gradient(circle, rgba(34,83,246,0.55), transparent 70%)', transform: 'rotate(-12deg)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: 18 }}>
              <span style={{ width: 22, height: 2, background: 'var(--color-accent)', borderRadius: 2 }} />
              {hero.eyebrow}
              <span style={{ width: 22, height: 2, background: 'var(--color-accent)', borderRadius: 2 }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(42px, 8vw, 86px)', fontWeight: 900, lineHeight: 0.94, letterSpacing: '-0.03em', textTransform: 'uppercase', margin: `0 auto ${hero.subheadline ? 20 : 36}px`, maxWidth: 980 }}>{hero.headline}</h1>
            {hero.subheadline && (
              <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.82)', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.5 }}>{hero.subheadline}</p>
            )}
            {search && <div style={{ display: 'flex', justifyContent: 'center' }}>{search}</div>}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: 'clamp(40px, 7vw, 64px) clamp(16px, 4vw, 32px) 24px' }}>
        {sections.length === 0 && featured.length === 0 && <EmptyEvents />}
        {sections.map((section, i) => (
          <SectionBlock
            key={`${section.type}-${i}`}
            section={section}
            onOpenEvent={openEvent}
            onOpenCategory={(name) => router.push(`/category/${encodeURIComponent(name)}`)}
            onSeeAll={(href) => router.push(href)}
          />
        ))}
      </div>

      <ValueBand />
      <OrganiserCta />
    </div>
  );
}

function SectionBlock({
  section, onOpenEvent, onOpenCategory, onSeeAll,
}: {
  section: HomepageResolvedSection;
  onOpenEvent: (id: string) => void;
  onOpenCategory: (name: string) => void;
  onSeeAll: (href: string) => void;
}) {
  if (section.type === 'category_grid') {
    const categories = section.categories ?? [];
    if (categories.length === 0) return null;
    return (
      <section style={{ marginBottom: 64 }}>
        <SectionHeading title={section.title} kicker="Explore" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
          {categories.map((c: CategorySummary, i) => (
            <CategoryTile key={c.id} name={c.name} icon={c.icon} index={i} onClick={() => onOpenCategory(c.name)} />
          ))}
        </div>
      </section>
    );
  }

  const events = section.events ?? [];
  if (events.length === 0) return null;
  const seeAllHref = section.category ? `/category/${encodeURIComponent(section.category)}` : '/events';
  return (
    <section style={{ marginBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
        <SectionHeading title={section.title} kicker={section.category ? 'Category' : section.type === 'trending_events' ? 'Trending' : 'Hand-picked'} noMargin />
        <a
          href={seeAllHref}
          onClick={(e) => { e.preventDefault(); onSeeAll(seeAllHref); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', textDecoration: 'none', whiteSpace: 'nowrap', padding: '9px 16px', borderRadius: 999, border: '1px solid var(--border-default)', background: 'var(--surface-card)' }}
        >
          See all <Icon name="arrow-right" size={15} />
        </a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 22 }}>
        {events.map((e: EventSummary) => (
          <EventCard
            key={e.id}
            image={e.banner_image_url ?? undefined}
            title={e.title}
            date={formatEventDate(e.event_date)}
            city={e.city}
            priceFrom={formatINR(e.price_from)}
            category={e.category ?? undefined}
            soldOut={e.sold_out}
            href={`/events/${e.id}`}
            onClick={() => onOpenEvent(e.id)}
          />
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ title, kicker, noMargin }: { title: string; kicker?: string; noMargin?: boolean }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 22 }}>
      {kicker && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 8 }}>{kicker}</div>}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.4vw, 36px)', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--text-heading)', margin: 0, lineHeight: 1 }}>
        {title}
      </h2>
    </div>
  );
}

const TILE_TINTS = ['#C4143F', '#2253F6', '#0E8A6A', '#B45309', '#7C3AED', '#0369A1', '#BE185D', '#4D7C0F'];

function CategoryTile({ name, icon, index, onClick }: { name: string; icon?: string | null; index: number; onClick: () => void }) {
  const [hover, setHover] = React.useState(false);
  const tint = TILE_TINTS[index % TILE_TINTS.length];
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', overflow: 'hidden', textAlign: 'left',
        background: hover ? tint : 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 18, padding: '20px 18px 18px', cursor: 'pointer', minHeight: 118,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? `0 14px 30px ${tint}40` : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
      }}
    >
      <span style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hover ? 'rgba(255,255,255,0.18)' : `${tint}14`, color: hover ? '#fff' : tint, transition: 'all .2s ease' }}>
        <Icon name={icon || iconForCategory(name)} size={21} />
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: hover ? '#fff' : 'var(--text-heading)', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        {name}<Icon name="arrow-up-right" size={16} />
      </span>
    </button>
  );
}

function ValueBand() {
  const items = [
    { icon: 'zap', title: 'Book in seconds', body: 'No account needed — pick tickets, add participants, done.' },
    { icon: 'ticket', title: 'A ticket for everyone', body: 'Every participant gets their own ticket ID and QR code.' },
    { icon: 'shield-check', title: 'Verified organisers', body: 'Every organiser and event is reviewed by the Showtik team.' },
    { icon: 'life-buoy', title: 'Help with every order', body: 'Raise a query about any transaction straight from your order page.' },
  ];
  return (
    <section style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '8px clamp(16px, 4vw, 32px) 56px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 1, background: 'var(--border-default)', border: '1px solid var(--border-default)', borderRadius: 20, overflow: 'hidden' }}>
        {items.map((it) => (
          <div key={it.title} style={{ background: 'var(--surface-card)', padding: '26px 24px' }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent-tint)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Icon name={it.icon} size={19} /></span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text-heading)', marginBottom: 6 }}>{it.title}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{it.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrganiserCta() {
  const organiserUrl = `${process.env.NEXT_PUBLIC_ORGANISER_URL ?? 'https://host.showtik.in'}/signup`;
  return (
    <section style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px) 72px' }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, background: 'var(--gradient-hero)', color: '#fff', padding: 'clamp(32px, 6vw, 64px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap' }}>
        <span aria-hidden style={{ position: 'absolute', top: '-60%', right: '-10%', width: '45%', height: '220%', background: 'var(--gradient-brand)', opacity: 0.55, transform: 'rotate(20deg)', borderRadius: 40 }} />
        <div style={{ position: 'relative', maxWidth: 620 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>For organisers</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4.4vw, 52px)', fontWeight: 900, lineHeight: 0.98, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: '0 0 14px' }}>Host your next event on Showtik</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.5 }}>Marathons, concerts, workshops — sell multiple ticket types, collect participant details and get paid, all in one place.</p>
        </div>
        <a href={organiserUrl} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, height: 54, padding: '0 28px', borderRadius: 14, background: '#fff', color: 'var(--color-ink)', fontWeight: 800, fontSize: 16, textDecoration: 'none' }}>
          Create an event <Icon name="arrow-right" size={17} />
        </a>
      </div>
    </section>
  );
}

function EmptyEvents() {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>
      No live events yet — check back soon.
    </div>
  );
}
