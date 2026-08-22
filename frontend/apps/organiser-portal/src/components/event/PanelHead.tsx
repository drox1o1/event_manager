import * as React from 'react';

/** Shared panel header used across every event-workspace tab: a title, an
 *  optional subtitle, and a slot for actions aligned to the right. Ported from
 *  the design kit's `PanelHead` (ui_kits/organiser-portal). */
export function PanelHead({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children && <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>{children}</div>}
    </div>
  );
}
