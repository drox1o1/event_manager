import * as React from 'react';

export interface PageHeadingProps {
  title: string;
  description?: React.ReactNode;
  /** Right-aligned actions, e.g. a primary button or search field. */
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}

/** PageHeading — the top-of-page title used across every admin and organiser
 *  screen: bold uppercase display type with the brand accent-kicker bar, an
 *  optional description, and a right-aligned actions slot. Matches the public
 *  site's SectionHeading so the whole product reads as one system. */
export function PageHeading({ title, description, actions, style }: PageHeadingProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap', fontFamily: 'var(--font-sans)', ...style }}>
      <div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', color: 'var(--text-heading)', margin: 0 }}>
          <span aria-hidden style={{ width: 5, height: 24, background: 'var(--gradient-brand)', borderRadius: 3, flex: 'none' }} />
          {title}
        </h1>
        {description && <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, marginLeft: 17 }}>{description}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}
