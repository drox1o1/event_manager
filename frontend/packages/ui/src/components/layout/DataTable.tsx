'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  actions?: { onClick: (row: T) => void };
  emptyLabel?: string;
  style?: React.CSSProperties;
}

/** DataTable — generic table with optional row actions; backs attendee lists, transactions, organiser/admin tables. */
export function DataTable<T extends { id?: string | number }>({ columns = [], rows = [], actions, emptyLabel = 'Nothing to show yet', style }: DataTableProps<T>) {
  if (!rows.length) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontFamily: 'var(--font-sans)', fontSize: 14 }}>{emptyLabel}</div>
    );
  }
  return (
    <div style={{ overflowX: 'auto', fontFamily: 'var(--font-sans)', ...style }}>
      <style>{'.showtik-dt-row{transition:background 0.12s ease}.showtik-dt-row:hover{background:var(--color-off-white)}'}</style>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: 'left', padding: '13px 16px', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)', fontWeight: 700, background: 'var(--color-off-white)', borderBottom: '1px solid var(--border-default)' }}>
                {c.label}
              </th>
            ))}
            {actions && <th style={{ background: 'var(--color-off-white)', borderBottom: '1px solid var(--border-default)' }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="showtik-dt-row">
              {columns.map((c) => (
                <td key={c.key} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)', color: 'var(--text-body)' }}>
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
              {actions && (
                <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }} onClick={() => actions.onClick(row)}>
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
