const { Icon, Stepper, Input, Textarea, Select, Switch, Checkbox, Button, Badge } = window.CyRokxDesignSystem_ef2ebf;

const EVENT_TYPES = ['Running', 'Cycling', 'Triathlon', 'Concert', 'Conference', 'Workshop'];
const ENDURANCE = ['Running', 'Cycling', 'Triathlon'];
const ORGS = ['Devodass Hospital', 'RunXtreme Foundation', 'CyRokx Sports', '+ Add organiser…'];
const CURRENCIES = ['Indian Rupees (₹) — INR', 'US Dollar ($) — USD', 'Euro (€) — EUR'];
const STEPS = ['Details', 'Schedule', 'Categories', 'Media', 'Fees & visibility', 'Review'];

function emptyCat() { return { id: Math.random().toString(36).slice(2), name: '', distance: '', max: '', price: '', currency: CURRENCIES[0], minAge: '' }; }

const isEndurance = (t) => ENDURANCE.includes(t);

/** CreateEvent — hybrid wizard carrying the full OTR section content: details, schedule,
 *  registration period, type-aware categories (endurance → distance/bib), media, processing
 *  fees and private/unlisted visibility with a shareable registration link. */
function CreateEvent({ onSubmit, onCancel }) {
  const [step, setStep] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const [type, setType] = React.useState('Running');
  const [details, setDetails] = React.useState({ title: '', venue: '', org: ORGS[0], description: '' });
  const [schedule, setSchedule] = React.useState({ start: '', end: '', sellStart: '', sellStop: '' });
  const [cats, setCats] = React.useState([{ ...emptyCat(), name: '10K Run', distance: '10', max: '1000', price: '499' }]);
  const [media, setMedia] = React.useState({ banner: false, photos: false, email: '', phone: '', website: '' });
  const [fees, setFees] = React.useState({ pct: '4.0', userShare: '100' });
  const [priv, setPriv] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const endurance = isEndurance(type);
  const shareUrl = `cyrokx.in/e/${(details.title || 'my-event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-event'}?k=8fa2`;
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const updateCat = (id, k, v) => setCats((cs) => cs.map((c) => (c.id === id ? { ...c, [k]: v } : c)));
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Icon name="check" size={30} strokeWidth={2.5} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>{priv ? 'Saved as unlisted' : 'Submitted for review'}</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
          {details.title || 'Your event'} is {priv ? <>hidden from the public events page. Share the registration link with your participants directly.</> : <>now <Badge status="review" /> with our moderation team. We&apos;ll review it within 24 hours.</>}
        </div>
        {priv && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface-accent-secondary-tint)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', padding: '10px 12px', marginBottom: 24, textAlign: 'left' }}>
            <Icon name="link" size={15} />
            <span style={{ flex: 1, fontSize: 13, fontFamily: 'monospace', color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</span>
            <Button size="sm" variant="secondary" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          </div>
        )}
        <Button onClick={onSubmit}>Back to my events</Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)' }}>Create event</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button variant="ghost" size="sm" onClick={onCancel}><Icon name="save" size={15} />Save draft</Button>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={20} /></button>
        </div>
      </div>

      <Stepper steps={STEPS} activeIndex={step} style={{ marginBottom: 32 }} />

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 28 }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionLabel>Event details</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Select label="Type" value={type} onChange={(e) => setType(e.target.value)} options={EVENT_TYPES} />
              <Input label="Status" value="Draft" disabled onChange={() => {}} />
            </div>
            <Input label="Title" placeholder="RunXtreme Half Marathon 2026" value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} />
            <Input label="Venue" placeholder="Start location, or “Anywhere” for virtual events" value={details.venue} onChange={(e) => setDetails({ ...details, venue: e.target.value })} />
            {endurance && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface-accent-tint)', borderRadius: 'var(--radius-control)', padding: '10px 12px', fontSize: 13, color: 'var(--color-accent)' }}>
                <Icon name="flag" size={15} /> Endurance event — distance, minimum age and bib numbers are enabled for this type.
              </div>
            )}
            <SectionLabel style={{ marginTop: 8 }}>Organisation</SectionLabel>
            <Select label="Name" value={details.org} onChange={(e) => setDetails({ ...details, org: e.target.value })} options={ORGS} />
            <UploadTile compact label="Organisation logo" hint="PNG or SVG, square" icon="image" />
            <SectionLabel style={{ marginTop: 8 }}>Description</SectionLabel>
            <Textarea label={null} placeholder="Tell participants about the route, timing and what's included…" rows={5} value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} />
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionLabel>Event schedule</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Input label="Start time" placeholder="YYYY-MM-DD HH:mm" value={schedule.start} onChange={(e) => setSchedule({ ...schedule, start: e.target.value })} />
              <Input label="End time" placeholder="YYYY-MM-DD HH:mm" value={schedule.end} onChange={(e) => setSchedule({ ...schedule, end: e.target.value })} />
            </div>
            <SectionLabel style={{ marginTop: 8 }}>Registration period</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Input label="Start selling tickets after" placeholder="YYYY-MM-DD HH:mm" value={schedule.sellStart} onChange={(e) => setSchedule({ ...schedule, sellStart: e.target.value })} />
              <Input label="Stop selling tickets after" placeholder="YYYY-MM-DD HH:mm" value={schedule.sellStop} onChange={(e) => setSchedule({ ...schedule, sellStop: e.target.value })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <SectionLabel style={{ margin: 0 }}>{endurance ? 'Race categories' : 'Ticket tiers'}</SectionLabel>
              <span style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>{cats.length} added</span>
            </div>
            {cats.map((c, i) => (
              <div key={c.id} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: i < cats.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: endurance ? '1.4fr 0.8fr 0.9fr 0.9fr 0.9fr auto' : '1.6fr 0.9fr 0.9fr 1fr auto', gap: 12, alignItems: 'end' }}>
                  <Input label={endurance ? 'Category' : 'Tier name'} placeholder={endurance ? '10K Run' : 'Early Bird'} value={c.name} onChange={(e) => updateCat(c.id, 'name', e.target.value)} />
                  {endurance && <Input label="Distance (km)" type="number" placeholder="10" value={c.distance} onChange={(e) => updateCat(c.id, 'distance', e.target.value)} />}
                  <Input label="Max tickets" type="number" placeholder="1000" value={c.max} onChange={(e) => updateCat(c.id, 'max', e.target.value)} />
                  <Input label="Price (₹)" type="number" placeholder="499" value={c.price} onChange={(e) => updateCat(c.id, 'price', e.target.value)} />
                  {endurance && <Input label="Min age" type="number" placeholder="—" value={c.minAge} onChange={(e) => updateCat(c.id, 'minAge', e.target.value)} />}
                  <button onClick={() => setCats(cats.filter((x) => x.id !== c.id))} disabled={cats.length === 1} style={{ height: 44, width: 44, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'none', color: 'var(--text-subtle)', cursor: cats.length === 1 ? 'not-allowed' : 'pointer' }}>
                    <Icon name="trash-2" size={16} />
                  </button>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setCats([...cats, emptyCat()])}><Icon name="plus" size={15} />Add {endurance ? 'category' : 'tier'}</Button>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionLabel>Media</SectionLabel>
            <UploadTile label="Header image (banner)" hint="1600×600 recommended" icon="image" active={media.banner} onClick={() => setMedia({ ...media, banner: !media.banner })} />
            <UploadTile label="Event photos" hint="Up to 8 images" icon="images" active={media.photos} onClick={() => setMedia({ ...media, photos: !media.photos })} />
            <SectionLabel style={{ marginTop: 8 }}>Contact information</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
              <Input label="Email" type="email" placeholder="Enter event email" value={media.email} onChange={(e) => setMedia({ ...media, email: e.target.value })} />
              <Input label="Phone" type="tel" placeholder="Enter phone number" value={media.phone} onChange={(e) => setMedia({ ...media, phone: e.target.value })} />
              <Input label="Website" placeholder="Enter website" value={media.website} onChange={(e) => setMedia({ ...media, website: e.target.value })} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionLabel>Processing fees</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Input label="Percentage" type="number" value={fees.pct} onChange={(e) => setFees({ ...fees, pct: e.target.value })} />
              <Input label="% of processing fees paid by user" type="number" value={fees.userShare} onChange={(e) => setFees({ ...fees, userShare: e.target.value })} />
            </div>
            <div style={{ background: 'var(--color-off-white)', borderRadius: 'var(--radius-control)', padding: 14, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              A {fees.pct || '0'}% processing fee applies per order. {fees.userShare === '100' ? 'The buyer covers it in full at checkout.' : fees.userShare === '0' ? 'You absorb it — it is deducted from your payout.' : `The buyer pays ${fees.userShare || '0'}%; the remainder is deducted from your payout.`}
            </div>
            <SectionLabel style={{ marginTop: 8 }}>Visibility</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', padding: 16 }}>
              <Switch label="Do not list this event publicly" checked={priv} onChange={(e) => setPriv(e.target.checked)} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 2 }}>Hidden from the events page but still accessible by URL — circulate the link for private registration.</div>
              {priv && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, background: 'var(--surface-accent-secondary-tint)', borderRadius: 'var(--radius-control)', padding: '10px 12px' }}>
                  <Icon name="link" size={15} />
                  <span style={{ flex: 1, fontSize: 13, fontFamily: 'monospace', color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</span>
                  <Button size="sm" variant="secondary" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ReviewRow label="Type" value={type} />
            <ReviewRow label="Title" value={details.title || '—'} />
            <ReviewRow label="Venue" value={details.venue || '—'} />
            <ReviewRow label="Organisation" value={details.org} />
            <ReviewRow label="Schedule" value={schedule.start ? `${schedule.start} → ${schedule.end || '—'}` : '—'} />
            <ReviewRow label={endurance ? 'Race categories' : 'Ticket tiers'} value={`${cats.length} configured`} />
            <ReviewRow label="Processing fee" value={`${fees.pct || '0'}% · buyer pays ${fees.userShare || '0'}%`} />
            <ReviewRow label="Visibility" value={priv ? 'Unlisted (link only)' : 'Public'} />
            <div style={{ background: 'var(--color-off-white)', borderRadius: 'var(--radius-control)', padding: 14, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {priv ? 'Saving keeps this event unlisted — it won\u2019t appear on the public events page. You can publish it later from the event dashboard.' : 'Submitting sends this event to our moderation team. We\u2019ll review it within 24 hours before it goes live.'}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button variant="ghost" onClick={step === 0 ? onCancel : back}>{step === 0 ? 'Cancel' : 'Back'}</Button>
        {step < STEPS.length - 1
          ? <Button onClick={next}>Continue</Button>
          : <Button onClick={() => setSubmitted(true)}>{priv ? 'Save unlisted event' : 'Submit for review'}</Button>}
      </div>
    </div>
  );
}

function SectionLabel({ children, style }) {
  return <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', ...style }}>{children}</div>;
}

function UploadTile({ label, hint, icon, active, onClick, compact }) {
  return (
    <div>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>{label}</div>}
      <div onClick={onClick} style={{ height: compact ? 72 : 130, borderRadius: 'var(--radius-card)', border: `1.5px dashed ${active ? 'var(--color-accent)' : 'var(--border-default)'}`, background: active ? 'var(--surface-accent-tint)' : 'var(--color-off-white)', display: 'flex', flexDirection: compact ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: onClick ? 'pointer' : 'default', color: active ? 'var(--color-accent)' : 'var(--text-subtle)' }}>
        <Icon name={active ? 'check-circle' : icon} size={compact ? 20 : 26} />
        <div style={{ fontSize: 13 }}>{active ? 'Uploaded — click to replace' : `Choose file · ${hint}`}</div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border-default)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text-heading)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

window.CreateEvent = CreateEvent;
