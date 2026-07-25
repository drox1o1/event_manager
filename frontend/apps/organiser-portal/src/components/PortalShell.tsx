'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarShell, Avatar, Button } from '@cyrokx/ui';
import { useRequireAuth, useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: '/dashboard' },
  { key: 'my-events', label: 'My events', icon: 'calendar', href: '/events' },
];

/** Wraps every authenticated organiser page in the shared sidebar layout and
 *  enforces the login gate. Renders nothing until auth has resolved. */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const token = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!token) {
    return <div style={{ padding: 40, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>Loading…</div>;
  }

  const activeKey = pathname.startsWith('/dashboard') ? 'dashboard' : 'my-events';

  return (
    <SidebarShell
      brandLabel="CyRokx"
      navItems={NAV_ITEMS.map(({ key, label, icon }) => ({ key, label, icon }))}
      activeKey={activeKey}
      onNavigate={(key) => {
        const item = NAV_ITEMS.find((n) => n.key === key);
        if (item) router.push(item.href);
      }}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="Organiser" size={32} />
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>Organiser</div>
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
      {children}
    </SidebarShell>
  );
}
