import * as React from 'react';
import { LogoMark } from '../brand/Logo';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps {
  style?: React.CSSProperties;
  /** Override the default link columns (label -> real href). Defaults point at
   *  live routes on the public site so nothing renders as a dead "#" link. */
  columns?: { title: string; links: FooterLink[] }[];
}

const DEFAULT_COLS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Discover', links: [
      { label: 'Categories', href: '/events' },
      { label: 'Cities', href: '/events' },
      { label: 'Trending', href: '/events' },
      { label: 'For organisers', href: '/signup' },
    ],
  },
  {
    title: 'Company', links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    title: 'Support', links: [
      { label: 'Help centre', href: '/help' },
      { label: 'Contact us', href: '/contact' },
      { label: 'Refund policy', href: '/refund-policy' },
    ],
  },
];

/** Footer — public site footer: brand blurb, link columns, legal line.
 *  Every link points at a real route by default (see `columns` to override). */
export function Footer({ style, columns = DEFAULT_COLS }: FooterProps) {
  return (
    <footer style={{ background: 'var(--color-ink)', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)', padding: '48px 32px 24px', ...style }}>
      <div style={{ display: 'flex', gap: 64, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <LogoMark style={{ height: 30 }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>showtik</span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>Discover and book live events near you — no account needed to buy a ticket.</div>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{c.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.links.map((l) => (
                <a key={l.label} href={l.href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>{l.label}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
        &copy; 2026 Showtik. All rights reserved.
      </div>
    </footer>
  );
}
