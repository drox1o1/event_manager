const { Icon, Input, Button } = window.CyRokxDesignSystem_ef2ebf;

/** Login — super admin sign-in. Single account, no self-registration. */
function AdminLogin({ onSubmit }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)' }}>
      <div style={{ width: 400, maxWidth: '100%', background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-modal)', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)' }}>
            CyRok<span style={{ color: 'var(--color-accent)' }}>x</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 8 }}>
            <Icon name="shield" size={13} /> Super admin
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Email" type="email" placeholder="admin@cyrokx.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" fullWidth size="lg">Log in</Button>
        </form>
        <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 20 }}>
          Access is provisioned by the platform team &mdash; no self-registration.
        </div>
      </div>
    </div>
  );
}
window.AdminLogin = AdminLogin;
