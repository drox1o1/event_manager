'use client';

import * as React from 'react';
import Link from 'next/link';
import { Icon, Input, Button } from '@showtik/ui';
import { organiserApi, ApiError } from '@showtik/api-client';
import { AuthShell } from '@/components/AuthShell';

export default function SignupPage() {
  const [done, setDone] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', org: '', email: '', password: '' });
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const [fieldErrors, setFieldErrors] = React.useState<Partial<Record<keyof typeof form, string>>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [k]: e.target.value });
    setFieldErrors((fe) => ({ ...fe, [k]: undefined }));
  };

  const validate = () => {
    const fe: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim()) fe.name = 'Enter your full name';
    if (!form.org.trim()) fe.org = 'Enter your organisation name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) fe.email = 'Enter a valid email address';
    if (form.password.length < 8) fe.password = 'Password must be at least 8 characters';
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      await organiserApi.signup({
        contact_name: form.name.trim(),
        org_name: form.org.trim(),
        email: form.email.trim(),
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
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>Verify your email</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
            We sent a verification link to <strong style={{ color: 'var(--text-body)' }}>{form.email}</strong>. Confirm it, then log in to your organiser account.
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-body)', background: 'var(--status-warning-bg)', borderRadius: 'var(--radius-control)', padding: '12px 14px', marginBottom: 24, lineHeight: 1.5, textAlign: 'left' }}>
            <strong>What happens next:</strong> the Showtik team reviews every new organiser (usually within one business day). You can log in and set up your organiser page right away — creating events unlocks once you&apos;re approved.
          </div>
          <Link href="/login"><Button fullWidth size="lg">Go to login</Button></Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>Create your organiser account</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Start selling tickets in minutes.</div>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Full name" placeholder="Aditi Rao" autoComplete="name" value={form.name} error={fieldErrors.name} onChange={set('name')} />
        <Input label="Organisation" placeholder="Terrace Live Events" autoComplete="organization" value={form.org} error={fieldErrors.org} onChange={set('org')} />
        <Input label="Email" type="email" placeholder="you@organisation.com" autoComplete="email" value={form.email} error={fieldErrors.email} onChange={set('email')} />
        <div>
          <Input label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password" value={form.password} error={fieldErrors.password} onChange={set('password')} />
          {!fieldErrors.password && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>Use at least 8 characters.</div>}
        </div>
        {error && <div role="alert" style={{ fontSize: 13, color: 'var(--color-error)' }}>{error}</div>}
        <Button type="submit" fullWidth size="lg" loading={submitting}>Create account</Button>
      </form>
      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 24 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--text-link)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
      </div>
    </AuthShell>
  );
}
