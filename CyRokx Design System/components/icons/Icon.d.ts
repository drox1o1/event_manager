import * as React from 'react';

export interface IconProps {
  /** Lucide icon name, e.g. "search", "map-pin", "calendar", "chevron-down". */
  name: string;
  /** Pixel size, applied to both width and height. Default 18. */
  size?: number;
  /** Stroke width matching Lucide's default line weight. Default 1.75. */
  strokeWidth?: number;
  /** CSS color, defaults to currentColor so icons inherit surrounding text color. */
  color?: string;
  style?: React.CSSProperties;
}

export function Icon(props: IconProps): JSX.Element;
