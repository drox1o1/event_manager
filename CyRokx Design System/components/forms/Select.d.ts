import * as React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: (SelectOption | string)[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  style?: React.CSSProperties;
}

export function Select(props: SelectProps): JSX.Element;
