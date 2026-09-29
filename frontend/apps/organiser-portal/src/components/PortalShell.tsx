'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarShell, Avatar, Button, PageLoader } from '@showtik/ui';
import { useRequireAuth, useAuth } from '@/lib/auth';
import { ApprovalBanner, useOrganiserProfile } from '@/lib/organiser';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: '/dashboard' },
  { key: 'my-events', label: 'My events', icon: 'calendar', href: '/events' },
  { key: 'profile', label: 'Organiser page', icon: 'store', href: '/profile' },
];

/** Wraps every authenticated organiser page in the shared sidebar layout and
 *  enforces the login gate. Renders nothing until auth has resolved. */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const token = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useOrganiserProfile(token);

  if (!token) {
    return <PageLoader tone="dark" />;
  }

  const activeKey = pathname.startsWith('/dashboard') ? 'dashboard' : pathname.startsWith('/profile') ? 'profile' : 'my-events';

  return (
    <SidebarShell
      brandLabel="Showtik"
      navItems={NAV_ITEMS.map(({ key, label, icon }) => ({ key, label, icon }))}
      activeKey={activeKey}
      onBrandClick={() => router.push('/dashboard')}
      onNavigate={(key) => {
        const item = NAV_ITEMS.find((n) => n.key === key);
        if (item) router.push(item.href);
      }}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={profile?.org_name ?? 'Organiser'} size={32} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{profile?.org_name ?? 'Organiser'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{profile ? ({ pending: 'Awaiting approval', verified: 'Approved organiser', suspended: 'Suspended' } as Record<string, string>)[profile.status] : ''}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { logout(); router.replace('/login'); }}
            style={{ color: 'rgba(255,255,255,0.7)', justifyContent: 'flex-start' }}
          >
            Log out
          </Button>
        </div>
      }
    >
      <ApprovalBanner profile={profile} />
      {children}
    </SidebarShell>
  );
}
