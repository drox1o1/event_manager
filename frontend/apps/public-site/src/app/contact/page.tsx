import { InfoPageView } from '@/components/InfoPageView';

export const metadata = { title: 'Contact us — Showtik' };

export default function ContactPage() {
  return (
    <InfoPageView title="Contact us">
      <p>Email us at <a href="mailto:support@showtik.com" style={{ color: 'var(--text-link)' }}>support@showtik.com</a> and we&apos;ll get back to you within a business day.</p>
    </InfoPageView>
  );
}
