import * as React from 'react';
import { LogoFull } from '@showtik/ui';

/** Centered auth card shell shared by login/signup/verify. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-hero)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)' }}>
      <div style={{ width: 420, maxWidth: '100%', background: 'var(--surface-card)', borderRadius: 'var(--radius-modal)', boxShadow: 'var(--shadow-modal)', padding: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 32, textAlign: 'center' }}>
          <LogoFull style={{ height: 32 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Organiser portal</div>
        </div>
        {children}
      </div>
    </div>
  );
}
