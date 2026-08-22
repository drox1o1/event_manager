const { Icon, Tag, EventCard, SearchBar } = window.CyRokxDesignSystem_ef2ebf;

const CATEGORIES = [
  { name: 'Music', icon: 'music' },
  { name: 'Comedy', icon: 'mic-2' },
  { name: 'Workshops', icon: 'pencil' },
  { name: 'Sports', icon: 'trophy' },
  { name: 'Food & Drink', icon: 'utensils' },
  { name: 'Theatre', icon: 'drama' },
];

const FEATURED = [
  { title: 'Jazz Night at The Terrace', date: 'Sat, 12 Jul', city: 'Mumbai', priceFrom: '₹799', category: 'Music' },
  { title: 'Stand-up Sunday', date: 'Sun, 13 Jul', city: 'Delhi', priceFrom: '₹499', category: 'Comedy' },
  { title: 'Watercolour Workshop', date: 'Sat, 19 Jul', city: 'Bengaluru', priceFrom: '₹1,200', category: 'Workshops' },
  { title: 'Street Food Fest', date: 'Fri, 25 Jul', city: 'Mumbai', priceFrom: '₹299', category: 'Food & Drink', soldOut: true },
];

const TRENDING = [
  { title: 'Indie Rock Live', date: 'Thu, 17 Jul', city: 'Pune', priceFrom: '₹599', category: 'Music' },
  { title: 'Improv Comedy Jam', date: 'Sat, 19 Jul', city: 'Delhi', priceFrom: '₹399', category: 'Comedy' },
  { title: 'Marathon Expo', date: 'Sun, 20 Jul', city: 'Mumbai', priceFrom: 'Free', category: 'Sports' },
  { title: 'Classical Evening', date: 'Fri, 25 Jul', city: 'Chennai', priceFrom: '₹899', category: 'Music' },
];

/** Homepage — hero search, category grid, featured + trending event rows. */
function Homepage({ onOpenEvent, onSearch }) {
  const [city, setCity] = React.useState('Mumbai');
  const [keyword, setKeyword] = React.useState('');

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
          <SearchBar keyword={keyword} onKeywordChange={(e) => setKeyword(e.target.value)} location={city} onLocationChange={(e) => setCity(e.target.value)} onSubmit={onSearch} />
        </div>
      </div>

      <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '48px 32px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 20 }}>Browse by category</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 56 }}>
          {CATEGORIES.map((c) => (
            <div
              key={c.name}
              style={{
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
                padding: '20px 12px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon name={c.icon} size={22} color="var(--color-accent)" />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', marginTop: 8 }}>{c.name}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>Featured events in {city}</h2>
          <a href="#" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-link)', textDecoration: 'none' }}>See all &rarr;</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 56 }}>
          {FEATURED.map((e) => (
            <EventCard key={e.title} {...e} onClick={() => onOpenEvent && onOpenEvent(e)} />
          ))}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 20 }}>Trending this week</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {TRENDING.map((e) => (
            <EventCard key={e.title} {...e} onClick={() => onOpenEvent && onOpenEvent(e)} />
          ))}
        </div>
      </div>
    </div>
  );
}
window.Homepage = Homepage;
