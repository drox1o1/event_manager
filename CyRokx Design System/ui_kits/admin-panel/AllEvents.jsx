const { Icon, Input, Badge, Button, DataTable, EmptyState } = window.CyRokxDesignSystem_ef2ebf;

const ALL_EVENTS = [
  { title: 'Jazz Night at The Terrace', organiser: 'Terrace Live Events', city: 'Mumbai', status: 'live', registrations: 214 },
  { title: 'Watercolour Workshop', organiser: 'Terrace Live Events', city: 'Bengaluru', status: 'live', registrations: 38 },
  { title: 'Street Food Fest', organiser: 'Terrace Live Events', city: 'Mumbai', status: 'approved', registrations: 0 },
  { title: 'Improv Comedy Jam', organiser: 'Laugh Lounge', city: 'Delhi', status: 'review', registrations: 0 },
  { title: 'Marathon Expo', organiser: 'RunClub India', city: 'Mumbai', status: 'review', registrations: 0 },
  { title: 'Classical Evening', organiser: 'Raga Society', city: 'Chennai', status: 'review', registrations: 0 },
  { title: 'Indie Rock Live', organiser: 'Terrace Live Events', city: 'Pune', status: 'rejected', registrations: 0 },
  { title: 'Summer Sold Out Fest', organiser: 'Foodie Collective', city: 'Mumbai', status: 'soldout', registrations: 1500 },
];

const FILTERS = ['All', 'Live', 'In review', 'Approved', 'Rejected', 'Sold out'];
const FILTER_MAP = { All: null, Live: 'live', 'In review': 'review', Approved: 'approved', Rejected: 'rejected', 'Sold out': 'soldout' };

/** AllEvents (admin) — full platform event list: status filters, search, deactivate action. */
function AllEvents() {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const [deactivated, setDeactivated] = React.useState({});

  const rows = ALL_EVENTS.filter((e) => {
    const matchesFilter = !FILTER_MAP[filter] || e.status === FILTER_MAP[filter];
    const matchesQuery = e.title.toLowerCase().includes(query.toLowerCase()) || e.organiser.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 24 }}>All events</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '7px 16px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${filter === f ? 'var(--color-accent)' : 'var(--border-default)'}`,
                background: filter === f ? 'var(--color-accent-tint)' : 'var(--surface-card)',
                color: filter === f ? 'var(--color-accent)' : 'var(--text-body)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ width: 280 }}>
          <Input icon="search" placeholder="Search events or organisers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {rows.length === 0 ? (
          <EmptyState icon="calendar-x" title="No events match" description="Try a different filter or search term." />
        ) : (
          <DataTable
            columns={[
              { key: 'title', label: 'Event', render: (r) => (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{r.city}</div>
                </div>
              ) },
              { key: 'organiser', label: 'Organiser' },
              { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} /> },
              { key: 'registrations', label: 'Registrations' },
              { key: 'action', label: '', render: (r) => (
                deactivated[r.title] ? (
                  <span style={{ fontSize: 13, color: 'var(--text-subtle)', fontWeight: 600 }}>Deactivated</span>
                ) : (
                  <Button variant="destructive" size="sm" onClick={() => setDeactivated((d) => ({ ...d, [r.title]: true }))}>Deactivate</Button>
                )
              ) },
            ]}
            rows={rows}
          />
        )}
      </div>
    </div>
  );
}
window.AllEvents = AllEvents;
