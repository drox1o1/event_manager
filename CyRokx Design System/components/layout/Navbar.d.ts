import * as React from 'react';

export interface NavbarProps {
  categories?: string[];
  city?: string;
  onSearchClick?: () => void;
  style?: React.CSSProperties;
}

export function Navbar(props: NavbarProps): JSX.Element;
