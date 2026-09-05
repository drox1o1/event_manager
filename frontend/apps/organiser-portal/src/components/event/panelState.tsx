'use client';

import * as React from 'react';
import { Icon } from '@cyrokx/ui';

/** Gives a Save button transient "Saved" feedback. These event-management
 *  surfaces have no backend endpoints yet (see the CyRokx backend "foundation
 *  pass"), so a save currently only commits to local component state — this at
 *  least closes the interaction loop instead of leaving a dead button. */
export function useSavedFlash(duration = 1600): [boolean, () => void] {
  const [saved, setSaved] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const flash = React.useCallback(() => {
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), duration);
  }, [duration]);

  return [saved, flash];
}

/** Inline note flagging that a panel's data/actions aren't persisted to the
 *  backend yet, so a live-integrated demo doesn't read sample data as real. */
export function NotWiredNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--surface-accent-tint)', borderRadius: 'var(--radius-control)', padding: '10px 14px', marginBottom: 18, fontSize: 12.5, color: 'var(--text-body)' }}>
      <Icon name="info" size={15} color="var(--color-accent)" style={{ marginTop: 1, flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}
