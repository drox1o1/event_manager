const { Icon, Input, Button } = window.CyRokxDesignSystem_ef2ebf;

/** Checkout — ticket summary, buyer details form, order summary, pay button, trust markers. No login. */
function Checkout({ total = 899, onPay }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 900, margin: '0 auto', padding: '32px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 24 }}>Checkout</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 14 }}>Buyer details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            <Input label="Full name" placeholder="Priya Shah" />
            <Input label="Email" type="email" placeholder="you@email.com" />
            <Input label="Phone" type="tel" placeholder="+91 98765 43210" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 14 }}>Payment</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Card number" placeholder="1234 1234 1234 1234" icon="credit-card" />
            <div style={{ display: 'flex', gap: 14 }}>
              <Input label="Expiry" placeholder="MM/YY" />
              <Input label="CVV" placeholder="123" />
            </div>
          </div>
        </div>
        <div>
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 14px' }}>Order summary</h3>
            <div style={{ fontSize: 14, color: 'var(--text-body)', marginBottom: 10, fontWeight: 600 }}>Jazz Night at The Terrace</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Standard × 1</span><span>₹899</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>
              <span>Booking fee</span><span>₹0</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--color-accent)' }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <Button fullWidth size="lg" onClick={() => onPay && onPay()}>Pay ₹{total.toLocaleString('en-IN')}</Button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}><Icon name="shield-check" size={14} /> Secure checkout, no account needed</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}><Icon name="lock" size={14} /> Payment details are encrypted</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.Checkout = Checkout;
