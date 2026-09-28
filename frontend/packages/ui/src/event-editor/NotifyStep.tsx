'use client';

import * as React from 'react';
import type { OrganiserEventDetail } from '@showtik/api-client';
import { formatDateTime } from '@showtik/api-client';
import { Icon } from '../components/icons/Icon';
import { Button } from '../components/forms/Button';
import { Card, Notice, SectionTitle } from './ui';

/** Notify audience — share the public link across channels once published. */
export function NotifyStep({ event, publicUrl }: { event: OrganiserEventDetail; publicUrl: string }) {
  const [copied, setCopied] = React.useState(false);
  const isLive = event.status === 'live' || event.status === 'soldout';
  const message = `${event.title} — ${formatDateTime(event.event_date, event.event_time)}, ${event.city}. Book your tickets: ${publicUrl}`;
  const enc = encodeURIComponent;

  const copy = async () => {
    try { await navigator.clipboard.writeText(publicUrl); } catch { /* clipboard blocked */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const channels = [
    { label: 'WhatsApp', icon: 'message-circle', href: `https://wa.me/?text=${enc(message)}`, color: '#25D366' },
    { label: 'Facebook', icon: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(publicUrl)}`, color: '#1877F2' },
    { label: 'X (Twitter)', icon: 'twitter', href: `https://twitter.com/intent/tweet?text=${enc(message)}`, color: '#0F1419' },
    { label: 'LinkedIn', icon: 'linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(publicUrl)}`, color: '#0A66C2' },
    { label: 'Email', icon: 'mail', href: `mailto:?subject=${enc(event.title)}&body=${enc(message)}`, color: 'var(--color-accent)' },
  ];

  return (
    <div>
      <SectionTitle title="Notify your audience" description="Share your event everywhere your audience already is." />
      {!isLive && <div style={{ marginBottom: 20 }}><Notice tone="warning">Your event isn&apos;t live yet — the link will work once it&apos;s published.</Notice></div>}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>Event link</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', padding: '11px 14px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'var(--color-off-white)', fontFamily: 'ui-monospace, monospace', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{publicUrl}</div>
          <Button onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={16} />{copied ? 'Copied' : 'Copy link'}</Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginTop: 22 }}>
          {channels.map((c) => (
            <a key={c.label} href={c.href} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', textDecoration: 'none', color: 'var(--text-heading)', fontWeight: 600, fontSize: 14 }}>
              <span style={{ width: 34, height: 34, borderRadius: '50%', background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={c.icon} size={16} /></span>
              {c.label}
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
