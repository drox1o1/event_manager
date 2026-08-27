import * as React from 'react';

export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Checkbox(props: CheckboxProps): JSX.Element;
