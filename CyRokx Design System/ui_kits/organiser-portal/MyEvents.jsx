const { Icon, Input, Select, Badge, Button, DataTable, EmptyState } = window.CyRokxDesignSystem_ef2ebf;

const EVENTS = [
  { title: 'Jazz Night at The Terrace', date: 'Sat, 12 Jul', city: 'Mumbai', status: 'live', registrations: 214, revenue: '₹1.7L' },
  { title: 'Watercolour Workshop', date: 'Sat, 19 Jul', city: 'Bengaluru', status: 'live', registrations: 38, revenue: '₹45.6K' },
  { title: 'Street Food Fest', date: 'Fri, 25 Jul', city: 'Mumbai', status: 'approved', registrations: 0, revenue: '₹0' },
  { title: 'Indie Rock Live', date: 'Thu, 17 Jul', city: 'Pune', status: 'rejected', registrations: 0, revenue: '₹0' },
  { title: 'Improv Comedy Jam', date: 'Sat, 19 Jul', city: 'Delhi', status: 'review', registrations: 0, revenue: '₹0' },
  { title: 'Marathon Expo', date: 'Sun, 20 Jul', city: 'Mumbai', status: 'draft', registrations: 0, revenue: '₹0' },
];

const FILTERS = ['All', 'Live', 'In review', 'Approved', 'Draft', 'Rejected'];
const FILTER_MAP = { All: null, Live: 'live', 'In review': 'review', Approved: 'approved', Draft: 'draft', Rejected: 'rejected' };

/** MyEvents — organiser's event list with status filters, search, edit/view actions. */
function MyEvents({ onOpenEvent, onEditEvent, onCreateEvent }) {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');

  const rows = EVENTS.filter((e) => {
    const matchesFilter = !FILTER_MAP[filter] || e.status === FILTER_MAP[filter];
    const matchesQuery = e.title.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)' }}>My events</div>
        <Button onClick={onCreateEvent}><Icon name="plus" size={16} />Create event</Button>
      </div>

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
        <div style={{ width: 260 }}>
          <Input icon="search" placeholder="Search your events" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {rows.length === 0 ? (
          <EmptyState icon="calendar-x" title="No events match" description="Try a different filter or search term." />
        ) : (
          <DataTable
            columns={[
              { key: 'title', label: 'Event', render: (r) => (
                <div onClick={() => onOpenEvent && onOpenEvent(r)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg, #EFEAE4, #E4DED6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', flex: 'none' }}>
                    <Icon name="image" size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{r.date} &middot; {r.city}</div>
                  </div>
                </div>
              ) },
              { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} /> },
              { key: 'registrations', label: 'Registrations' },
              { key: 'revenue', label: 'Revenue' },
            ]}
            rows={rows}
            actions={{ onClick: (r) => onEditEvent && onEditEvent(r) }}
          />
        )}
      </div>
    </div>
  );
}
window.MyEvents = MyEvents;
