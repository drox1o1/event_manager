const { Icon, StatCard, Badge, Button } = window.CyRokxDesignSystem_ef2ebf;

const ACTIVITY = [
  { icon: 'ticket', text: 'New registration for Jazz Night at The Terrace', time: '12 min ago' },
  { icon: 'check-circle', text: 'Street Food Fest was approved by the admin team', time: '2 hours ago' },
  { icon: 'ticket', text: '3 tickets sold for Watercolour Workshop', time: '5 hours ago' },
  { icon: 'alert-circle', text: 'Indie Rock Live was rejected — venue capacity missing', time: 'Yesterday' },
  { icon: 'ticket', text: '12 tickets sold for Jazz Night at The Terrace', time: 'Yesterday' },
];

const EVENTS_SNAPSHOT = [
  { title: 'Jazz Night at The Terrace', status: 'live', date: 'Sat, 12 Jul', registrations: 214 },
  { title: 'Watercolour Workshop', status: 'live', date: 'Sat, 19 Jul', registrations: 38 },
  { title: 'Street Food Fest', status: 'approved', date: 'Fri, 25 Jul', registrations: 0 },
  { title: 'Indie Rock Live', status: 'rejected', date: 'Thu, 17 Jul', registrations: 0 },
];

/** Dashboard — organiser home: stat cards, recent activity, quick action to create an event. */
function OrganiserDashboard({ onCreateEvent, onOpenEvent }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Good afternoon, Aditi</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Here&apos;s how Terrace Live Events is doing.</div>
        </div>
        <Button onClick={onCreateEvent}><Icon name="plus" size={16} />Create event</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard label="Active events" value="4" delta="+1 this month" icon="calendar" />
        <StatCard label="Total registrations" value="1,204" delta="+12% vs last week" icon="users" />
        <StatCard label="Revenue" value="₹4.2L" delta="+8% vs last week" icon="indian-rupee" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>Your events</div>
            <a href="#" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-link)', textDecoration: 'none' }}>View all &rarr;</a>
          </div>
          <div>
            {EVENTS_SNAPSHOT.map((e) => (
              <div key={e.title} onClick={() => onOpenEvent && onOpenEvent(e)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-default)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{e.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{e.date} &middot; {e.registrations} registrations</div>
                </div>
                <Badge status={e.status} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>Recent activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-off-white)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name={a.icon} size={14} />
                </span>
                <div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-body)', lineHeight: 1.4 }}>{a.text}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
window.OrganiserDashboard = OrganiserDashboard;
