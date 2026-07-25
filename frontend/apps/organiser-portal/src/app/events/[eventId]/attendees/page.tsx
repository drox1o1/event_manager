'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon, Input, Button, EmptyState } from '@cyrokx/ui';
import { organiserApi, ApiError } from '@cyrokx/api-client';
import type { Attendee } from '@cyrokx/api-client';
import { PortalShell } from '@/components/PortalShell';
import { useRequireAuth } from '@/lib/auth';

function toCsv(rows: Attendee[]): string {
  const header = ['Name', 'Email', 'Ticket tier', 'Checked in'];
  const body = rows.map((a) => [a.buyer_name, a.buyer_email, a.ticket_tier ?? '', a.checked_in ? 'Yes' : 'No']);
  return [header, ...body].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function AttendeesInner() {
  const token = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [attendees, setAttendees] = React.useState<Attendee[] | null>(null);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    organiserApi
      .listAttendees(token, eventId)
      .then((res) => setAttendees(res.attendees))
      .catch((err) => setError(err instanceof ApiError && err.status === 404 ? 'Event not found.' : 'Could not load attendees.'));
  }, [token, eventId]);

  const rows = (attendees ?? []).filter(
    (a) => a.buyer_name.toLowerCase().includes(query.toLowerCase()) || a.buyer_email.toLowerCase().includes(query.toLowerCase())
  );

  const exportCsv = () => {
    if (!attendees) return;
    const blob = new Blob([toCsv(attendees)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendees-${eventId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <button onClick={() => router.push(`/events/${eventId}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        <Icon name="arrow-left" size={15} /> Back to event
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)' }}>Attendees</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            {attendees ? `${attendees.length} registrations · ${attendees.filter((a) => a.checked_in).length} checked in` : 'Loading…'}
          </div>
        </div>
        <Button variant="secondary" onClick={exportCsv} disabled={!attendees || attendees.length === 0}><Icon name="download" size={15} />Export CSV</Button>
      </div>

      <div style={{ width: 300, marginBottom: 20 }}>
        <Input icon="search" placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {attendees === null ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="user-x" title="No attendees yet" description="Registrations will appear here once tickets are sold." />
        ) : (
          <div style={{ overflowX: 'auto', fontFamily: 'var(--font-sans)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Attendee', 'Ticket tier', 'Check-in'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.ticket_id}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{a.buyer_name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{a.buyer_email}</div>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)', color: 'var(--text-body)' }}>{a.ticket_tier ?? '—'}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-pill)', fontSize: 12.5, fontWeight: 600,
                        background: a.checked_in ? 'var(--status-success-bg)' : 'var(--color-muted-bg)',
                        color: a.checked_in ? 'var(--status-success-text)' : 'var(--text-muted)',
                      }}>
                        <Icon name={a.checked_in ? 'check-circle' : 'circle'} size={13} />
                        {a.checked_in ? 'Checked in' : 'Not yet'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AttendeesPage() {
  return (
    <PortalShell>
      <AttendeesInner />
    </PortalShell>
  );
}
