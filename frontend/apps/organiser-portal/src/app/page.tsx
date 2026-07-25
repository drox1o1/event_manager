'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/** Root — bounce to the dashboard (guard) or login depending on session. */
export default function Home() {
  const { token, ready } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!ready) return;
    router.replace(token ? '/dashboard' : '/login');
  }, [ready, token, router]);

  return <div style={{ padding: 40, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>Loading…</div>;
}
