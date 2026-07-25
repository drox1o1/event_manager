'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Input, Button } from '@cyrokx/ui';
import { adminApi, ApiError } from '@cyrokx/api-client';
import { useAuth } from '@/lib/auth';

/** Login — super admin sign-in. Single account, provisioned by the platform team. */
export default function AdminLoginPage() {
  const router = useRouter();
  const { setToken } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { access_token } = await adminApi.login({ email, password });
      setToken(access_token);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log in. Please try again.');
      setSubmitting(false);
    }
  };

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
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Email" type="email" placeholder="admin@cyrokx.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div style={{ fontSize: 13, color: 'var(--color-error)' }}>{error}</div>}
          <Button type="submit" fullWidth size="lg" loading={submitting}>Log in</Button>
        </form>
        <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 20 }}>
          Access is provisioned by the platform team — no self-registration.
        </div>
      </div>
    </div>
  );
}
