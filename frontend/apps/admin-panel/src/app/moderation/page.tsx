'use client';

import * as React from 'react';
import { Icon, Badge, Button, Textarea, EmptyState } from '@cyrokx/ui';
import { adminApi, formatTimestamp, ApiError } from '@cyrokx/api-client';
import type { ModerationQueueItem } from '@cyrokx/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

function ModerationInner() {
  const token = useRequireAuth();
  const [items, setItems] = React.useState<ModerationQueueItem[] | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!token) return;
    adminApi
      .getModerationQueue(token)
      .then((res) => {
        setItems(res.events);
        setSelectedId((prev) => prev && res.events.some((e) => e.event_id === prev) ? prev : res.events[0]?.event_id ?? null);
      })
      .catch(() => setError('Could not load the moderation queue.'));
  }, [token]);

  React.useEffect(load, [load]);

  const selected = items?.find((e) => e.event_id === selectedId) ?? null;

  const approve = async () => {
    if (!token || !selected) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.approveEvent(token, selected.event_id);
      resetAndReload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve.');
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!token || !selected || !reason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.rejectEvent(token, selected.event_id, { reason });
      resetAndReload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reject.');
      setBusy(false);
    }
  };

  const resetAndReload = () => {
    setRejecting(false);
    setReason('');
    setBusy(false);
    load();
  };

  const pendingCount = items?.length ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Moderation queue</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
          {items === null ? 'Loading…' : `${pendingCount} event${pendingCount === 1 ? '' : 's'} awaiting review`}
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      {items !== null && pendingCount === 0 ? (
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
          <EmptyState icon="check-circle" title="Queue clear" description="Every submitted event has been reviewed." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(items ?? []).map((e) => {
              const active = e.event_id === selectedId;
              return (
                <div
                  key={e.event_id}
                  onClick={() => { setSelectedId(e.event_id); setRejecting(false); setReason(''); }}
                  style={{
                    background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', padding: 16, cursor: 'pointer',
                    boxShadow: active ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
                    border: `1.5px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{e.title}</div>
                    <Badge status="review" />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 6 }}>
                    Submitted {e.submitted_at ? formatTimestamp(e.submitted_at) : '—'}
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>{selected.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="clock" size={14} /> Submitted {selected.submitted_at ? formatTimestamp(selected.submitted_at) : '—'}
                  </div>
                </div>
                <Badge status="review" />
              </div>

              <div style={{ background: 'var(--color-off-white)', borderRadius: 'var(--radius-control)', padding: 16, fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
                Review this event&apos;s full details in the organiser&apos;s submission, then approve to move it to
                the approved state (publish it from All events), or reject with a reason the organiser will see.
              </div>

              {rejecting ? (
                <div>
                  <Textarea label="Reason for rejection" placeholder="Tell the organiser what needs to change…" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => { setRejecting(false); setReason(''); }}>Cancel</Button>
                    <Button variant="destructive" disabled={!reason.trim()} loading={busy} onClick={reject}>Confirm rejection</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid var(--border-default)' }}>
                  <Button variant="destructive" onClick={() => setRejecting(true)}><Icon name="x" size={15} />Reject</Button>
                  <Button loading={busy} onClick={approve}><Icon name="check" size={15} />Approve</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ModerationPage() {
  return (
    <AdminShell>
      <ModerationInner />
    </AdminShell>
  );
}
