import { InfoPageView } from '@/components/InfoPageView';

export const metadata = { title: 'Press — Showtik' };

export default function PressPage() {
  return (
    <InfoPageView title="Press">
      <p>For press and media enquiries, reach out to <a href="mailto:press@showtik.com" style={{ color: 'var(--text-link)' }}>press@showtik.com</a>.</p>
    </InfoPageView>
  );
}
