'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon, Button } from '@cyrokx/ui';
import { organiserApi, ApiError } from '@cyrokx/api-client';
import { AuthShell } from '@/components/AuthShell';

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = React.useState<'working' | 'done' | 'error'>('working');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    organiserApi
      .verifyEmail(token)
      .then(() => setState('done'))
      .catch((err) => {
        setState('error');
        setMessage(err instanceof ApiError ? err.message : 'This link is invalid or has expired.');
      });
  }, [token]);

  if (state === 'working') {
    return <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Verifying your email…</div>;
  }

  if (state === 'done') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon name="check-circle" size={26} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Email verified</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Your organiser account is active. Log in to get started.</div>
        <Link href="/login"><Button fullWidth size="lg">Go to login</Button></Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--status-error-bg)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Icon name="x-circle" size={26} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Verification failed</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>{message}</div>
      <Link href="/login"><Button variant="secondary" fullWidth>Back to login</Button></Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <AuthShell>
      <React.Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>}>
        <VerifyInner />
      </React.Suspense>
    </AuthShell>
  );
}
