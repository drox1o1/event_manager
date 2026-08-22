import * as React from 'react';

export interface TicketTierRowProps {
  name: string;
  price: string;
  description?: string;
  available?: boolean;
  remaining?: number;
  quantity?: number;
  onQuantityChange?: (q: number) => void;
  style?: React.CSSProperties;
}

export function TicketTierRow(props: TicketTierRowProps): JSX.Element;
