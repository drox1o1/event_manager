import { InfoPageView } from '@/components/InfoPageView';

export const metadata = { title: 'Careers — Showtik' };

export default function CareersPage() {
  return (
    <InfoPageView title="Careers">
      <p>We&apos;re not currently hiring, but we&apos;re always glad to hear from people who love live events and building great products.</p>
      <p>Write to us at <a href="mailto:careers@showtik.com" style={{ color: 'var(--text-link)' }}>careers@showtik.com</a>.</p>
    </InfoPageView>
  );
}
