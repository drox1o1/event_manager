import React from 'react';
import { Icon } from '../icons/Icon';

/** DataTable — generic table with optional row actions; backs attendee lists, transactions, organiser/admin tables. */
export function DataTable({ columns = [], rows = [], actions, emptyLabel = 'Nothing to show yet', style }) {
  if (!rows.length) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontFamily: 'var(--font-sans)', fontSize: 14 }}>{emptyLabel}</div>
    );
  }
  return (
    <div style={{ overflowX: 'auto', fontFamily: 'var(--font-sans)', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)' }}>
                {c.label}
              </th>
            ))}
            {actions && <th style={{ borderBottom: '1px solid var(--border-default)' }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)', color: 'var(--text-body)' }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
              {actions && (
                <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }} onClick={() => actions.onClick && actions.onClick(row)}>
                    <Icon name="more-horizontal" size={18} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
