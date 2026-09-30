'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Input, Button, Icon } from '@showtik/ui';
import { organiserApi, ApiError } from '@showtik/api-client';
import { AuthShell } from '@/components/AuthShell';

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [state, setState] = React.useState<'form' | 'done' | 'error'>('form');
  const [error, setError] = React.useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError('');
    try {
      await organiserApi.resetPassword(token, password);
      setState('done');
    } catch (err) {
      setState('error');
      setError(err instanceof ApiError ? err.message : 'This link is invalid or has expired.');
    }
  };

  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--status-error-bg)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon name="x-circle" size={26} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>This link is missing its token</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Request a new password reset link and try again.</div>
        <Link href="/forgot-password"><Button fullWidth>Request a new link</Button></Link>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon name="check-circle" size={26} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Password updated</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Log in with your new password.</div>
        <Link href="/login"><Button fullWidth size="lg">Go to login</Button></Link>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--status-error-bg)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon name="x-circle" size={26} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Couldn't reset your password</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>{error}</div>
        <Link href="/forgot-password"><Button fullWidth>Request a new link</Button></Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>Set a new password</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Choose a new password for your organiser account.</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="New password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input label="Confirm new password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        {error && <div style={{ fontSize: 13, color: 'var(--color-error)' }}>{error}</div>}
        <Button type="submit" fullWidth size="lg">Reset password</Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <React.Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>}>
        <ResetPasswordInner />
      </React.Suspense>
    </AuthShell>
  );
}
