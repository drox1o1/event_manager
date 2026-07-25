'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@cyrokx/ui';
import { organiserApi, ApiError } from '@cyrokx/api-client';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
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
      const { access_token } = await organiserApi.login({ email, password });
      setToken(access_token);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log in. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>Log in</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Manage your events and registrations.</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Email" type="email" placeholder="you@organisation.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div style={{ fontSize: 13, color: 'var(--color-error)' }}>{error}</div>}
        <Button type="submit" fullWidth size="lg" loading={submitting}>Log in</Button>
      </form>
      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 24 }}>
        New organiser?{' '}
        <Link href="/signup" style={{ color: 'var(--text-link)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
      </div>
    </AuthShell>
  );
}
