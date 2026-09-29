'use client';

import * as React from 'react';
import { Badge, Button, DataTable, EmptyState, Modal, PageHeading } from '@showtik/ui';
import { adminApi, formatTimestamp, ApiError } from '@showtik/api-client';
import type { OrderQuerySummary } from '@showtik/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

const FILTERS = [
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all', label: 'All' },
] as const;

/** Buyer queries raised from the order page ("Raise a query related to this
 *  transaction"). The team replies by email, then marks them resolved. */
function QueriesInner() {
  const token = useRequireAuth();
  const [filter, setFilter] = React.useState<'open' | 'resolved' | 'all'>('open');
  const [queries, setQueries] = React.useState<OrderQuerySummary[] | null>(null);
  const [active, setActive] = React.useState<OrderQuerySummary | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!token) return;
    setQueries(null);
    adminApi
      .listOrderQueries(token, filter)
      .then((res) => setQueries(res.queries))
      .catch(() => setError('Could not load queries.'));
  }, [token, filter]);

  React.useEffect(load, [load]);

  const resolve = async () => {
    if (!token || !active) return;
    setBusy(true);
    try {
      await adminApi.resolveOrderQuery(token, active.id);
      setActive(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the query.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeading
        title="Transaction queries"
        description="Questions buyers raised about their orders. Reply by email, then mark them resolved."
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{ height: 36, padding: '0 14px', borderRadius: 'var(--radius-pill)', border: `1px solid ${filter === f.key ? 'var(--color-accent)' : 'var(--border-default)'}`, background: filter === f.key ? 'var(--color-accent-tint)' : 'var(--surface-card)', color: filter === f.key ? 'var(--color-accent)' : 'var(--text-body)', fontWeight: 600, cursor: 'pointer' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {queries === null ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>Loading…</div>
        ) : queries.length === 0 ? (
          <EmptyState icon="message-circle-question" title={filter === 'open' ? 'No open queries' : 'No queries'} description="Queries buyers raise from their order page show up here." />
        ) : (
          <DataTable<OrderQuerySummary>
            columns={[
              { key: 'order_code', label: 'Order', render: (q) => <span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{q.order_code}</span> },
              { key: 'event_title', label: 'Event', render: (q) => q.event_title ?? '—' },
              { key: 'buyer_name', label: 'Buyer', render: (q) => <div><div style={{ fontWeight: 600 }}>{q.buyer_name ?? '—'}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q.buyer_email}</div></div> },
              { key: 'category_label', label: 'Type' },
              { key: 'message', label: 'Message', render: (q) => <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 320 }}>{q.message}</span> },
              { key: 'created_at', label: 'Raised', render: (q) => (q.created_at ? formatTimestamp(q.created_at) : '—') },
              { key: 'status', label: 'Status', render: (q) => <Badge status={q.status === 'open' ? 'review' : 'approved'}>{q.status === 'open' ? 'Open' : 'Resolved'}</Badge> },
              { key: 'actions', label: '', render: (q) => <Button size="sm" variant="secondary" onClick={() => setActive(q)}>View</Button> },
            ]}
            rows={queries}
          />
        )}
      </div>

      {active && (
        <Modal
          title={`Query — order ${active.order_code}`}
          open={!!active}
          onClose={() => setActive(null)}
          width={520}
          footer={
            <>
              {active.buyer_email && (
                <a href={`mailto:${active.buyer_email}?subject=${encodeURIComponent(`Your Showtik order ${active.order_code}`)}`} style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 16px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-default)', color: 'var(--text-heading)', fontWeight: 600, textDecoration: 'none' }}>Reply by email</a>
              )}
              {active.status === 'open' && <Button loading={busy} onClick={resolve}>Mark resolved</Button>}
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <Row label="Event" value={active.event_title ?? '—'} />
            <Row label="Order / payment ID" value={active.order_code} />
            <Row label="Transaction ID" value={active.payment_ref ?? '—'} />
            <Row label="Buyer" value={[active.buyer_name, active.buyer_phone, active.buyer_email].filter(Boolean).join(' · ')} />
            <Row label="Type" value={active.category_label} />
            <div style={{ padding: 14, borderRadius: 'var(--radius-control)', background: 'var(--color-off-white)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{active.message}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--text-heading)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function QueriesPage() {
  return (
    <AdminShell>
      <QueriesInner />
    </AdminShell>
  );
}
