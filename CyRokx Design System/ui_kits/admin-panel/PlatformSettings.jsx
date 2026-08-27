const { Icon, Input, Button, Switch, Tag, Textarea } = window.CyRokxDesignSystem_ef2ebf;

const DEFAULT_CATEGORIES = ['Music', 'Comedy', 'Workshops', 'Sports', 'Food & Drink', 'Theatre'];

function PlatformSettingsCard({ icon, title, description, children }) {
  return (
    <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-accent-tint)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name={icon} size={17} />
        </span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

/** PlatformSettings — category management, commission config, and email-notification settings with a live preview. */
function PlatformSettings() {
  const [categories, setCategories] = React.useState(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = React.useState('');
  const [commission, setCommission] = React.useState('8');
  const [buyerFee, setBuyerFee] = React.useState(true);
  const [autoPayout, setAutoPayout] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const addCategory = () => {
    const v = newCategory.trim();
    if (v && !categories.includes(v)) setCategories([...categories, v]);
    setNewCategory('');
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Platform settings</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Categories, commission, and buyer notifications — platform-wide.</div>
        </div>
        <Button onClick={save}>{saved ? 'Saved' : 'Save changes'}</Button>
      </div>

      <PlatformSettingsCard icon="tag" title="Categories" description="Shown on the homepage grid and used as filters across the site.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {categories.map((c) => (
            <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px 6px 14px', borderRadius: 999, background: 'var(--color-off-white)', fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>
              {c}
              <span onClick={() => setCategories(categories.filter((x) => x !== c))} style={{ display: 'flex', cursor: 'pointer', color: 'var(--text-subtle)' }}>
                <Icon name="x" size={13} />
              </span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, maxWidth: 360 }}>
          <Input placeholder="Add a category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <Button variant="secondary" onClick={addCategory}>Add</Button>
        </div>
      </PlatformSettingsCard>

      <PlatformSettingsCard icon="percent" title="Commission" description="Platform fee taken from every ticket sold, before organiser payout.">
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: 160 }}>
            <Input label="Platform commission" value={commission} onChange={(e) => setCommission(e.target.value.replace(/[^0-9]/g, ''))} icon="percent" />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingBottom: 12 }}>
            On a ₹1,000 ticket, CyRokx keeps <strong style={{ color: 'var(--text-heading)' }}>₹{Math.round((Number(commission) || 0) * 10)}</strong>.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-default)' }}>
          <Switch label="Pass a separate booking fee to the buyer" checked={buyerFee} onChange={(e) => setBuyerFee(e.target.checked)} />
          <Switch label="Release payouts automatically once an event is approved" checked={autoPayout} onChange={(e) => setAutoPayout(e.target.checked)} />
        </div>
      </PlatformSettingsCard>

      <PlatformSettingsCard icon="mail" title="Buyer email notifications" description="Sender identity and footer for order-confirmation email.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Sender name" defaultValue="CyRokx" placeholder="CyRokx" />
            <Input label="Reply-to email" type="email" placeholder="support@cyrokx.com" />
            <Textarea label="Footer note" rows={2} placeholder="Questions about your order? Reply to this email." />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 8 }}>PREVIEW</div>
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--color-ink)', color: '#fff', padding: '16px 20px', fontWeight: 700, fontSize: 15 }}>
                CyRok<span style={{ color: 'var(--color-accent)' }}>x</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>You're going! Order #CX-48213 confirmed.</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)', marginBottom: 4 }}>Jazz Night at The Terrace</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>Sat, 12 Jul &middot; 7:00 PM &middot; The Terrace, Bandra, Mumbai</div>
                <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--color-off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', margin: '0 auto 14px' }}>
                  <Icon name="qr-code" size={28} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', textAlign: 'center' }}>Questions about your order? Reply to this email.</div>
              </div>
            </div>
          </div>
        </div>
      </PlatformSettingsCard>
    </div>
  );
}
window.PlatformSettings = PlatformSettings;
