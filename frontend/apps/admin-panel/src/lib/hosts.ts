'use client';

import * as React from 'react';
import { adminApi } from '@showtik/api-client';
import type { HostOption } from '@showtik/ui';

/** Approved organisers an admin-created event can be hosted by. */
export function useHostOptions(token: string | null): HostOption[] {
  const [hosts, setHosts] = React.useState<HostOption[]>([]);
  React.useEffect(() => {
    if (!token) return;
    adminApi
      .listOrganisers(token, { status: 'verified' })
      .then((r) => setHosts(r.organisers.map((o) => ({ id: o.id, name: o.org_name }))))
      .catch(() => setHosts([]));
  }, [token]);
  return hosts;
}
