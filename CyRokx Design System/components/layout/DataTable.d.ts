import * as React from 'react';

export interface DataTableColumn {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: any[];
  actions?: { onClick: (row: any) => void };
  emptyLabel?: string;
  style?: React.CSSProperties;
}

export function DataTable(props: DataTableProps): JSX.Element;
