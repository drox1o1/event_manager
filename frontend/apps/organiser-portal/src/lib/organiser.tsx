'use client';

import * as React from 'react';
import { Icon } from '@showtik/ui';
import { organiserApi } from '@showtik/api-client';
import type { OrganiserProfile } from '@showtik/api-client';

// The signed-in organiser's own account (status + public page profile).
// Cached per token so every page in a session shares one fetch.

let cache: { token: string; profile: OrganiserProfile } | null = null;
const listeners = new Set<(p: OrganiserProfile) => void>();

export function setCachedProfile(token: string, profile: OrganiserProfile) {
  cache = { token, profile };
  listeners.forEach((l) => l(profile));
}

export function useOrganiserProfile(token: string | null): { profile: OrganiserProfile | null; reload: () => void } {
  const [profile, setProfile] = React.useState<OrganiserProfile | null>(cache && cache.token === token ? cache.profile : null);

  const reload = React.useCallback(() => {
    if (!token) return;
    organiserApi.getMe(token).then((p) => setCachedProfile(token, p)).catch(() => undefined);
  }, [token]);

  React.useEffect(() => {
    listeners.add(setProfile);
    return () => { listeners.delete(setProfile); };
  }, []);

  React.useEffect(() => {
    if (token && (!cache || cache.token !== token)) reload();
  }, [token, reload]);

  return { profile, reload };
}

export function isApproved(profile: OrganiserProfile | null): boolean {
  return profile?.status === 'verified';
}

/** Explains why an organiser can't create events yet. */
export function ApprovalBanner({ profile }: { profile: OrganiserProfile | null }) {
  if (!profile || profile.status === 'verified') return null;
  const pending = profile.status === 'pending';
  return (
    <div role="status" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 'var(--radius-card)', marginBottom: 24, background: pending ? 'var(--status-warning-bg)' : 'var(--status-error-bg)', color: 'var(--text-body)', fontSize: 14, lineHeight: 1.5 }}>
      <span style={{ color: pending ? 'var(--status-warning-text)' : 'var(--status-error-text)', display: 'flex', marginTop: 1 }}><Icon name={pending ? 'hourglass' : 'ban'} size={18} /></span>
      <div>
        <strong>{pending ? 'Your account is awaiting approval.' : 'Your account is suspended.'}</strong>{' '}
        {pending
          ? 'The Showtik team reviews every new organiser, usually within one business day. You can set up your organiser page meanwhile — event creation unlocks once you’re approved.'
          : profile.status_reason ? `Reason: ${profile.status_reason}. ` : ''}
        {!pending && 'Contact support@showtik.com if you think this is a mistake.'}
      </div>
    </div>
  );
}
