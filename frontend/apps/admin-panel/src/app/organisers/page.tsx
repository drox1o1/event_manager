'use client';

import * as React from 'react';
import { Icon, Input, Avatar, Button, DataTable, EmptyState, Modal, Textarea, PageHeading } from '@showtik/ui';
import { adminApi, formatTimestamp, ApiError } from '@showtik/api-client';
import type { OrganiserSummary } from '@showtik/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

const STATUS_LOOK: Record<string, { bg: string; fg: string; label: string }> = {
  verified: { bg: 'var(--status-success-bg)', fg: 'var(--status-success-text)', label: 'Approved' },
  pending: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning-text)', label: 'Awaiting approval' },
  suspended: { bg: 'var(--status-error-bg)', fg: 'var(--status-error-text)', label: 'Suspended' },
};

const FILTERS: { label: string; status: string | null }[] = [
  { label: 'Awaiting approval', status: 'pending' },
  { label: 'Approved', status: 'verified' },
  { label: 'Suspended / rejected', status: 'suspended' },
  { label: 'All', status: null },
];

function StatusPill({ status }: { status: string }) {
  const look = STATUS_LOOK[status] ?? STATUS_LOOK.pending;
  return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: look.bg, color: look.fg, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{look.label}</span>;
}

type Dialog = { kind: 'reject' | 'suspend'; organiser: OrganiserSummary } | null;

