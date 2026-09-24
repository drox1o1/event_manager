'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@showtik/ui';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { token, ready } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!ready) return;
    router.replace(token ? '/dashboard' : '/login');
  }, [ready, token, router]);

  return <PageLoader tone="dark" />;
}
