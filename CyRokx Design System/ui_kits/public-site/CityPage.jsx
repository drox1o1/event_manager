const { Icon, EventCard, Tag, Select, EmptyState } = window.CyRokxDesignSystem_ef2ebf;

const CATEGORIES = ['All', 'Music', 'Comedy', 'Workshops', 'Sports', 'Food & Drink'];

const RESULTS = [
  { title: 'Jazz Night at The Terrace', date: 'Sat, 12 Jul', city: 'Mumbai', priceFrom: '₹799', category: 'Music' },
  { title: 'Street Food Fest', date: 'Fri, 25 Jul', city: 'Mumbai', priceFrom: '₹299', category: 'Food & Drink', soldOut: true },
  { title: 'Marathon Expo', date: 'Sun, 20 Jul', city: 'Mumbai', priceFrom: 'Free', category: 'Sports' },
  { title: 'Open Mic Nights', date: 'Wed, 16 Jul', city: 'Mumbai', priceFrom: 'Free', category: 'Music' },
  { title: 'Watercolour Workshop', date: 'Sat, 19 Jul', city: 'Mumbai', priceFrom: '₹1,200', category: 'Workshops' },
  { title: 'Improv Comedy Jam', date: 'Sat, 19 Jul', city: 'Mumbai', priceFrom: '₹399', category: 'Comedy' },
];

/** CityPage — city header, quick category tags, filtered grid. */
function CityPage({ city = 'Mumbai', onOpenEvent, onBackHome }) {
  const [active, setActive] = React.useState('All');
  const results = active === 'All' ? RESULTS : RESULTS.filter((e) => e.category === active);

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      <div style={{ padding: '56px 32px', background: 'var(--color-ink)', color: '#fff' }}>
        <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); onBackHome && onBackHome(); }} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>Home</a>
            {' / '}<span style={{ color: 'rgba(255,255,255,0.8)' }}>{city}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Icon name="map-pin" size={22} color="var(--color-accent)" />
            <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0 }}>Events in {city}</h1>
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)' }}>{RESULTS.length} events happening across {city}</div>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <Tag key={c} active={active === c} onClick={() => setActive(c)}>{c}</Tag>
            ))}
          </div>
          <div style={{ width: 200 }}>
            <Select placeholder="Sort: Recommended" options={['Date: soonest', 'Price: low to high', 'Price: high to low']} />
          </div>
        </div>

        {results.length === 0 ? (
          <EmptyState icon="map-pin" title={`No ${active.toLowerCase()} events in ${city} right now`} description="Try another category or check back soon." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {results.map((e) => (
              <EventCard key={e.title} {...e} onClick={() => onOpenEvent && onOpenEvent(e)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
window.CityPage = CityPage;
