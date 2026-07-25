import * as React from 'react';
import { Icon } from '../icons/Icon';

export interface StepperProps {
  steps: string[];
  activeIndex?: number;
  style?: React.CSSProperties;
}

/** Stepper — multi-step progress indicator (event creation, checkout). */
export function Stepper({ steps = [], activeIndex = 0, style }: StepperProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--font-sans)', ...style }}>
      {steps.map((label, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  flex: 'none',
                  background: done ? 'var(--color-accent)' : active ? 'var(--color-accent-tint)' : 'var(--color-off-white)',
                  color: done ? '#fff' : active ? 'var(--color-accent)' : 'var(--text-subtle)',
                  border: active ? '1.5px solid var(--color-accent)' : '1.5px solid transparent',
                }}
              >
                {done ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : i + 1}
              </span>
              <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active || done ? 'var(--text-heading)' : 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <span style={{ width: 32, height: 1, background: 'var(--border-default)', margin: '0 12px', flex: 'none' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
