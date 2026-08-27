import * as React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  /** e.g. "+12% vs last week"; leading +/- colors the delta green/red. */
  delta?: string;
  /** Lucide icon name shown top-right. */
  icon?: string;
  style?: React.CSSProperties;
}

export function StatCard(props: StatCardProps): JSX.Element;
