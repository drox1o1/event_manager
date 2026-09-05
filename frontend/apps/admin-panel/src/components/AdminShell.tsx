'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarShell, Avatar, Button } from '@cyrokx/ui';
import { useRequireAuth, useAuth } from '@/lib/auth';

// Admin nav. The Super Admin surface signals its own identity with the
// secondary brand blue on the sidebar (accentColor), per the design system.
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: '/dashboard' },
  { key: 'moderation', label: 'Moderation queue', icon: 'shield-check', href: '/moderation' },
  { key: 'events', label: 'All events', icon: 'calendar', href: '/events' },
  { key: 'organisers', label: 'Organisers', icon: 'building-2', href: '/organisers' },
  { key: 'transactions', label: 'Transactions', icon: 'receipt', href: '/transactions' },
  { key: 'refunds', label: 'Refunds', icon: 'rotate-ccw', href: '/refunds' },
  { key: 'homepage', label: 'Homepage', icon: 'layout-template', href: '/homepage' },
  { key: 'settings', label: 'Platform settings', icon: 'settings', href: '/settings' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const token = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!token) {
    return <div style={{ padding: 40, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>Loading…</div>;
  }

  const activeKey = NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.key ?? 'dashboard';

  return (
    <SidebarShell
      brandLabel="CyRokx"
      accentColor="var(--color-accent-secondary)"
      navItems={NAV_ITEMS.map(({ key, label, icon }) => ({ key, label, icon }))}
      activeKey={activeKey}
      onNavigate={(key) => {
        const item = NAV_ITEMS.find((n) => n.key === key);
        if (item) router.push(item.href);
      }}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="Super Admin" size={32} />
            <div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>Super admin</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Platform team</div>
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
      {children}
    </SidebarShell>
  );
}
