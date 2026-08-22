import * as React from 'react';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function Avatar(props: AvatarProps): JSX.Element;
