'use client';

import * as React from 'react';
import type { PayUFormPayload } from '@showtik/api-client';

/** Hands the browser to PayU's hosted payment page.
 *
 *  PayU only accepts a form POST, so this is the one `<form>` in the public
 *  site. Several details here are load-bearing rather than stylistic:
 *
 *  - `form.submit()`, not `requestSubmit()`. submit() skips constraint
 *    validation and fires no submit event, so nothing React does can intercept
 *    or cancel the handoff.
 *  - The `sent` ref guard is required. React StrictMode runs effects twice in
 *    development, and without it the buyer would be POSTed to PayU twice.
 *  - Fields are rendered verbatim from the server payload. The request hash
 *    covers the amount, so computing or editing any of them client-side would
 *    simply get the transaction rejected.
 *  - No field may be named `submit`, `action` or `method`: HTML form-element
 *    name shadowing would make `ref.current.submit` resolve to the input
 *    instead of the method. PayU's field set is safe today; keep it that way.
 *  - The form must actually render. React cannot submit a form it has not
 *    committed to the DOM, so this can't be built detached and fired.
 */
export function PayURedirectForm({ payu }: { payu: PayUFormPayload }) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const sent = React.useRef(false);

  React.useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    formRef.current?.submit();
  }, []);

  return (
    <form ref={formRef} method="POST" action={payu.action} style={{ display: 'none' }} aria-hidden="true">
      {Object.entries(payu.fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} readOnly />
      ))}
    </form>
  );
}

/** The "don't close this tab" state shown while the POST above is in flight.
 *  Deliberately offers nothing to click: a second attempt would start a second
 *  transaction. */
export function PayURedirectNotice({ amount }: { amount?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 16px' }}>
      <div
        style={{
          width: 34,
          height: 34,
          margin: '0 auto 14px',
          border: '3px solid var(--border-default)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'showtik-spin 0.8s linear infinite',
        }}
      />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text-heading)' }}>
        Taking you to secure payment
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
        {amount ? `Paying ₹${amount} via PayU. ` : ''}Please don’t close this tab.
      </div>
      <style>{'@keyframes showtik-spin { to { transform: rotate(360deg) } }'}</style>
    </div>
  );
}
