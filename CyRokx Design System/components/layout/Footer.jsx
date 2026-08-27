import React from 'react';

/** Footer — public site footer: brand blurb, link columns, legal line. */
export function Footer({ style }) {
  const cols = [
    { title: 'Discover', links: ['Categories', 'Cities', 'Trending', 'For organisers'] },
    { title: 'Company', links: ['About', 'Careers', 'Press'] },
    { title: 'Support', links: ['Help centre', 'Contact us', 'Refund policy'] },
  ];
  return (
    <footer style={{ background: 'var(--color-ink)', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)', padding: '48px 32px 24px', ...style }}>
      <div style={{ display: 'flex', gap: 64, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 240 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>CyRok<span style={{ color: 'var(--color-accent)' }}>x</span></div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>Discover and book live events near you — no account needed to buy a ticket.</div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{c.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.links.map((l) => (
                <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
        &copy; 2026 CyRokx. All rights reserved.
      </div>
    </footer>
  );
}
