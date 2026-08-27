const { Icon, EventCard, FilterControl, Checkbox, Select, EmptyState } = window.CyRokxDesignSystem_ef2ebf;

const RESULTS = [
  { title: 'Jazz Night at The Terrace', date: 'Sat, 12 Jul', city: 'Mumbai', priceFrom: '₹799', category: 'Music' },
  { title: 'Stand-up Sunday', date: 'Sun, 13 Jul', city: 'Delhi', priceFrom: '₹499', category: 'Comedy' },
  { title: 'Watercolour Workshop', date: 'Sat, 19 Jul', city: 'Bengaluru', priceFrom: '₹1,200', category: 'Workshops' },
  { title: 'Indie Rock Live', date: 'Thu, 17 Jul', city: 'Pune', priceFrom: '₹599', category: 'Music' },
  { title: 'Improv Comedy Jam', date: 'Sat, 19 Jul', city: 'Delhi', priceFrom: '₹399', category: 'Comedy' },
  { title: 'Street Food Fest', date: 'Fri, 25 Jul', city: 'Mumbai', priceFrom: '₹299', category: 'Food & Drink', soldOut: true },
];

/** EventListing — filter sidebar, sort, result grid, pagination. Shows an empty state when filters exclude everything. */
function EventListing({ onOpenEvent }) {
  const [showEmpty, setShowEmpty] = React.useState(false);
  const results = showEmpty ? [] : RESULTS;
  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 6px' }}>Events in Mumbai</h1>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{results.length} events found</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32 }}>
        <aside>
          <FilterControl title="Category" icon="filter">
            <Checkbox label="Music" checked />
            <Checkbox label="Comedy" />
            <Checkbox label="Workshops" />
            <Checkbox label="Sports" />
          </FilterControl>
          <FilterControl title="City" icon="map-pin">
            <Checkbox label="Mumbai" checked />
            <Checkbox label="Delhi" />
            <Checkbox label="Bengaluru" />
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <div style={{ width: 200 }}>
              <Select placeholder="Sort: Recommended" options={['Date: soonest', 'Price: low to high', 'Price: high to low']} />
            </div>
          </div>
          {results.length === 0 ? (
            <EmptyState icon="search" title="No events match your filters" description="Try widening your date range or clearing a filter." />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {results.map((e) => (
                  <EventCard key={e.title} {...e} onClick={() => onOpenEvent && onOpenEvent(e)} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                {[1, 2, 3].map((p) => (
                  <span
                    key={p}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      background: p === 1 ? 'var(--color-accent)' : 'var(--surface-card)',
                      color: p === 1 ? '#fff' : 'var(--text-body)',
                      border: p === 1 ? 'none' : '1px solid var(--border-default)',
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </span>
                ))}
                <span style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
                  <Icon name="chevron-right" size={16} />
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
window.EventListing = EventListing;
