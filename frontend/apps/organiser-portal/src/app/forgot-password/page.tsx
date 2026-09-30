'use client';

import * as React from 'react';
import Link from 'next/link';
import { Input, Button, Icon } from '@showtik/ui';
import { organiserApi, ApiError } from '@showtik/api-client';
import { AuthShell } from '@/components/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await organiserApi.forgotPassword(email);
      // Always shows the same success state, whether or not this email has
      // an account -- the backend responds identically either way, and the
      // UI must not create a way to tell the difference.
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="check-circle" size={26} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Check your email</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            If an account exists for <strong>{email}</strong>, we've sent a link to reset your password. It expires in 30 minutes.
          </div>
          <Link href="/login"><Button variant="secondary" fullWidth>Back to login</Button></Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>Forgot your password?</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Enter your email and we'll send you a reset link.</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Email" type="email" placeholder="you@organisation.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <div style={{ fontSize: 13, color: 'var(--color-error)' }}>{error}</div>}
        <Button type="submit" fullWidth size="lg" loading={submitting}>Send reset link</Button>
      </form>
      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 24 }}>
        <Link href="/login" style={{ color: 'var(--text-link)', fontWeight: 600, textDecoration: 'none' }}>Back to login</Link>
      </div>
    </AuthShell>
  );
}
