import React from 'react';
import { Icon } from '../icons/Icon';

/** FilterControl — the listing sidebar filter group: category/city/date/price, each expandable. */
export function FilterControl({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--border-default)', padding: '16px 0', fontFamily: 'var(--font-sans)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-heading)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <Icon name={icon} size={16} color="var(--text-muted)" />}
          {title}
        </span>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} color="var(--text-subtle)" />
      </button>
      {open && <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>}
    </div>
  );
}
