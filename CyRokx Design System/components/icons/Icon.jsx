import React, { useEffect, useRef } from 'react';

/**
 * Icon — thin wrapper around the Lucide icon set (loaded via CDN, see
 * assets/README or the Iconography section of the root readme). No SVG
 * path data lives in this repo; Lucide's runtime script draws the icon
 * into the <i> placeholder. Pages/cards that use <Icon> must load
 * https://unpkg.com/lucide@latest/dist/umd/lucide.js in <head>.
 */
export function Icon({ name, size = 18, strokeWidth = 1.75, color = 'currentColor', style, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    if (window.lucide && ref.current) {
      window.lucide.createIcons({ nameAttr: 'data-lucide', attrs: {}, icons: window.lucide.icons, context: ref.current.parentElement });
    }
  }, [name]);

  return (
    <i
      ref={ref}
      data-lucide={name}
      style={{ width: size, height: size, display: 'inline-block', color, strokeWidth, ...style }}
      {...rest}
    ></i>
  );
}
