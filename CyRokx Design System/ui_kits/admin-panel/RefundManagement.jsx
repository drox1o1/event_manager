const { Icon, Badge, Button, DataTable, EmptyState, Modal, Textarea } = window.CyRokxDesignSystem_ef2ebf;

const REQUESTS = [
  { id: '#48211', event: 'Indie Rock Live', buyer: 'Ananya Iyer', amount: '₹599', reason: 'Event rescheduled, buyer unavailable', requested: '1 Jul', status: 'pending' },
  { id: '#48198', event: 'Watercolour Workshop', buyer: 'Rohan Mehta', amount: '₹1,200', reason: 'Duplicate booking made by mistake', requested: '30 Jun', status: 'pending' },
  { id: '#48180', event: 'Street Food Fest', buyer: 'Karan Verma', amount: '₹299', reason: 'Payment charged twice', requested: '28 Jun', status: 'approved' },
  { id: '#48166', event: 'Jazz Night at The Terrace', buyer: 'Diya Kulkarni', amount: '₹799', reason: 'Changed mind, requested outside policy window', requested: '26 Jun', status: 'rejected' },
];

const DISPUTES = [
  { id: '#48180', event: 'Street Food Fest', buyer: 'Karan Verma', outcome: 'Refunded in full', resolvedBy: 'Meera Nair', date: '29 Jun' },
  { id: '#48102', event: 'Marathon Expo', buyer: 'Ishaan Bhatt', outcome: 'Refund denied — policy window passed', resolvedBy: 'Meera Nair', date: '18 Jun' },
];

const REFUND_STATUS_LOOK = { pending: 'review', approved: 'approved', rejected: 'rejected' };

/** RefundManagement — initiate or reject buyer refund requests, plus a read-only dispute resolution log. */
function RefundManagement() {
  const [tab, setTab] = React.useState('requests');
  const [requests, setRequests] = React.useState(REQUESTS);
  const [active, setActive] = React.useState(null); // request being reviewed
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState('');

  const pending = requests.filter((r) => r.status === 'pending');

  const decide = (id, status) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    setActive(null);
    setRejecting(false);
    setReason('');
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Refund management</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{pending.length} refund requests awaiting a decision</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ key: 'requests', label: 'Refund requests' }, { key: 'disputes', label: 'Dispute log' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer',
              border: tab === t.key ? 'none' : '1px solid var(--border-default)',
              background: tab === t.key ? 'var(--color-accent)' : 'var(--surface-card)',
              color: tab === t.key ? '#fff' : 'var(--text-body)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {tab === 'requests' && (
          requests.length === 0 ? (
            <EmptyState icon="rotate-ccw" title="No refund requests" description="Buyer-initiated refund requests will show up here." />
          ) : (
            <DataTable
              columns={[
                { key: 'id', label: 'Order' },
                { key: 'event', label: 'Event', render: (r) => (
                  <div><div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{r.event}</div><div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.buyer}</div></div>
                ) },
                { key: 'amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.amount}</span> },
                { key: 'reason', label: 'Reason given' },
                { key: 'requested', label: 'Requested' },
                { key: 'status', label: 'Status', render: (r) => <Badge status={REFUND_STATUS_LOOK[r.status]}>{r.status === 'pending' ? 'Pending' : r.status === 'approved' ? 'Refunded' : 'Rejected'}</Badge> },
                { key: 'actions', label: '', render: (r) => r.status === 'pending' ? (
                  <Button size="sm" variant="secondary" onClick={() => { setActive(r); setRejecting(false); setReason(''); }}>Review</Button>
                ) : null },
              ]}
              rows={requests}
            />
          )
        )}

        {tab === 'disputes' && (
          <DataTable
            columns={[
              { key: 'id', label: 'Order' },
              { key: 'event', label: 'Event', render: (r) => (
                <div><div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{r.event}</div><div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.buyer}</div></div>
              ) },
              { key: 'outcome', label: 'Outcome' },
              { key: 'resolvedBy', label: 'Resolved by' },
              { key: 'date', label: 'Date' },
            ]}
            rows={DISPUTES}
          />
        )}
      </div>

      {active && (
        <Modal title={`Refund request — ${active.id}`} open={!!active} onClose={() => { setActive(null); setRejecting(false); setReason(''); }} width={480}
          footer={
            rejecting ? (
              <React.Fragment>
                <Button variant="ghost" onClick={() => setRejecting(false)}>Back</Button>
                <Button variant="destructive" disabled={!reason.trim()} onClick={() => decide(active.id, 'rejected')}>Confirm rejection</Button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Button variant="destructive" onClick={() => setRejecting(true)}>Reject</Button>
                <Button onClick={() => decide(active.id, 'approved')}>Approve refund</Button>
              </React.Fragment>
            )
          }
        >
          {rejecting ? (
            <Textarea label="Reason for rejection" placeholder="Tell the buyer why this refund isn't approved…" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <RefundDetailRow label="Event" value={active.event} />
              <RefundDetailRow label="Buyer" value={active.buyer} />
              <RefundDetailRow label="Amount" value={active.amount} />
              <RefundDetailRow label="Reason given" value={active.reason} />
              <RefundDetailRow label="Requested" value={active.requested} />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function RefundDetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, paddingBottom: 10, borderBottom: '1px solid var(--border-default)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-heading)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

window.RefundManagement = RefundManagement;
