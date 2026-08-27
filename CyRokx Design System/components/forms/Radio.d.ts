import * as React from 'react';

export interface RadioProps {
  label?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  name?: string;
  style?: React.CSSProperties;
}

export function Radio(props: RadioProps): JSX.Element;
