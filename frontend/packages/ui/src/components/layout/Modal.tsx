'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';

export interface ModalProps {
  open?: boolean;
  title: string;
  children?: React.ReactNode;
  /** Typically a row of <Button>s, right-aligned. */
  footer?: React.ReactNode;
  onClose?: () => void;
  width?: number;
}

/** Modal — shell for confirm/form/detail dialogs. Renders its own overlay; mount at the root. */
export function Modal({ open = true, title, children, footer, onClose, width = 480 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--surface-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: 'var(--font-sans)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflow: 'auto',
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-modal)',
          boxShadow: 'var(--shadow-modal)',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</div>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}>
              <Icon name="x" size={20} />
            </button>
          )}
        </div>
        <div style={{ color: 'var(--text-body)', fontSize: 15, lineHeight: 1.5 }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>{footer}</div>}
      </div>
    </div>
  );
}
