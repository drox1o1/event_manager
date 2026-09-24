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
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-heading)' }}>
          <span aria-hidden style={{ width: 4, height: 18, background: 'var(--gradient-brand)', borderRadius: 2, flex: 'none' }} />
          {title}
        </div>
        {subtitle && <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4, marginLeft: 14 }}>{subtitle}</div>}
      </div>
      {children && <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>{children}</div>}
    </div>
  );
}
