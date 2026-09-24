import * as React from 'react';

export interface InfoPageViewProps {
  title: string;
  /** Plain text; blank lines separate paragraphs. Admin-edited via the
   *  super-admin's Site pages screen. */
  body: string;
}

/** InfoPageView — simple content shell for static pages (About, Careers, Press,
 *  Help, Contact, Refund policy) linked from the footer. Content comes from
 *  the public `/site-pages/{slug}` endpoint, not hardcoded copy. */
export function InfoPageView({ title, body }: InfoPageViewProps) {
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 760, margin: '0 auto', padding: 'clamp(32px, 6vw, 64px) clamp(16px, 4vw, 32px) 96px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--text-heading)', margin: '0 0 24px' }}>{title}</h1>
      <div style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-body)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {paragraphs.map((p, i) => <p key={i} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{p}</p>)}
      </div>
    </div>
  );
}
