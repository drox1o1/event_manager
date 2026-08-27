const { Icon, Avatar, TicketTierRow, Button } = window.CyRokxDesignSystem_ef2ebf;

/** EventDetail — gallery, description, agenda, ticket tiers panel, sticky buy CTA, organiser block. */
function EventDetail({ onBuy }) {
  const [qty, setQty] = React.useState({ early: 0, standard: 1, vip: 0 });
  const total = qty.early * 599 + qty.standard * 899 + qty.vip * 2499;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '32px', paddingBottom: 120 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-card)', background: 'linear-gradient(135deg,#efeae4,#e2dcd3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
          <Icon name="image" size={36} />
        </div>
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 }}>
          <div style={{ borderRadius: 'var(--radius-card)', background: 'linear-gradient(135deg,#efeae4,#e2dcd3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}><Icon name="image" size={22} /></div>
          <div style={{ borderRadius: 'var(--radius-card)', background: 'linear-gradient(135deg,#efeae4,#e2dcd3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}><Icon name="image" size={22} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 48 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Music</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 16px' }}>Jazz Night at The Terrace</h1>
          <div style={{ display: 'flex', gap: 24, marginBottom: 28, fontSize: 15, color: 'var(--text-body)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={16} color="var(--text-muted)" /> Sat, 12 Jul &middot; 7:00 PM</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={16} color="var(--text-muted)" /> The Terrace, Bandra, Mumbai</span>
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 10 }}>About this event</h3>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-body)', marginBottom: 28 }}>
            An intimate evening of live jazz with local and touring artists. Doors open at 7, first set starts at 8. Seating is first-come, general admission — arrive early for the front rows.
          </p>

          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12 }}>Agenda</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[["7:00 PM", "Doors open"], ["8:00 PM", "Opening set"], ["9:00 PM", "Headline performance"]].map(([t, l]) => (
              <div key={t} style={{ display: 'flex', gap: 16, fontSize: 15 }}>
                <span style={{ width: 80, color: 'var(--text-subtle)', fontWeight: 600 }}>{t}</span>
                <span style={{ color: 'var(--text-body)' }}>{l}</span>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12 }}>Organiser</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name="Terrace Live" size={44} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Terrace Live Events</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>42 events hosted</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ position: 'sticky', top: 24, background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 20 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px' }}>Tickets</h3>
            <TicketTierRow name="Early Bird" price="₹599" description="First 100 tickets" remaining={12} quantity={qty.early} onQuantityChange={(v) => setQty({ ...qty, early: v })} />
            <TicketTierRow name="Standard" price="₹899" quantity={qty.standard} onQuantityChange={(v) => setQty({ ...qty, standard: v })} />
            <TicketTierRow name="VIP" price="₹2,499" available={false} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-accent)' }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <Button fullWidth style={{ marginTop: 16 }} disabled={total === 0} onClick={() => onBuy && onBuy(total)}>Buy tickets</Button>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface-card)', borderTop: '1px solid var(--border-default)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>from</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-accent)' }}>₹599</div>
        </div>
        <Button size="lg" style={{ whiteSpace: 'nowrap', flexShrink: 0 }} disabled={total === 0} onClick={() => onBuy && onBuy(total)}>Buy tickets</Button>
      </div>
    </div>
  );
}
window.EventDetail = EventDetail;
