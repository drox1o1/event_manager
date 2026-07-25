'use client';

import * as React from 'react';
import { Input, Avatar, Button, DataTable, EmptyState } from '@cyrokx/ui';
import { adminApi, formatTimestamp, ApiError } from '@cyrokx/api-client';
import type { OrganiserSummary } from '@cyrokx/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

const STATUS_LOOK: Record<string, { bg: string; fg: string; label: string }> = {
  verified: { bg: 'var(--status-success-bg)', fg: 'var(--status-success-text)', label: 'Verified' },
  pending: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning-text)', label: 'Pending' },
  suspended: { bg: 'var(--status-error-bg)', fg: 'var(--status-error-text)', label: 'Suspended' },
};

function StatusPill({ status }: { status: string }) {
  const look = STATUS_LOOK[status] ?? STATUS_LOOK.pending;
  return <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: look.bg, color: look.fg, fontSize: 12, fontWeight: 600 }}>{look.label}</span>;
}

function OrganisersInner() {
  const token = useRequireAuth();
  const [organisers, setOrganisers] = React.useState<OrganiserSummary[] | null>(null);
  const [query, setQuery] = React.useState('');
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!token) return;
    adminApi
      .listOrganisers(token)
      .then((res) => setOrganisers(res.organisers))
      .catch(() => setError('Could not load organisers.'));
  }, [token]);

  React.useEffect(load, [load]);

  const act = async (organiserId: string, action: 'suspend' | 'reactivate') => {
    if (!token) return;
    setBusyId(organiserId);
    setError(null);
    try {
      if (action === 'suspend') await adminApi.suspendOrganiser(token, organiserId);
      else await adminApi.reactivateOrganiser(token, organiserId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update organiser.');
    } finally {
      setBusyId(null);
    }
  };

  const rows = (organisers ?? []).filter(
    (o) => o.org_name.toLowerCase().includes(query.toLowerCase()) || o.contact_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Organiser management</div>
        <div style={{ width: 260 }}>
          <Input icon="search" placeholder="Search organisers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {organisers === null ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="user-x" title="No organisers found" description="Organisers appear here once they sign up." />
        ) : (
          <DataTable<OrganiserSummary>
            columns={[
              {
                key: 'org_name',
                label: 'Organiser',
                render: (r) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={r.contact_name} size={34} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.org_name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.contact_name} · {r.email}</div>
                    </div>
                  </div>
                ),
              },
              { key: 'created_at', label: 'Joined', render: (r) => formatTimestamp(r.created_at) },
              { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {r.status !== 'suspended' ? (
                      <Button variant="destructive" size="sm" loading={busyId === r.id} onClick={() => act(r.id, 'suspend')}>Suspend</Button>
                    ) : (
                      <Button variant="secondary" size="sm" loading={busyId === r.id} onClick={() => act(r.id, 'reactivate')}>Reinstate</Button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={rows}
          />
        )}
      </div>
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
