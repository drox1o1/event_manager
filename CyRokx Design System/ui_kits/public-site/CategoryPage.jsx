const { Icon, EventCard, FilterControl, Checkbox, Select, EmptyState } = window.CyRokxDesignSystem_ef2ebf;

const CATEGORY_META = {
  Music: { icon: 'music', description: 'Live gigs, concerts and jam nights near you.' },
  Comedy: { icon: 'mic-2', description: 'Stand-up, improv and open mic nights.' },
  Workshops: { icon: 'pencil', description: 'Hands-on sessions taught by working practitioners.' },
  Sports: { icon: 'trophy', description: 'Matches, runs and fan meet-ups.' },
};

const RESULTS = [
  { title: 'Jazz Night at The Terrace', date: 'Sat, 12 Jul', city: 'Mumbai', priceFrom: '₹799', category: 'Music' },
  { title: 'Indie Rock Live', date: 'Thu, 17 Jul', city: 'Pune', priceFrom: '₹599', category: 'Music' },
  { title: 'Classical Evening', date: 'Fri, 25 Jul', city: 'Chennai', priceFrom: '₹899', category: 'Music' },
  { title: 'Acoustic Sundays', date: 'Sun, 20 Jul', city: 'Bengaluru', priceFrom: '₹449', category: 'Music' },
  { title: 'Rooftop DJ Set', date: 'Sat, 26 Jul', city: 'Delhi', priceFrom: '₹999', category: 'Music', soldOut: true },
  { title: 'Open Mic Nights', date: 'Wed, 16 Jul', city: 'Mumbai', priceFrom: 'Free', category: 'Music' },
];

/** CategoryPage — category header (icon, name, description, count), filtered grid with city/date/price sidebar. */
function CategoryPage({ category = 'Music', onOpenEvent, onBackHome }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Music;
  const [showEmpty, setShowEmpty] = React.useState(false);
  const results = showEmpty ? [] : RESULTS;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '32px' }}>
      <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 20 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onBackHome && onBackHome(); }} style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}>Home</a>
        {' / '}<span style={{ color: 'var(--text-muted)' }}>{category}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-card)', background: 'var(--color-accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name={meta.icon} size={26} color="var(--color-accent)" />
        </div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 4px' }}>{category}</h1>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{meta.description}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32 }}>
        <aside>
          <FilterControl title="City" icon="map-pin">
            <Checkbox label="Mumbai" checked />
            <Checkbox label="Delhi" />
            <Checkbox label="Bengaluru" />
            <Checkbox label="Pune" />
          </FilterControl>
          <FilterControl title="Date" icon="calendar" defaultOpen={false}>
            <Checkbox label="Today" />
            <Checkbox label="This weekend" />
            <Checkbox label="Next 30 days" />
          </FilterControl>
          <FilterControl title="Price" icon="tag" defaultOpen={false}>
            <Checkbox label="Free" />
            <Checkbox label="Under ₹500" />
            <Checkbox label="₹500–1,500" />
          </FilterControl>
          <button onClick={() => setShowEmpty(!showEmpty)} style={{ marginTop: 16, fontSize: 12, color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            {showEmpty ? 'Show results' : 'Preview empty state'}
          </button>
        </aside>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{results.length} events found</div>
            <div style={{ width: 200 }}>
              <Select placeholder="Sort: Recommended" options={['Date: soonest', 'Price: low to high', 'Price: high to low']} />
            </div>
          </div>
          {results.length === 0 ? (
            <EmptyState icon="calendar-x" title={`No upcoming ${category.toLowerCase()} events`} description="Check back soon, or explore another category." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {results.map((e) => (
                <EventCard key={e.title} {...e} onClick={() => onOpenEvent && onOpenEvent(e)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
window.CategoryPage = CategoryPage;
