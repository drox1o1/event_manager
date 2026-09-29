'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarShell, Avatar, Button, PageLoader, Modal, DirtyGuardProvider } from '@showtik/ui';
import { useRequireAuth, useAuth } from '@/lib/auth';

// Admin nav. The Super Admin surface signals its own identity with the
// secondary brand blue on the sidebar (accentColor), per the design system.
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: '/dashboard' },
  { key: 'moderation', label: 'Moderation queue', icon: 'shield-check', href: '/moderation' },
  { key: 'events', label: 'All events', icon: 'calendar', href: '/events' },
  { key: 'organisers', label: 'Organisers', icon: 'building-2', href: '/organisers' },
  { key: 'transactions', label: 'Transactions', icon: 'receipt', href: '/transactions' },
  { key: 'queries', label: 'Transaction queries', icon: 'message-circle-question', href: '/queries' },
  { key: 'refunds', label: 'Refunds', icon: 'rotate-ccw', href: '/refunds' },
  { key: 'homepage', label: 'Homepage', icon: 'layout-template', href: '/homepage' },
  { key: 'categories', label: 'Categories', icon: 'tags', href: '/categories' },
  { key: 'site-pages', label: 'Site pages', icon: 'file-text', href: '/site-pages' },
  { key: 'settings', label: 'Platform settings', icon: 'settings', href: '/settings' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const token = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dirty, setDirty] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  // Real browser tab/window close or refresh while there are unsaved changes.
  React.useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Reset the dirty flag whenever the route actually changes (including a
  // confirmed "leave without saving"), so the next page starts clean.
  React.useEffect(() => { setDirty(false); }, [pathname]);

  if (!token) {
    return <PageLoader tone="dark" />;
  }

  const activeKey = NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.key ?? 'dashboard';

  const attemptNavigate = (href: string) => {
    if (dirty) { setPendingHref(href); return; }
    router.push(href);
  };

  return (
    <DirtyGuardProvider value={{ dirty, setDirty }}>
      <SidebarShell
        brandLabel="Showtik"
        accentColor="var(--color-accent-secondary)"
        navItems={NAV_ITEMS.map(({ key, label, icon }) => ({ key, label, icon }))}
        activeKey={activeKey}
        onBrandClick={() => attemptNavigate('/dashboard')}
        onNavigate={(key) => {
          const item = NAV_ITEMS.find((n) => n.key === key);
          if (item) attemptNavigate(item.href);
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
      <Modal
        open={!!pendingHref}
        title="Unsaved changes"
        onClose={() => setPendingHref(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingHref(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { const href = pendingHref; setPendingHref(null); setDirty(false); if (href) router.push(href); }}
            >
              Leave without saving
            </Button>
          </>
        }
      >
        You have unsaved changes on this page. If you leave now, they&apos;ll be lost.
      </Modal>
    </DirtyGuardProvider>
  );
}
