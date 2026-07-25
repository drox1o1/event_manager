'use client';

import * as React from 'react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

function toPascalCase(kebabName: string): string {
  return kebabName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Icon — thin wrapper around lucide-react, keyed by the same kebab-case
 * `name` the source design kit used with the Lucide CDN script (e.g.
 * "map-pin"). Every consumer calls this one component, so swapping in a
 * bespoke icon set later is contained to this file, per the design system's
 * own readme. Resolving by computed key (rather than static named imports)
 * means the bundler can't tree-shake unused icons -- same tradeoff the
 * original CDN <script> approach had (it loaded the whole Lucide bundle too).
 */
export function Icon({ name, size = 18, strokeWidth = 1.75, color = 'currentColor', style }: IconProps) {
  const componentName = toPascalCase(name) as keyof typeof Icons;
  const LucideIconComponent = Icons[componentName] as LucideIcon | undefined;

  if (!LucideIconComponent) {
    return <span style={{ width: size, height: size, display: 'inline-block', ...style }} />;
  }

  return <LucideIconComponent size={size} strokeWidth={strokeWidth} color={color} style={style} />;
}
