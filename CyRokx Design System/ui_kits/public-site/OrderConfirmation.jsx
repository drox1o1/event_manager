const { Icon, Button } = window.CyRokxDesignSystem_ef2ebf;

/** OrderConfirmation — success state, order summary, 2-day email notice. */
function OrderConfirmation({ onBackHome }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 560, margin: '0 auto', padding: '64px 32px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Icon name="check-circle" size={30} />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px' }}>You're going!</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 32px' }}>Order #CX-48213 confirmed.</p>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, textAlign: 'left', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-heading)', marginBottom: 10 }}>Jazz Night at The Terrace</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>Sat, 12 Jul &middot; 7:00 PM</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>The Terrace, Bandra, Mumbai</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 14 }}>
          <span style={{ fontSize: 14, color: 'var(--text-body)' }}>Standard × 1</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>₹899</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--color-accent-tint)', borderRadius: 'var(--radius-control)', padding: 14, marginBottom: 28, textAlign: 'left' }}>
        <Icon name="mail" size={16} color="var(--color-accent)" style={{ marginTop: 2, flex: 'none' }} />
        <div style={{ fontSize: 13, color: 'var(--text-body)' }}>Your ticket with a QR code will arrive by email within 2 days.</div>
      </div>

      <Button variant="secondary" onClick={() => onBackHome && onBackHome()}>Back to homepage</Button>
    </div>
  );
}
window.OrderConfirmation = OrderConfirmation;
