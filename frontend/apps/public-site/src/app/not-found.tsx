import Link from 'next/link';
import { Icon, Button } from '@cyrokx/ui';

export default function NotFound() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 440, margin: '0 auto', padding: '96px 32px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-muted-bg)', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Icon name="compass" size={30} />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px' }}>Page not found</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 28px' }}>
        The event or page you&apos;re looking for doesn&apos;t exist, or may have been removed.
      </p>
      <Link href="/"><Button>Back to homepage</Button></Link>
    </div>
  );
}
