'use client';

import * as React from 'react';
import { DataTable, EmptyState } from '@cyrokx/ui';
import { adminApi, formatINR, formatTimestamp } from '@cyrokx/api-client';
import type { TransactionSummary } from '@cyrokx/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

const STATUS_LOOK: Record<string, { bg: string; fg: string; label: string }> = {
  success: { bg: 'var(--status-success-bg)', fg: 'var(--status-success-text)', label: 'Success' },
  refunded: { bg: 'var(--status-muted-bg)', fg: 'var(--status-muted-text)', label: 'Refunded' },
  failed: { bg: 'var(--status-error-bg)', fg: 'var(--status-error-text)', label: 'Failed' },
  pending: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning-text)', label: 'Pending' },
};

function StatusPill({ status }: { status: string }) {
  const look = STATUS_LOOK[status] ?? STATUS_LOOK.pending;
  return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: look.bg, color: look.fg, fontSize: 12, fontWeight: 600 }}>{look.label}</span>;
}

function TransactionsInner() {
  const token = useRequireAuth();
  const [transactions, setTransactions] = React.useState<TransactionSummary[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    adminApi
      .listTransactions(token, { pageSize: 50 })
      .then((res) => setTransactions(res.transactions))
      .catch(() => setError('Could not load transactions.'));
  }, [token]);

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 24 }}>All transactions</div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {transactions === null ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>Loading…</div>
        ) : transactions.length === 0 ? (
          <EmptyState icon="receipt" title="No transactions yet" description="Ticket purchases across the platform will appear here." />
        ) : (
          <DataTable<TransactionSummary & { id: string }>
            columns={[
              { key: 'order_id', label: 'Order', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{r.order_id.slice(0, 8)}</span> },
              {
                key: 'event_title',
                label: 'Event',
                render: (r) => (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{r.event_title ?? '—'}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.buyer_name}</div>
                  </div>
                ),
              },
              { key: 'total_amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{formatINR(r.total_amount)}</span> },
              { key: 'payment_status', label: 'Status', render: (r) => <StatusPill status={r.payment_status} /> },
              { key: 'created_at', label: 'Date', render: (r) => formatTimestamp(r.created_at) },
            ]}
            rows={transactions.map((t) => ({ ...t, id: t.order_id }))}
          />
        )}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <AdminShell>
      <TransactionsInner />
    </AdminShell>
  );
}
