import * as React from 'react';

export interface EmptyStateProps {
  /** Lucide icon name. */
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;
