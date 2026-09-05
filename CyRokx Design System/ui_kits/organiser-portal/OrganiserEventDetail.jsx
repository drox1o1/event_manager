const { Icon, Badge, StatCard, Button } = window.CyRokxDesignSystem_ef2ebf;

const GROUPS = [
  { name: 'Overview', tabs: [{ key: 'dashboard', label: 'Dashboard' }] },
  { name: 'Registration', tabs: [
    { key: 'categories', label: 'Categories' },
    { key: 'regform', label: 'Registration form' },
    { key: 'discounts', label: 'Discounts' },
    { key: 'tax', label: 'Tax' },
  ] },
  { name: 'People', tabs: [
    { key: 'orders', label: 'Orders' },
  ] },
];
const OVERFLOW = [
  { key: 'attendees', label: 'Attendees', icon: 'users' },
  { key: 'edit', label: 'Edit event', icon: 'pencil' },
  { key: 'merch', label: 'Merchandize', icon: 'shopping-bag' },
  { key: 'leaderboards', label: 'Leaderboards', icon: 'trophy' },
  { key: 'certificates', label: 'Certificates', icon: 'award' },
  { key: 'bib', label: 'Attendee bib', icon: 'hash' },
  { key: 'email', label: 'Email templates', icon: 'mail' },
];
const OVERFLOW_LABEL = Object.fromEntries(OVERFLOW.map((o) => [o.key, o.label]));

const ORDERS_SERIES = [
  { d: '02', v: 12 }, { d: '03', v: 5 }, { d: '04', v: 3 }, { d: '05', v: 4 }, { d: '06', v: 7 }, { d: '07', v: 3 }, { d: '08', v: 8 },
  { d: '09', v: 10 }, { d: '10', v: 29 }, { d: '11', v: 3 }, { d: '12', v: 5 }, { d: '13', v: 12 }, { d: '14', v: 5 }, { d: '15', v: 2 },
];

/** OrganiserEventDetail — the event workspace: grouped tab navigation with an overflow menu
 *  fronting the 13 event-management surfaces, plus the dashboard (status/balance/orders/attendees
 *  + orders-by-date) and routing into Categories, Registration form, Discounts, Tax, Orders, Attendees. */
