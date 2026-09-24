import * as React from 'react';

export interface InfoPageViewProps {
  title: string;
  children: React.ReactNode;
}

/** InfoPageView — simple content shell for static pages (About, Careers, Press,
 *  Help, Contact, Refund policy) linked from the footer. */
export function InfoPageView({ title, children }: InfoPageViewProps) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 760, margin: '0 auto', padding: 'clamp(32px, 6vw, 64px) clamp(16px, 4vw, 32px) 96px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--text-heading)', margin: '0 0 24px' }}>{title}</h1>
      <div style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-body)', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}
