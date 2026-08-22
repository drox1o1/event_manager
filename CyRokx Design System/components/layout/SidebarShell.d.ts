import * as React from 'react';

export interface SidebarNavItem {
  key: string;
  label: string;
  /** Lucide icon name. */
  icon?: string;
}

export interface SidebarShellProps {
  brandLabel?: string;
  navItems: SidebarNavItem[];
  activeKey?: string;
  onNavigate?: (key: string) => void;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function SidebarShell(props: SidebarShellProps): JSX.Element;
