import * as React from 'react';
import { LogoMark } from './Logo';

export interface PageLoaderProps {
  /** 'page' fills the viewport (splash on first load / route change); 'inline' fills its container. */
  variant?: 'page' | 'inline';
  label?: string;
  /** Dark navy backdrop with the light wordmark — for auth/splash surfaces. */
  tone?: 'light' | 'dark';
  style?: React.CSSProperties;
}

/** PageLoader — branded loading splash. Shows the Showtik monogram with a soft
 *  pulse and a progress shimmer instead of bare "Loading…" text. */
export function PageLoader({ variant = 'page', label = 'Loading', tone = 'light', style }: PageLoaderProps) {
  const dark = tone === 'dark';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        minHeight: variant === 'page' ? '100vh' : 240,
        width: '100%',
        background: dark ? 'var(--gradient-hero)' : 'var(--surface-page)',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <style>{'@keyframes showtik-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(0.9);opacity:0.72}}@keyframes showtik-slide{0%{transform:translateX(-100%)}100%{transform:translateX(320%)}}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <LogoMark style={{ height: 40, animation: 'showtik-pulse 1.3s ease-in-out infinite' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em', color: dark ? '#fff' : 'var(--color-ink)' }}>showtik</span>
      </div>
      <div style={{ position: 'relative', width: 128, height: 4, borderRadius: 999, overflow: 'hidden', background: dark ? 'rgba(255,255,255,0.16)' : 'var(--color-rule)' }}>
        <span style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '30%', borderRadius: 999, background: 'var(--color-accent)', animation: 'showtik-slide 1.1s ease-in-out infinite' }} />
      </div>
      {label && <span style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{label}</span>}
    </div>
  );
}
