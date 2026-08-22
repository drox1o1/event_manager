import * as React from 'react';

export interface SearchBarProps {
  keyword?: string;
  onKeywordChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  location?: string;
  onLocationChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: () => void;
  style?: React.CSSProperties;
}

export function SearchBar(props: SearchBarProps): JSX.Element;
