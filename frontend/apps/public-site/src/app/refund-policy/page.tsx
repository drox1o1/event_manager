import { InfoPageView } from '@/components/InfoPageView';

export const metadata = { title: 'Refund policy — Showtik' };

export default function RefundPolicyPage() {
  return (
    <InfoPageView title="Refund policy">
      <p>Refund requests can be submitted from your order confirmation page up to 48 hours before the event. Our team reviews every request within 24 hours.</p>
      <p>Approved refunds are returned to your original payment method within 5–7 business days.</p>
    </InfoPageView>
  );
}
