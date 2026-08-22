'use client';

import * as React from 'react';
import { Icon, Badge, Button } from '@cyrokx/ui';

/** ComingSoonPanel — placeholder for the roadmap tabs that live in the event
 *  navigation so the full workspace structure is visible, but are not yet
 *  designed (Merchandize, Leaderboards, Certificates, Attendee bib, Email
 *  templates). The "Edit event" entry links back into the editor. */
export function ComingSoonPanel({ label, icon, tab, onEdit }: { label: string; icon?: string; tab: string; onEdit: () => void }) {
  if (tab === 'edit') {
    return (
      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 48, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-accent-tint)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Icon name="pencil" size={24} /></div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Edit event details</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>Reopens the create-event flow pre-filled with this event&apos;s details, schedule, categories and fees.</div>
        <Button onClick={onEdit}><Icon name="pencil" size={15} />Open editor</Button>
      </div>
    );
  }
  return (
    <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 48, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-off-white)', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Icon name={icon || 'sparkles'} size={24} /></div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>This surface is on the roadmap and not yet designed. It lives in the event navigation so the full workspace structure is visible for review.</div>
      <div style={{ marginTop: 18 }}><Badge status="review">In design queue</Badge></div>
    </div>
  );
}
