import * as React from 'react';

export interface BadgeProps {
  status?: 'draft' | 'review' | 'approved' | 'rejected' | 'live' | 'soldout';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge(props: BadgeProps): JSX.Element;
