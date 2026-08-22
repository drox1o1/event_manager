import * as React from 'react';

export interface InputProps {
  type?: 'text' | 'email' | 'tel' | 'number' | 'search' | 'date' | 'password';
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  /** Lucide icon name rendered leading inside the field, e.g. "search". */
  icon?: string;
  style?: React.CSSProperties;
}

export function Input(props: InputProps): JSX.Element;
