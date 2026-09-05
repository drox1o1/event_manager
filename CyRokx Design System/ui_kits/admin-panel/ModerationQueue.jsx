const { Icon, Badge, Button, Textarea, EmptyState } = window.CyRokxDesignSystem_ef2ebf;

const QUEUE = [
  {
    id: 'e1', title: 'Improv Comedy Jam', organiser: 'Laugh Lounge', submitted: '2 hours ago',
    category: 'Comedy', date: 'Sat, 19 Jul, 8:00 PM', venue: 'The Backyard, Delhi', capacity: 120,
    description: 'A fast-paced improv comedy showcase featuring six performers, audience prompts, and a house band. Doors at 7:30, show runs 90 minutes.',
  },
  {
    id: 'e2', title: 'Marathon Expo', organiser: 'RunClub India', submitted: '5 hours ago',
    category: 'Sports', date: 'Sun, 20 Jul, 9:00 AM', venue: 'Marine Drive, Mumbai', capacity: 2000,
    description: 'Expo and bib collection for the city marathon — gear stalls, nutrition talks, and a free fun run for kids.',
  },
  {
    id: 'e3', title: 'Classical Evening', organiser: 'Raga Society', submitted: 'Yesterday',
    category: 'Music', date: 'Fri, 25 Jul, 7:00 PM', venue: 'Ravindra Bhavan, Chennai', capacity: 300,
    description: 'An evening of Carnatic vocal and violin, presented by three senior artists from the Raga Society repertory.',
  },
  {
    id: 'e4', title: 'Street Food Fest — Round 2', organiser: 'Foodie Collective', submitted: 'Yesterday',
    category: 'Food & Drink', date: 'Sat, 26 Jul, 12:00 PM', venue: 'Carter Road, Mumbai', capacity: 500,
    description: '40 vendor stalls, live cooking demos, and a ticketed tasting trail across the promenade.',
  },
];

/** ModerationQueue — events awaiting review + a review panel to approve or reject with a reason. Fast, scannable triage. */
function ModerationQueue() {
  const [items, setItems] = React.useState(QUEUE);
  const [selectedId, setSelectedId] = React.useState(QUEUE[0].id);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [resolved, setResolved] = React.useState({}); // id -> 'approved' | 'rejected'

  const selected = items.find((e) => e.id === selectedId);

  const decide = (id, decision) => {
    setResolved((r) => ({ ...r, [id]: decision }));
    setRejecting(false);
    setReason('');
    const remaining = items.filter((e) => e.id !== id && !resolved[e.id]);
    if (remaining[0]) setSelectedId(remaining[0].id);
  };

  const pending = items.filter((e) => !resolved[e.id]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Moderation queue</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{pending.length} events awaiting review</div>
      </div>

      {pending.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
          <EmptyState icon="check-circle" title="Queue clear" description="Every submitted event has been reviewed." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.filter((e) => !resolved[e.id]).map((e) => {
              const active = e.id === selectedId;
              return (
                <div
                  key={e.id}
                  onClick={() => { setSelectedId(e.id); setRejecting(false); setReason(''); }}
                  style={{
                    background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', padding: 16, cursor: 'pointer',
                    boxShadow: active ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
                    border: `1.5px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{e.title}</div>
                    <Badge status="review" />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.organiser}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 6 }}>Submitted {e.submitted}</div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>{selected.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="building-2" size={14} /> {selected.organiser}
                  </div>
                </div>
                <Badge status="review" />
              </div>

              <div style={{ aspectRatio: '16/5', borderRadius: 'var(--radius-control)', background: 'linear-gradient(135deg, #EFEAE4, #E4DED6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', marginBottom: 20 }}>
                <Icon name="image" size={26} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <ModerationDetailRow icon="tag" label="Category" value={selected.category} />
                <ModerationDetailRow icon="calendar" label="Date" value={selected.date} />
                <ModerationDetailRow icon="map-pin" label="Venue" value={selected.venue} />
                <ModerationDetailRow icon="users" label="Capacity" value={selected.capacity.toLocaleString()} />
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>Description</div>
              <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.5, marginBottom: 24 }}>{selected.description}</div>

              {rejecting ? (
                <div>
                  <Textarea label="Reason for rejection" placeholder="Tell the organiser what needs to change…" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => { setRejecting(false); setReason(''); }}>Cancel</Button>
                    <Button variant="destructive" disabled={!reason.trim()} onClick={() => decide(selected.id, 'rejected')}>Confirm rejection</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid var(--border-default)' }}>
                  <Button variant="destructive" onClick={() => setRejecting(true)}><Icon name="x" size={15} />Reject</Button>
                  <Button onClick={() => decide(selected.id, 'approved')}><Icon name="check" size={15} />Approve</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModerationDetailRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ color: 'var(--text-subtle)', marginTop: 2 }}><Icon name={icon} size={15} /></span>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--text-heading)', fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  );
}

window.ModerationQueue = ModerationQueue;
