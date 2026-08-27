import * as React from 'react';

export interface ToastProps {
  variant?: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  onClose?: () => void;
  style?: React.CSSProperties;
}

export function Toast(props: ToastProps): JSX.Element;
