'use client';

import * as React from 'react';
import Link from 'next/link';
import { Icon, Input, Button } from '@cyrokx/ui';
import { organiserApi, ApiError } from '@cyrokx/api-client';
import { AuthShell } from '@/components/AuthShell';

export default function SignupPage() {
  const [done, setDone] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', org: '', email: '', password: '' });
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await organiserApi.signup({
        contact_name: form.name,
        org_name: form.org,
        email: form.email,
        password: form.password,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account. Please try again.');
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-accent-tint)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="mail-check" size={26} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Verify your email</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
            We sent a verification link to <strong style={{ color: 'var(--text-body)' }}>{form.email}</strong>. Confirm it, then log in to your organiser account.
          </div>
          <Link href="/login"><Button fullWidth size="lg">Go to login</Button></Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>Create your organiser account</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Start selling tickets in minutes.</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Full name" placeholder="Aditi Rao" value={form.name} onChange={set('name')} />
        <Input label="Organisation" placeholder="Terrace Live Events" value={form.org} onChange={set('org')} />
        <Input label="Email" type="email" placeholder="you@organisation.com" value={form.email} onChange={set('email')} />
        <Input label="Password" type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} />
        {error && <div style={{ fontSize: 13, color: 'var(--color-error)' }}>{error}</div>}
        <Button type="submit" fullWidth size="lg" loading={submitting}>Create account</Button>
      </form>
      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 24 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--text-link)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
      </div>
    </AuthShell>
  );
}
