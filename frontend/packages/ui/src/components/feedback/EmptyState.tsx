import * as React from 'react';
import { Icon } from '../icons/Icon';

export interface EmptyStateProps {
  /** Lucide icon name. */
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

/** EmptyState — icon, message, optional action; used for empty search results, empty tables. */
export function EmptyState({ icon = 'search', title, description, action, style }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', fontFamily: 'var(--font-sans)', ...style }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--color-off-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--text-subtle)',
        }}
      >
        <Icon name={icon} size={24} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto 20px' }}>{description}</div>}
      {action}
    </div>
  );
}
