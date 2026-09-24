import { InfoPageView } from '@/components/InfoPageView';

export const metadata = { title: 'About — Showtik' };

export default function AboutPage() {
  return (
    <InfoPageView title="About Showtik">
      <p>Showtik is a live-events platform built for sport — marathons, cycling challenges, football leagues, kabaddi nights — alongside music, comedy and workshops.</p>
      <p>We connect organisers with the people who show up: fast event pages, simple ticketing, and instant confirmation, no account required to buy a ticket.</p>
    </InfoPageView>
  );
}
