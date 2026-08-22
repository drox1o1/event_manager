const { Icon, Input, Select, Badge, Button, DataTable, EmptyState } = window.CyRokxDesignSystem_ef2ebf;

const TRANSACTIONS = [
  { id: '#48213', event: 'Jazz Night at The Terrace', organiser: 'Terrace Live Events', buyer: 'Priya Sharma', amount: '₹1,499', status: 'success', date: '2 Jul' },
  { id: '#48212', event: 'Watercolour Workshop', organiser: 'Terrace Live Events', buyer: 'Rohan Mehta', amount: '₹1,200', status: 'success', date: '2 Jul' },
  { id: '#48211', event: 'Indie Rock Live', organiser: 'Terrace Live Events', buyer: 'Ananya Iyer', amount: '₹599', status: 'refunded', date: '1 Jul' },
  { id: '#48210', event: 'Street Food Fest', organiser: 'Foodie Collective', buyer: 'Karan Verma', amount: '₹299', status: 'failed', date: '1 Jul' },
  { id: '#48209', event: 'Marathon Expo', organiser: 'RunClub India', buyer: 'Neha Kapoor', amount: '₹0', status: 'success', date: '30 Jun' },
  { id: '#48208', event: 'Classical Evening', organiser: 'Raga Society', buyer: 'Vivaan Shah', amount: '₹899', status: 'success', date: '30 Jun' },
];

const TRANSACTION_STATUS_LOOK = { success: { bg: 'var(--status-success-bg)', fg: 'var(--status-success-text)', label: 'Success' }, refunded: { bg: 'var(--status-muted-bg)', fg: 'var(--status-muted-text)', label: 'Refunded' }, failed: { bg: 'var(--status-error-bg)', fg: 'var(--status-error-text)', label: 'Failed' } };

function TransactionStatusPill({ status }) {
  const l = TRANSACTION_STATUS_LOOK[status];
  return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: l.bg, color: l.fg, fontSize: 12, fontWeight: 600 }}>{l.label}</span>;
}

/** AllTransactions — payment records across the platform: filter by event/organiser, export. */
function AllTransactions() {
  const [eventFilter, setEventFilter] = React.useState('');
  const [organiserFilter, setOrganiserFilter] = React.useState('');

  const events = [...new Set(TRANSACTIONS.map((t) => t.event))];
  const organisers = [...new Set(TRANSACTIONS.map((t) => t.organiser))];

  const rows = TRANSACTIONS.filter((t) => (!eventFilter || t.event === eventFilter) && (!organiserFilter || t.organiser === organiserFilter));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>All transactions</div>
        <Button variant="secondary"><Icon name="download" size={15} />Export</Button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 240 }}>
          <Select placeholder="All events" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} options={events} />
        </div>
        <div style={{ width: 240 }}>
          <Select placeholder="All organisers" value={organiserFilter} onChange={(e) => setOrganiserFilter(e.target.value)} options={organisers} />
        </div>
        {(eventFilter || organiserFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setEventFilter(''); setOrganiserFilter(''); }}>Clear filters</Button>
        )}
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {rows.length === 0 ? (
          <EmptyState icon="receipt" title="No transactions match" description="Try clearing your filters." />
        ) : (
          <DataTable
            columns={[
              { key: 'id', label: 'Transaction' },
              { key: 'event', label: 'Event', render: (r) => (
                <div><div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{r.event}</div><div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.organiser}</div></div>
              ) },
              { key: 'buyer', label: 'Buyer' },
              { key: 'amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.amount}</span> },
              { key: 'status', label: 'Status', render: (r) => <TransactionStatusPill status={r.status} /> },
              { key: 'date', label: 'Date' },
            ]}
            rows={rows}
          />
        )}
      </div>
    </div>
  );
}
window.AllTransactions = AllTransactions;
