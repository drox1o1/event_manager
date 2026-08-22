Logged-in dashboard shell — ink sidebar with nav items, content area to the right. Backs both the organiser portal and the super admin panel (same shell, different nav items signal context).

```jsx
<SidebarShell
  navItems={[{ key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' }, { key: 'events', label: 'My Events', icon: 'calendar' }]}
  activeKey="dashboard"
  onNavigate={setPage}
>
  <StatCard label="Revenue" value="₹4.2L" />
</SidebarShell>
```
