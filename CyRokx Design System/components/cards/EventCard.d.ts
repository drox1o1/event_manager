import * as React from 'react';

export interface EventCardProps {
  image?: string;
  title: string;
  date: string;
  city: string;
  priceFrom: string;
  category?: string;
  soldOut?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function EventCard(props: EventCardProps): JSX.Element;
