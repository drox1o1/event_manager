'use client';

import * as React from 'react';
import { Badge, Button, DataTable, EmptyState, Modal, Textarea } from '@cyrokx/ui';
import type { BadgeStatus } from '@cyrokx/ui';
import { adminApi, formatINR, formatTimestamp, ApiError } from '@cyrokx/api-client';
import type { RefundSummary } from '@cyrokx/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

function refundBadge(status: string): { status: BadgeStatus; label: string } {
  if (status === 'approved') return { status: 'approved', label: 'Refunded' };
  if (status === 'rejected') return { status: 'rejected', label: 'Rejected' };
  return { status: 'review', label: 'Pending' };
}

function RefundsInner() {
  const token = useRequireAuth();
  const [refunds, setRefunds] = React.useState<RefundSummary[] | null>(null);
  const [active, setActive] = React.useState<RefundSummary | null>(null);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!token) return;
    adminApi
      .listRefunds(token)
      .then((res) => setRefunds(res.refunds))
      .catch(() => setError('Could not load refund requests.'));
  }, [token]);

  React.useEffect(load, [load]);

  const closeModal = () => { setActive(null); setRejecting(false); setReason(''); };

  const approve = async () => {
    if (!token || !active) return;
    setBusy(true);
    try {
      await adminApi.approveRefund(token, active.refund_request_id);
      closeModal();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve refund.');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!token || !active || !reason.trim()) return;
    setBusy(true);
    try {
      await adminApi.rejectRefund(token, active.refund_request_id, { reason });
      closeModal();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reject refund.');
    } finally {
      setBusy(false);
    }
  };

  const pending = refunds?.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Refund management</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
          {refunds === null ? 'Loading…' : `${pending} refund request${pending === 1 ? '' : 's'} awaiting a decision`}
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {refunds === null ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>Loading…</div>
        ) : refunds.length === 0 ? (
          <EmptyState icon="rotate-ccw" title="No refund requests" description="Buyer-initiated refund requests will show up here." />
        ) : (
          <DataTable<RefundSummary & { id: string }>
            columns={[
              { key: 'order_id', label: 'Order', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{r.order_id.slice(0, 8)}</span> },
              { key: 'buyer_name', label: 'Buyer', render: (r) => r.buyer_name ?? '—' },
              { key: 'amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{formatINR(r.amount)}</span> },
              { key: 'reason', label: 'Reason given' },
              { key: 'requested_at', label: 'Requested', render: (r) => formatTimestamp(r.requested_at) },
              {
                key: 'status',
                label: 'Status',
                render: (r) => {
                  const b = refundBadge(r.status);
                  return <Badge status={b.status}>{b.label}</Badge>;
                },
              },
              {
                key: 'actions',
                label: '',
                render: (r) =>
                  r.status === 'pending' ? (
                    <Button size="sm" variant="secondary" onClick={() => { setActive(r); setRejecting(false); setReason(''); }}>Review</Button>
                  ) : null,
              },
            ]}
            rows={refunds.map((r) => ({ ...r, id: r.refund_request_id }))}
          />
        )}
      </div>

      {active && (
        <Modal
          title={`Refund request — ${active.order_id.slice(0, 8)}`}
          open={!!active}
          onClose={closeModal}
          width={480}
          footer={
            rejecting ? (
              <>
                <Button variant="ghost" onClick={() => setRejecting(false)}>Back</Button>
                <Button variant="destructive" disabled={!reason.trim()} loading={busy} onClick={reject}>Confirm rejection</Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={() => setRejecting(true)}>Reject</Button>
                <Button loading={busy} onClick={approve}>Approve refund</Button>
              </>
            )
          }
        >
          {rejecting ? (
            <Textarea label="Reason for rejection" placeholder="Tell the buyer why this refund isn't approved…" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <DetailRow label="Buyer" value={active.buyer_name ?? '—'} />
              <DetailRow label="Amount" value={formatINR(active.amount)} />
              <DetailRow label="Reason given" value={active.reason} />
              <DetailRow label="Requested" value={formatTimestamp(active.requested_at)} />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, paddingBottom: 10, borderBottom: '1px solid var(--border-default)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-heading)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function RefundsPage() {
  return (
    <AdminShell>
      <RefundsInner />
    </AdminShell>
  );
}
