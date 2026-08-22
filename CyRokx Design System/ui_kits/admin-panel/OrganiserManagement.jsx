const { Icon, Input, Avatar, Badge, Button, DataTable, Modal, EmptyState } = window.CyRokxDesignSystem_ef2ebf;

const ORGANISERS = [
  { name: 'Terrace Live Events', contact: 'Aditi Rao', email: 'aditi@terracelive.in', status: 'verified', events: 4,
    history: ['Signed up 12 Mar 2026', 'Verified 14 Mar 2026', '4 events submitted, 3 approved, 1 rejected'] },
  { name: 'Laugh Lounge', contact: 'Kabir Singh', email: 'kabir@laughlounge.in', status: 'pending', events: 1,
    history: ['Signed up 28 Jun 2026', 'Awaiting verification'] },
  { name: 'RunClub India', contact: 'Meher Chawla', email: 'meher@runclub.in', status: 'verified', events: 6,
    history: ['Signed up 2 Jan 2026', 'Verified 4 Jan 2026', '6 events submitted, all approved'] },
  { name: 'Raga Society', contact: 'Srinivasan K.', email: 'srini@ragasociety.org', status: 'verified', events: 2,
    history: ['Signed up 19 Feb 2026', 'Verified 21 Feb 2026', '2 events submitted, 1 pending review'] },
  { name: 'Foodie Collective', contact: 'Zara Khan', email: 'zara@foodiecollective.in', status: 'suspended', events: 3,
    history: ['Signed up 5 Nov 2025', 'Verified 8 Nov 2025', 'Suspended 30 Jun 2026 — repeated payout disputes'] },
];

const ORGANISER_STATUS_LOOK = { verified: { bg: 'var(--status-success-bg)', fg: 'var(--status-success-text)', label: 'Verified' }, pending: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning-text)', label: 'Pending' }, suspended: { bg: 'var(--status-error-bg)', fg: 'var(--status-error-text)', label: 'Suspended' } };

function OrganiserStatusPill({ status }) {
  const l = ORGANISER_STATUS_LOOK[status];
  return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: l.bg, color: l.fg, fontSize: 12, fontWeight: 600 }}>{l.label}</span>;
}

/** OrganiserManagement — table of organisers: verify, suspend, view history. */
function OrganiserManagement() {
  const [query, setQuery] = React.useState('');
  const [organisers, setOrganisers] = React.useState(ORGANISERS);
  const [historyFor, setHistoryFor] = React.useState(null);

  const setStatus = (name, status) => setOrganisers((list) => list.map((o) => (o.name === name ? { ...o, status } : o)));
  const rows = organisers.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()) || o.contact.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Organiser management</div>
        <div style={{ width: 260 }}>
          <Input icon="search" placeholder="Search organisers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {rows.length === 0 ? (
          <EmptyState icon="user-x" title="No organisers match" description="Try a different search term." />
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Organiser', render: (r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={r.contact} size={34} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.contact} &middot; {r.email}</div>
                  </div>
                </div>
              ) },
              { key: 'events', label: 'Events' },
              { key: 'status', label: 'Status', render: (r) => <OrganiserStatusPill status={r.status} /> },
              { key: 'actions', label: '', render: (r) => (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button variant="ghost" size="sm" onClick={() => setHistoryFor(r)}>History</Button>
                  {r.status === 'pending' && <Button size="sm" onClick={() => setStatus(r.name, 'verified')}>Verify</Button>}
                  {r.status === 'verified' && <Button variant="destructive" size="sm" onClick={() => setStatus(r.name, 'suspended')}>Suspend</Button>}
                  {r.status === 'suspended' && <Button variant="secondary" size="sm" onClick={() => setStatus(r.name, 'verified')}>Reinstate</Button>}
                </div>
              ) },
            ]}
            rows={rows}
          />
        )}
      </div>

      {historyFor && (
        <Modal title={historyFor.name} onClose={() => setHistoryFor(null)} width={440}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historyFor.history.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="dot" size={16} color="var(--text-subtle)" />
                <span style={{ fontSize: 14, color: 'var(--text-body)' }}>{h}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
window.OrganiserManagement = OrganiserManagement;
