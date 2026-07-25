import * as React from 'react';

export type BadgeStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'live' | 'soldout';

export interface BadgeProps {
  status?: BadgeStatus;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const LOOK: Record<BadgeStatus, { bg: string; fg: string; label: string }> = {
  draft: { bg: 'var(--status-muted-bg)', fg: 'var(--status-muted-text)', label: 'Draft' },
  review: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning-text)', label: 'In review' },
  approved: { bg: 'var(--status-success-bg)', fg: 'var(--status-success-text)', label: 'Approved' },
  rejected: { bg: 'var(--status-error-bg)', fg: 'var(--status-error-text)', label: 'Rejected' },
  live: { bg: 'var(--status-success-bg)', fg: 'var(--status-success-text)', label: 'Live' },
  soldout: { bg: 'var(--status-muted-bg)', fg: 'var(--status-muted-text)', label: 'Sold out' },
};

/** Badge — status pill for event/order lifecycle (draft, in review, approved, rejected, live, sold out). */
export function Badge({ status = 'draft', children, style }: BadgeProps) {
  const look = LOOK[status] || LOOK.draft;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        background: look.bg,
        color: look.fg,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.4,
        ...style,
      }}
    >
      {children || look.label}
    </span>
  );
}
