'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BasicInfoForm, Icon, LogoMark, PageLoader, useIsMobile } from '@showtik/ui';
import { organiserApi, publicApi } from '@showtik/api-client';
import type { CategorySummary } from '@showtik/api-client';
import { useRequireAuth } from '@/lib/auth';
import { ApprovalBanner, isApproved, useOrganiserProfile } from '@/lib/organiser';

/** Create an event — step 1 (Basic Info). Continue saves a DRAFT and moves
 *  into the step-by-step editor (Media → Tickets → Form → Publish). */
export default function NewEventPage() {
  const token = useRequireAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { profile } = useOrganiserProfile(token);
  const [categories, setCategories] = React.useState<CategorySummary[]>([]);
  const [cities, setCities] = React.useState<string[]>([]);

  React.useEffect(() => {
    publicApi.listCategories().then((r) => setCategories(r.categories)).catch(() => setCategories([]));
    publicApi.getSiteChrome().then((r) => setCities(r.cities)).catch(() => setCities([]));
  }, []);

  if (!token || !profile) return <PageLoader tone="dark" />;
  const approved = isApproved(profile);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-card)', fontFamily: 'var(--font-sans)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: 12, height: 64, padding: '0 20px', background: 'var(--surface-card)', borderBottom: '1px solid var(--border-default)' }}>
        <LogoMark style={{ height: 30 }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--text-heading)' }}>showtik</span>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={() => router.push('/events')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--text-muted)' }}>
          <Icon name="x" size={18} /> Close
        </button>
      </header>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '24px 16px 48px' : '44px 32px 64px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 300px', gap: 48 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 28 : 34, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-heading)', margin: '0 0 28px' }}>Create an event</h1>
          <ApprovalBanner profile={profile} />
          <BasicInfoForm
            categories={categories}
            cities={cities}
            hostLabel={profile.org_name}
            onManageHost={() => router.push('/profile')}
            draftKey={`showtik.eventDraft.${profile.id}`}
            submitLabel="Continue"
            disabled={!approved}
            onSubmit={async (body) => {
              const created = await organiserApi.createEvent(token, body);
              router.push(`/events/${created.event_id}/manage/media`);
            }}
          />
        </div>

        {!isMobile && (
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 96, alignSelf: 'start' }}>
            <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
              <div style={{ background: 'var(--gradient-hero)', color: '#fff', padding: '22px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>How it works</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginTop: 6 }}>Live in 5 steps</div>
              </div>
              <ol style={{ margin: 0, padding: '18px 20px 18px 38px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--text-body)' }}>
                <li><strong>Basic info</strong> — name, venue, date</li>
                <li><strong>Media</strong> — banner, video, photos</li>
                <li><strong>Tickets</strong> — paid, free or donation</li>
                <li><strong>Registration form</strong> — what each participant fills</li>
                <li><strong>Publish</strong> — reviewed by Showtik, then live</li>
              </ol>
            </div>
            <div style={{ padding: 20, borderRadius: 'var(--radius-card)', background: 'var(--color-off-white)', fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}><Icon name="save" size={16} />Your progress is saved</div>
              Everything you type here is kept on this device, and once you continue your event is saved as a draft you can finish any time from <em>My events</em>.
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
