const { Icon, Input, Button } = window.CyRokxDesignSystem_ef2ebf;

function AuthShell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)' }}>
      <div style={{ width: 420, maxWidth: '100%', background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 40 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 32, textAlign: 'center' }}>
          CyRok<span style={{ color: 'var(--color-accent)' }}>x</span>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginTop: 6 }}>Organiser portal</div>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Login — organiser sign-in: email, password, forgot password. */
function Login({ onSubmit, onGoToSignUp }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  return (
    <AuthShell>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>Log in</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Manage your events and registrations.</div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Email" type="email" placeholder="you@organisation.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <a href="#" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-link)', textDecoration: 'none' }}>Forgot password?</a>
          </div>
        </div>
        <Button type="submit" fullWidth size="lg">Log in</Button>
      </form>
      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 24 }}>
        New organiser?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onGoToSignUp && onGoToSignUp(); }} style={{ color: 'var(--text-link)', fontWeight: 600, textDecoration: 'none' }}>Sign up</a>
      </div>
    </AuthShell>
  );
}

/** SignUp — organiser onboarding: name, organisation, email, password, verify notice. */
function SignUp({ onSubmit, onGoToLogin }) {
  const [step, setStep] = React.useState('form');
  const [form, setForm] = React.useState({ name: '', org: '', email: '', password: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (step === 'verify') {
    return (
      <AuthShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-accent-tint)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="mail-check" size={26} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Verify your email</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
            We sent a verification link to <strong style={{ color: 'var(--text-body)' }}>{form.email || 'your inbox'}</strong>. Confirm it to activate your organiser account.
          </div>
          <Button fullWidth size="lg" onClick={() => onSubmit && onSubmit()}>Continue to dashboard</Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>Create your organiser account</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Start selling tickets in minutes.</div>
      <form onSubmit={(e) => { e.preventDefault(); setStep('verify'); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Full name" placeholder="Aditi Rao" value={form.name} onChange={set('name')} />
        <Input label="Organisation" placeholder="Terrace Live Events" value={form.org} onChange={set('org')} />
        <Input label="Email" type="email" placeholder="you@organisation.com" value={form.email} onChange={set('email')} />
        <Input label="Password" type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} />
        <Button type="submit" fullWidth size="lg">Create account</Button>
      </form>
      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 24 }}>
        Already have an account?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onGoToLogin && onGoToLogin(); }} style={{ color: 'var(--text-link)', fontWeight: 600, textDecoration: 'none' }}>Log in</a>
      </div>
    </AuthShell>
  );
}

window.OrganiserLogin = Login;
window.OrganiserSignUp = SignUp;
