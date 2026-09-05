import * as React from 'react';

export interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  disabled?: boolean;
  rows?: number;
  style?: React.CSSProperties;
}

export function Textarea(props: TextareaProps): JSX.Element;