function OrganisersInner() {
  const token = useRequireAuth();
  const [organisers, setOrganisers] = React.useState<OrganiserSummary[] | null>(null);
  const [filter, setFilter] = React.useState<string | null>('pending');
  const [query, setQuery] = React.useState('');
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<Dialog>(null);
  const [reason, setReason] = React.useState('');
  const [reasonError, setReasonError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!token) return;
    adminApi
      .listOrganisers(token)
      .then((res) => setOrganisers(res.organisers))
      .catch(() => setError('Could not load organisers.'));
  }, [token]);

  React.useEffect(load, [load]);

  // Default to "Awaiting approval" only when there's something to approve.
  const pendingCount = (organisers ?? []).filter((o) => o.status === 'pending').length;
  React.useEffect(() => {
    if (organisers && pendingCount === 0 && filter === 'pending') setFilter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisers]);

  const act = async (o: OrganiserSummary, action: 'approve' | 'reactivate' | 'reject' | 'suspend', why?: string) => {
    if (!token) return;
    setBusyId(o.id);
    setError(null);
    try {
      if (action === 'approve') await adminApi.approveOrganiser(token, o.id);
      else if (action === 'reactivate') await adminApi.reactivateOrganiser(token, o.id);
      else if (action === 'reject') await adminApi.rejectOrganiser(token, o.id, why ?? '');
      else await adminApi.suspendOrganiser(token, o.id, why);
      setNotice({ approve: `${o.org_name} approved — they can now create events.`, reactivate: `${o.org_name} reinstated.`, reject: `${o.org_name}'s application was rejected.`, suspend: `${o.org_name} suspended.` }[action]);
      setTimeout(() => setNotice(null), 3500);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update organiser.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    if (dialog.kind === 'reject' && !reason.trim()) { setReasonError('Tell the organiser why their application was rejected.'); return; }
    const d = dialog;
    setDialog(null);
    await act(d.organiser, d.kind, reason.trim());
  };

  const q = query.toLowerCase();
  const rows = (organisers ?? []).filter(
    (o) => (!filter || o.status === filter) && [o.org_name, o.contact_name, o.email, o.city ?? ''].some((v) => v.toLowerCase().includes(q))
  );

  return (
    <div>
      <PageHeading
        title="Organisers"
        description="New organisers can't create events until you approve them."
        actions={
          <div style={{ width: 260 }}>
            <Input icon="search" placeholder="Search organisers" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {FILTERS.map((f) => {
          const active = filter === f.status;
          const count = f.status ? (organisers ?? []).filter((o) => o.status === f.status).length : (organisers ?? []).length;
          return (
            <button key={f.label} onClick={() => setFilter(f.status)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? 'var(--color-accent-secondary)' : 'var(--border-default)'}`, background: active ? 'var(--surface-accent-secondary-tint)' : 'var(--surface-card)', color: active ? 'var(--color-accent-secondary)' : 'var(--text-body)' }}>
              {f.label}
              <span style={{ minWidth: 20, padding: '1px 7px', borderRadius: 10, background: f.status === 'pending' && count > 0 ? 'var(--color-accent)' : 'var(--color-muted-bg)', color: f.status === 'pending' && count > 0 ? '#fff' : 'var(--text-muted)', fontSize: 11.5 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {notice && <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 'var(--radius-control)', background: 'var(--status-success-bg)', color: 'var(--status-success-text)', fontWeight: 600, fontSize: 14 }}>{notice}</div>}
      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {organisers === null ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="user-check" title={filter === 'pending' ? 'No one is waiting for approval' : 'No organisers found'} description="Organisers appear here once they sign up." />
        ) : (
          <DataTable<OrganiserSummary>
            columns={[
              {
                key: 'org_name',
                label: 'Organiser',
                render: (r) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={r.org_name} size={36} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.org_name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.contact_name} · {r.email}</div>
                      {r.status_reason && <div style={{ fontSize: 12, color: 'var(--status-error-text)', marginTop: 2 }}>Reason: {r.status_reason}</div>}
                    </div>
                  </div>
                ),
              },
              { key: 'created_at', label: 'Signed up', render: (r) => formatTimestamp(r.created_at) },
              {
                key: 'email_verified',
                label: 'Email',
                render: (r) => r.email_verified
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontSize: 13, fontWeight: 600 }}><Icon name="mail-check" size={14} />Verified</span>
                  : <span style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Unverified</span>,
              },
              { key: 'events_count', label: 'Events', render: (r) => String(r.events_count) },
              { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {r.status === 'pending' && (
                      <>
                        <Button size="sm" loading={busyId === r.id} onClick={() => act(r, 'approve')}><Icon name="check" size={14} />Approve</Button>
                        <Button size="sm" variant="secondary" onClick={() => { setReason(''); setReasonError(null); setDialog({ kind: 'reject', organiser: r }); }}>Reject</Button>
                      </>
                    )}
                    {r.status === 'verified' && (
                      <Button variant="destructive" size="sm" loading={busyId === r.id} onClick={() => { setReason(''); setReasonError(null); setDialog({ kind: 'suspend', organiser: r }); }}>Suspend</Button>
                    )}
                    {r.status === 'suspended' && (
                      <Button variant="secondary" size="sm" loading={busyId === r.id} onClick={() => act(r, 'reactivate')}>{r.approved_at ? 'Reinstate' : 'Approve'}</Button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={rows}
          />
        )}
      </div>

      <Modal
        open={!!dialog}
        title={dialog?.kind === 'reject' ? `Reject ${dialog?.organiser.org_name}?` : `Suspend ${dialog?.organiser.org_name}?`}
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDialog}>{dialog?.kind === 'reject' ? 'Reject application' : 'Suspend organiser'}</Button>
          </>
        }
      >
        <div style={{ marginBottom: 12 }}>
          {dialog?.kind === 'reject'
            ? 'They will not be able to create events. The reason is shown to them in their portal.'
            : 'They will be blocked from logging in and from creating or editing events. Their live events stay online.'}
        </div>
        <Textarea label={dialog?.kind === 'reject' ? 'Reason *' : 'Reason (optional)'} rows={3} value={reason} error={reasonError ?? undefined} onChange={(e) => { setReason(e.target.value); setReasonError(null); }} />
      </Modal>
    </div>
  );
}

export default function OrganisersPage() {
  return (
    <AdminShell>
      <OrganisersInner />
    </AdminShell>
  );
}
