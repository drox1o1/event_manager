'use client';

import * as React from 'react';
import { Icon } from '../components/icons/Icon';

// Small building blocks shared by every editor step.

export function SectionTitle({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.015em', color: 'var(--text-heading)', margin: 0 }}>{title}</h1>
        {description && <div style={{ fontSize: 14.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{description}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}

export function SubHeading({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div style={{ margin: '4px 0 14px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text-heading)' }}>{children}</div>
      {hint && <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: 'var(--border-default)', margin: '32px 0' }} />;
}

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>
      {children}{required && <span style={{ color: 'var(--color-accent)' }}> *</span>}
    </div>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--color-error)', marginTop: 6 }}>
      <Icon name="alert-circle" size={13} />{message}
    </div>
  );
}

/** Big selectable card (Venue/Online/Recorded, Single/Recurring, Public/Private, Paid/Free/Donation). */
export function ChoiceCard({
  selected, onClick, icon, title, description, note, compact,
}: {
  selected: boolean; onClick: () => void; icon?: string; title: string; description?: string; note?: string; compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        position: 'relative', textAlign: compact ? 'center' : 'left', cursor: 'pointer', fontFamily: 'var(--font-sans)',
        background: selected ? 'var(--surface-accent-tint)' : 'var(--surface-card)',
        border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-card)', padding: compact ? '16px 14px' : '20px 20px 18px',
        display: 'flex', flexDirection: 'column', alignItems: compact ? 'center' : 'flex-start', gap: 8,
        transition: 'border-color .15s ease, background .15s ease', width: '100%',
      }}
    >
      {selected && (
        <span style={{ position: 'absolute', top: 12, right: 12, color: 'var(--color-accent)', display: 'flex' }}>
          <Icon name="circle-check" size={18} />
        </span>
      )}
      {icon && (
        <span style={{ width: 42, height: 42, borderRadius: '50%', background: selected ? '#fff' : 'var(--color-off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected ? 'var(--color-accent)' : 'var(--text-heading)' }}>
          <Icon name={icon} size={19} />
        </span>
      )}
      <span style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</span>
      {description && <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.45 }}>{description}</span>}
      {note && <span style={{ fontSize: 12.5, color: 'var(--text-subtle)', fontStyle: 'italic' }}>{note}</span>}
    </button>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success' | 'warning'; children: React.ReactNode }) {
  const look = {
    info: { bg: 'var(--surface-accent-secondary-tint)', fg: 'var(--color-accent-secondary)', icon: 'info' },
    error: { bg: 'var(--status-error-bg)', fg: 'var(--status-error-text)', icon: 'alert-triangle' },
    success: { bg: 'var(--status-success-bg)', fg: 'var(--status-success-text)', icon: 'circle-check' },
    warning: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning-text)', icon: 'alert-circle' },
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : undefined} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: look.bg, borderRadius: 'var(--radius-control)', padding: '12px 14px', fontSize: 13.5, color: 'var(--text-body)', lineHeight: 1.5 }}>
      <span style={{ color: look.fg, display: 'flex', marginTop: 1, flex: 'none' }}><Icon name={look.icon} size={16} /></span>
      <div>{children}</div>
    </div>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', padding: 24, ...style }}>{children}</div>;
}

/** Sticky save bar at the bottom of a step. */
export function SaveBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--surface-card) 30%)', padding: '24px 0 20px', marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12, zIndex: 5 }}>
      {children}
    </div>
  );
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function checkImage(file: File): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return 'Please choose a JPG, PNG, WebP or GIF image.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image is larger than 10 MB. Please choose a smaller file.';
  return null;
}

export function errMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    const m = (err as { message: string }).message;
    // Pydantic errors come back verbose; keep the human part.
    const match = m.match(/Value error, ([^\n\[]+)/);
    return match ? match[1].trim() : m || fallback;
  }
  return fallback;
}
