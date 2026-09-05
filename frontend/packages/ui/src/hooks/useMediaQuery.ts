'use client';

import * as React from 'react';

/**
 * Subscribe to a CSS media query. SSR-safe: returns `false` on the server and
 * on the first client render (so hydration matches), then updates after mount.
 * A brief post-hydration reflow on the matching device is the accepted trade
 * for keeping the whole design system on inline styles (no CSS media queries).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True on phone-width viewports (default breakpoint: below 768px). */
export function useIsMobile(maxWidth = 768): boolean {
  return useMediaQuery(`(max-width: ${maxWidth - 0.02}px)`);
}
