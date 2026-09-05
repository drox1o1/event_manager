const { Icon, Input, Select, Textarea, Switch, Checkbox, Button, Badge } = window.CyRokxDesignSystem_ef2ebf;

const CAT_CURRENCIES = ['Indian Rupees (₹) — INR', 'US Dollar ($) — USD', 'Euro (€) — EUR'];

const INITIAL_CATS = [
  { id: 'c1', name: '10K Run', distance: '10', price: '499', max: '1000', sold: 640, start: '2026-07-26 05:00', end: '2026-07-26 11:00', currency: CAT_CURRENCIES[0], minAge: '16', enabled: true, hidden: false, desc: 'Open category. Chip timing included.' },
  { id: 'c2', name: '21K Half Marathon', distance: '21', price: '899', max: '600', sold: 512, start: '2026-07-26 05:00', end: '2026-07-26 12:00', currency: CAT_CURRENCIES[0], minAge: '18', enabled: true, hidden: false, desc: 'Minimum age 18. Finisher medal + tee.' },
  { id: 'c3', name: '5K Fun Run', distance: '5', price: '299', max: '1500', sold: 210, start: '2026-07-26 06:00', end: '2026-07-26 10:00', currency: CAT_CURRENCIES[0], minAge: '', enabled: false, hidden: true, desc: 'Family category, all ages welcome.' },
];

/** EventCategories — race category manager: enable/hide, timing, distance, capacity, price,
 *  currency, minimum age and description per category (event dashboard → Categories tab). */
function EventCategories() {
  const [cats, setCats] = React.useState(INITIAL_CATS);
  const [activeId, setActiveId] = React.useState('c1');
  const active = cats.find((c) => c.id === activeId) || cats[0];
  const patch = (k, v) => setCats((cs) => cs.map((c) => (c.id === active.id ? { ...c, [k]: v } : c)));
  const addCat = () => {
    const id = Math.random().toString(36).slice(2);
    setCats([...cats, { id, name: 'New category', distance: '', price: '0', max: '', sold: 0, start: '', end: '', currency: CAT_CURRENCIES[0], minAge: '', enabled: true, hidden: false, desc: '' }]);
    setActiveId(id);
  };

  return (
    <div>
      <PanelHead title="Categories" subtitle="Distances, capacity and pricing participants choose at registration.">
        <Button size="sm" onClick={addCat}><Icon name="plus" size={15} />Add category</Button>
      </PanelHead>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cats.map((c) => {
            const on = c.id === active.id;
            const pct = c.max ? Math.min(100, Math.round((c.sold / +c.max) * 100)) : 0;
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)} style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--surface-card)', border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-card)', padding: 16, boxShadow: on ? 'var(--shadow-card)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{c.name}</span>
                  {c.enabled ? <Badge status="live">Enabled</Badge> : <Badge status="draft">Disabled</Badge>}
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {c.distance && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="route" size={13} />{c.distance} km</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="indian-rupee" size={13} />{c.price}</span>
                  {c.hidden && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="eye-off" size={13} />Hidden</span>}
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--color-off-white)', overflow: 'hidden', marginBottom: 5 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-accent)' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{c.sold} / {c.max || '∞'} sold</div>
              </button>
            );
          })}
        </div>

        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid var(--border-default)' }}>
            <Switch label="Enabled" checked={active.enabled} onChange={(e) => patch('enabled', e.target.checked)} />
            <Checkbox label="Hide on event page" checked={active.hidden} onChange={(e) => patch('hidden', e.target.checked)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Input label="Title" placeholder="Enter title" value={active.name} onChange={(e) => patch('name', e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Input label="Category start time" placeholder="YYYY-MM-DD HH:mm" value={active.start} onChange={(e) => patch('start', e.target.value)} />
              <Input label="Category end time" placeholder="YYYY-MM-DD HH:mm" value={active.end} onChange={(e) => patch('end', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
              <Input label="Distance (km)" type="number" placeholder="Enter distance" value={active.distance} onChange={(e) => patch('distance', e.target.value)} />
              <Input label="Maximum number of tickets" type="number" placeholder="1000" value={active.max} onChange={(e) => patch('max', e.target.value)} />
              <Input label="Minimum age" type="number" placeholder="Leave blank for none" value={active.minAge} onChange={(e) => patch('minAge', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 18 }}>
              <Input label="Price" type="number" placeholder="0.0" value={active.price} onChange={(e) => patch('price', e.target.value)} />
              <Select label="Currency" value={active.currency} onChange={(e) => patch('currency', e.target.value)} options={CAT_CURRENCIES} />
            </div>
            <Textarea label="Category description (age, gender requirements etc.)" placeholder="Describe eligibility, inclusions and requirements…" rows={4} value={active.desc} onChange={(e) => patch('desc', e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
              <Button variant="ghost" size="sm">Automatic price discount</Button>
              <Button size="sm"><Icon name="save" size={15} />Save category</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelHead({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>{children}</div>
    </div>
  );
}

window.EventCategories = EventCategories;
window.PanelHead = PanelHead;
