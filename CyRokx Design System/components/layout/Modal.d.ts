import * as React from 'react';

export interface ModalProps {
  open?: boolean;
  title: string;
  children?: React.ReactNode;
  /** Typically a row of <Button>s, right-aligned. */
  footer?: React.ReactNode;
  onClose?: () => void;
  width?: number;
}

export function Modal(props: ModalProps): JSX.Element;
