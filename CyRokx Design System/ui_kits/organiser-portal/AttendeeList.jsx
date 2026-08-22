const { Icon, Input, Button, EmptyState } = window.CyRokxDesignSystem_ef2ebf;

const ATTENDEES = [
  { name: 'Priya Sharma', email: 'priya.s@example.com', tier: 'VIP', purchased: '2 Jul, 4:12pm', checkedIn: true },
  { name: 'Rohan Mehta', email: 'rohan.m@example.com', tier: 'Standard', purchased: '2 Jul, 3:58pm', checkedIn: true },
  { name: 'Ananya Iyer', email: 'ananya.i@example.com', tier: 'Standard', purchased: '2 Jul, 2:30pm', checkedIn: false },
  { name: 'Karan Verma', email: 'karan.v@example.com', tier: 'Early Bird', purchased: '1 Jul, 6:14pm', checkedIn: true },
  { name: 'Neha Kapoor', email: 'neha.k@example.com', tier: 'Standard', purchased: '1 Jul, 5:02pm', checkedIn: false },
  { name: 'Vivaan Shah', email: 'vivaan.s@example.com', tier: 'VIP', purchased: '30 Jun, 11:45am', checkedIn: false },
];

/** AttendeeList — organiser's attendee table for one event: search, CSV export, manual check-in toggle. */
function AttendeeList({ onBack, embedded }) {
  const [query, setQuery] = React.useState('');
  const [attendees, setAttendees] = React.useState(ATTENDEES);

  const rows = attendees.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()) || a.email.toLowerCase().includes(query.toLowerCase()));
  const toggle = (email) => setAttendees((list) => list.map((a) => (a.email === email ? { ...a, checkedIn: !a.checkedIn } : a)));

  return (
    <div>
      {!embedded && (
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
          <Icon name="arrow-left" size={15} /> RunXtreme Half Marathon 2026
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)' }}>Attendees</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{attendees.length} registrations &middot; {attendees.filter((a) => a.checkedIn).length} checked in</div>
        </div>
        <Button variant="secondary"><Icon name="download" size={15} />Export CSV</Button>
      </div>

      <div style={{ width: 300, marginBottom: 20 }}>
        <Input icon="search" placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {rows.length === 0 ? (
          <EmptyState icon="user-x" title="No attendees match" description="Try a different search term." />
        ) : (
          <div style={{ overflowX: 'auto', fontFamily: 'var(--font-sans)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Attendee', 'Ticket tier', 'Purchased', 'Check-in'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.email}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{a.name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{a.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)', color: 'var(--text-body)' }}>{a.tier}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)', color: 'var(--text-body)' }}>{a.purchased}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)' }}>
                      <button
                        onClick={() => toggle(a.email)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-pill)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${a.checkedIn ? 'transparent' : 'var(--border-default)'}`,
                          background: a.checkedIn ? 'var(--status-success-bg)' : 'var(--surface-card)',
                          color: a.checkedIn ? 'var(--status-success-text)' : 'var(--text-muted)',
                        }}
                      >
                        <Icon name={a.checkedIn ? 'check-circle' : 'circle'} size={13} />
                        {a.checkedIn ? 'Checked in' : 'Not yet'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
window.AttendeeList = AttendeeList;