function OrganiserEventDetail({ event, onEdit, onViewAttendees, onBack }) {
  const [tab, setTab] = React.useState('dashboard');
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const title = event?.title || 'RunXtreme Half Marathon 2026';
  const unlisted = event?.unlisted;
  const shareUrl = 'cyrokx.in/e/runxtreme-half-marathon-2026?k=8fa2';
  const moreSelected = OVERFLOW.some((o) => o.key === tab);
  const moreActive = moreSelected && tab !== 'attendees';
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };

  return (
    <div onClick={() => moreOpen && setMoreOpen(false)}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        <Icon name="arrow-left" size={15} /> My events
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</div>
            <Badge status="live">Published</Badge>
            {unlisted && <Badge status="draft"><Icon name="eye-off" size={12} />Unlisted</Badge>}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="calendar" size={14} /> Sun, 26 Jul &middot; 5:00 AM
            <span style={{ margin: '0 2px' }}>&middot;</span>
            <Icon name="map-pin" size={14} /> Cubbon Park, Bengaluru
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Button variant="secondary" size="sm" onClick={copy}><Icon name="link" size={15} />{copied ? 'Link copied' : 'Copy registration link'}</Button>
          <Button size="sm" onClick={onEdit}><Icon name="pencil" size={15} />Edit event</Button>
        </div>
      </div>

      {/* Grouped tab bar with overflow */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 0, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', padding: '4px 6px', marginBottom: 28, boxShadow: 'var(--shadow-card)' }}>
        {GROUPS.map((g, gi) => (
          <React.Fragment key={g.name}>
            {gi > 0 && <div style={{ width: 1, background: 'var(--border-default)', margin: '8px 6px' }} />}
            <div style={{ display: 'flex', gap: 2 }}>
              {g.tabs.map((t) => <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabButton>)}
            </div>
          </React.Fragment>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <TabButton active={moreSelected} onClick={() => setMoreOpen((v) => !v)}>
            {moreSelected ? OVERFLOW_LABEL[tab] : 'More'} <Icon name="chevron-down" size={14} />
          </TabButton>
          {moreOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 220, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-modal, 0 12px 32px rgba(0,0,0,0.14))', padding: 6, zIndex: 20 }}>
              {OVERFLOW.map((o) => (
                <button key={o.key} onClick={() => { setTab(o.key); setMoreOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: tab === o.key ? 'var(--surface-accent-tint)' : 'none', border: 'none', borderRadius: 'var(--radius-control)', padding: '9px 10px', fontSize: 13.5, fontWeight: 600, color: tab === o.key ? 'var(--color-accent)' : 'var(--text-body)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  <Icon name={o.icon} size={15} />{o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panels */}
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'categories' && <window.EventCategories />}
      {tab === 'regform' && <window.EventRegistrationForm />}
      {tab === 'discounts' && <window.EventDiscounts />}
      {tab === 'tax' && <window.EventTax />}
      {tab === 'orders' && <window.EventOrders />}
      {tab === 'attendees' && <window.AttendeeList onBack={() => setTab('dashboard')} embedded />}
      {moreActive && tab !== 'attendees' && <ComingSoon label={OVERFLOW_LABEL[tab]} icon={(OVERFLOW.find((o) => o.key === tab) || {}).icon} onEdit={onEdit} tab={tab} />}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: active ? 'var(--color-accent)' : 'none', color: active ? '#fff' : 'var(--text-body)', border: 'none', borderRadius: 'var(--radius-control)', padding: '8px 14px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}

function Dashboard() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        <div style={{ background: 'linear-gradient(135deg, var(--color-accent-secondary), color-mix(in srgb, var(--color-accent-secondary) 78%, black))', borderRadius: 'var(--radius-card)', padding: 22, color: '#fff', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>Status</div>
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 6 }}>Published</div>
        </div>
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', padding: 22, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)' }}>Balance</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-heading)', marginTop: 6 }}>₹0.00</div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Payable</span><span style={{ fontWeight: 600 }}>₹63,000.00</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}><span>Paid</span><span style={{ fontWeight: 600, color: 'var(--color-success)' }}>₹63,000.00</span></div>
          </div>
        </div>
        <StatCard label="Orders" value="108" delta="+12 this week" icon="receipt" />
        <StatCard label="Attendees" value="126" delta="+14 this week" icon="users" />
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 18 }}>Orders by date</div>
        <OrdersChart />
      </div>
    </div>
  );
}

function OrdersChart() {
  const W = 1120, H = 300, pad = { l: 34, r: 12, t: 12, b: 28 };
  const data = ORDERS_SERIES;
  const max = 30;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const x = (i) => pad.l + (i / (data.length - 1)) * iw;
  const y = (v) => pad.t + ih - (v / max) * ih;
  const pts = data.map((p, i) => [x(i), y(p.v)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${pad.l},${y(0)} Z`;
  const ticks = [0, 5, 10, 15, 20, 25, 30];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="ordFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-accent-secondary)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--color-accent-secondary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border-default)" strokeWidth="1" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-subtle)" fontFamily="var(--font-sans)">{t}</text>
        </g>
      ))}
      <path d={area} fill="url(#ordFill)" />
      <path d={line} fill="none" stroke="var(--color-accent-secondary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={data[i].v === max ? 4.5 : 3} fill="#fff" stroke="var(--color-accent-secondary)" strokeWidth="2" />)}
      {data.map((p, i) => <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-subtle)" fontFamily="var(--font-sans)">{p.d}-Jul</text>)}
    </svg>
  );
}

function ComingSoon({ label, icon, onEdit, tab }) {
  if (tab === 'edit') {
    return (
      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 48, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-accent-tint)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Icon name="pencil" size={24} /></div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Edit event details</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>Reopens the create-event flow pre-filled with this event&apos;s details, schedule, categories and fees.</div>
        <Button onClick={onEdit}><Icon name="pencil" size={15} />Open editor</Button>
      </div>
    );
  }
  return (
    <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 48, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-off-white)', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Icon name={icon || 'sparkles'} size={24} /></div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>This surface is on the roadmap and not yet designed. It lives in the event navigation so the full 13-tab structure is visible for review.</div>
      <div style={{ marginTop: 18 }}><Badge status="review">In design queue</Badge></div>
    </div>
  );
}

window.OrganiserEventDetail = OrganiserEventDetail;
