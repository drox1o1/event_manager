const { Icon, Button, EmptyState } = window.CyRokxDesignSystem_ef2ebf;

const TABS = [
  { key: 'notfound', label: '404' },
  { key: 'empty', label: 'Empty search' },
  { key: 'paymentfail', label: 'Payment failed' },
];

/** ErrorStates — 404, empty search results, and payment failure with retry. Grouped as one specimen with a state switcher. */
function ErrorStates({ onBackHome, onRetryPayment }) {
  const [state, setState] = React.useState('notfound');

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: '32px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setState(t.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              border: state === t.key ? 'none' : '1px solid var(--border-default)',
              background: state === t.key ? 'var(--color-accent)' : 'var(--surface-card)',
              color: state === t.key ? '#fff' : 'var(--text-body)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {state === 'notfound' && (
        <div style={{ maxWidth: 440, margin: '0 auto', padding: '48px 0', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-muted, #F0F0F0)', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Icon name="compass" size={30} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px' }}>Page not found</h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 28px' }}>The event or page you're looking for doesn't exist, or may have been removed.</p>
          <Button onClick={() => onBackHome && onBackHome()}>Back to homepage</Button>
        </div>
      )}

      {state === 'empty' && (
        <div style={{ padding: '48px 0' }}>
          <EmptyState
            icon="search"
            title="No events match your search"
            description="Try a different keyword, or widen your date range and filters."
            action={<Button variant="secondary" onClick={() => onBackHome && onBackHome()}>Clear search</Button>}
          />
        </div>
      )}

      {state === 'paymentfail' && (
        <div style={{ maxWidth: 440, margin: '0 auto', padding: '48px 0', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--status-error-bg)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Icon name="x-circle" size={30} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px' }}>Payment failed</h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 28px' }}>Your card was declined. No amount was charged &mdash; your tickets are still held for 10 minutes.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="secondary" onClick={() => onBackHome && onBackHome()}>Use a different card</Button>
            <Button onClick={() => onRetryPayment && onRetryPayment()}>Try again</Button>
          </div>
        </div>
      )}
    </div>
  );
}
window.ErrorStates = ErrorStates;
