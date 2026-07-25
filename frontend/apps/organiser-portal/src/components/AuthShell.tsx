import * as React from 'react';

/** Centered auth card shell shared by login/signup/verify. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)' }}>
      <div style={{ width: 420, maxWidth: '100%', background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 40 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 32, textAlign: 'center' }}>
          CyRok<span style={{ color: 'var(--color-accent)' }}>x</span>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginTop: 6 }}>Organiser portal</div>
        </div>
        {children}
      </div>
    </div>
  );
}
