import { InfoPageView } from '@/components/InfoPageView';

export const metadata = { title: 'Help centre — Showtik' };

export default function HelpPage() {
  return (
    <InfoPageView title="Help centre">
      <p><strong>Where are my tickets?</strong> Every order confirmation page and email includes your QR-code tickets — no account needed, just the order link.</p>
      <p><strong>Can I get a refund?</strong> Open your order confirmation page and select &ldquo;Request refund&rdquo;. Our team reviews requests within 24 hours.</p>
      <p><strong>Still stuck?</strong> Reach us on the <a href="/contact" style={{ color: 'var(--text-link)' }}>Contact us</a> page.</p>
    </InfoPageView>
  );
}
