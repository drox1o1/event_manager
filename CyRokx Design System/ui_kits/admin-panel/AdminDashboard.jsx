const { Icon, StatCard, Badge } = window.CyRokxDesignSystem_ef2ebf;

const ACTIVITY = [
  { icon: 'clock', text: '3 new events entered the moderation queue', time: '8 min ago' },
  { icon: 'check-circle', text: 'Street Food Fest approved by Meera (admin)', time: '1 hour ago' },
  { icon: 'user-plus', text: 'New organiser verified — Terrace Live Events', time: '3 hours ago' },
  { icon: 'alert-circle', text: 'Indie Rock Live rejected — missing venue capacity', time: 'Yesterday' },
  { icon: 'credit-card', text: 'Refund issued for order #48213', time: 'Yesterday' },
];

/** Dashboard (admin) — platform-wide metrics and an activity feed. */
function AdminDashboard({ onOpenQueue }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Platform overview</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Across all organisers and cities.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total events" value="1,842" delta="+34 this week" icon="calendar" />
        <StatCard label="Active events" value="286" delta="+12 this week" icon="zap" />
        <StatCard label="Tickets sold" value="48.6K" delta="+9% vs last week" icon="ticket" />
        <StatCard label="Revenue" value="₹2.1Cr" delta="+11% vs last week" icon="indian-rupee" />
        <StatCard label="New organisers" value="24" delta="+6 this week" icon="user-plus" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>Awaiting moderation</div>
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenQueue && onOpenQueue(); }} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-link)', textDecoration: 'none' }}>Open queue &rarr;</a>
          </div>
          {[
            { title: 'Improv Comedy Jam', organiser: 'Laugh Lounge', status: 'review' },
            { title: 'Marathon Expo', organiser: 'RunClub India', status: 'review' },
            { title: 'Classical Evening', organiser: 'Raga Society', status: 'review' },
          ].map((e, i, arr) => (
            <div key={e.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{e.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{e.organiser}</div>
              </div>
              <Badge status={e.status} />
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>Activity feed</div>
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
window.AdminDashboard = AdminDashboard;
