import * as React from 'react';

export interface StepperProps {
  steps: string[];
  activeIndex?: number;
  style?: React.CSSProperties;
}

export function Stepper(props: StepperProps): JSX.Element;
