'use client';

import { Icon, Button } from '@cyrokx/ui';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 440, margin: '0 auto', padding: '96px 32px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--status-error-bg)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Icon name="x-circle" size={30} />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px' }}>Something went wrong</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 28px' }}>
        We couldn&apos;t load this page. This is usually temporary — please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
