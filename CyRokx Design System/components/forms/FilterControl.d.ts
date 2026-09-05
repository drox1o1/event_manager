import * as React from 'react';

export interface FilterControlProps {
  title: string;
  /** Lucide icon name shown before the title. */
  icon?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export function FilterControl(props: FilterControlProps): JSX.Element;
