'use client';

import * as React from 'react';

export interface DirtyGuardContextValue {
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
}

const DirtyGuardContext = React.createContext<DirtyGuardContextValue>({ dirty: false, setDirty: () => {} });

export function DirtyGuardProvider({ value, children }: { value: DirtyGuardContextValue; children: React.ReactNode }) {
  return <DirtyGuardContext.Provider value={value}>{children}</DirtyGuardContext.Provider>;
}

/** useDirtyGuard -- lets a page inside a shell (e.g. AdminShell) report that
 *  it has unsaved changes. The shell then confirms before navigating away
 *  (sidebar nav "tabs") and warns on browser tab close/refresh. Call
 *  `setDirty(true)` when the draft diverges from the last-saved snapshot and
 *  `setDirty(false)` right after a successful save or on fresh load. */
export function useDirtyGuard(): DirtyGuardContextValue {
  return React.useContext(DirtyGuardContext);
}
