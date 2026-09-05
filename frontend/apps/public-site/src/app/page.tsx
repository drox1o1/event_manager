import { publicApi } from '@cyrokx/api-client';
import type { HomepageContent } from '@cyrokx/api-client';
import { HomepageView } from '@/components/HomepageView';

export const dynamic = 'force-dynamic';

// Fallback layout if the CMS endpoint is unavailable, so the homepage still
// renders. Mirrors the seeded default (category grid + featured + trending).
const FALLBACK: HomepageContent = {
  hero: { eyebrow: 'Discover live events near you', headline: 'Find your next night out', subheadline: null, search_enabled: true },
  banner: { enabled: false, text: null, link_url: null },
  sections: [],
};

export default async function HomePage() {
  const content = await publicApi.getHomepage().catch(() => FALLBACK);
  return <HomepageView content={content} />;
}
