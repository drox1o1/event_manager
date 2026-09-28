'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BasicInfoForm, PageHeading } from '@showtik/ui';
import { adminApi, publicApi } from '@showtik/api-client';
import type { CategorySummary } from '@showtik/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';
import { useHostOptions } from '@/lib/hosts';

/** Super admin creates an event directly — hosted by any approved organiser
 *  or by Showtik itself — then completes it in the step-by-step editor. */
function NewEventInner() {
  const token = useRequireAuth();
  const router = useRouter();
  const hosts = useHostOptions(token);
  const [categories, setCategories] = React.useState<CategorySummary[]>([]);
  const [cities, setCities] = React.useState<string[]>([]);

  React.useEffect(() => {
    publicApi.listCategories().then((r) => setCategories(r.categories)).catch(() => setCategories([]));
    publicApi.getSiteChrome().then((r) => setCities(r.cities)).catch(() => setCities([]));
  }, []);

  if (!token) return null;
  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeading title="Create an event" description="Saved as a draft — add media and tickets next, then publish straight to the site." />
      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 'clamp(18px, 3vw, 32px)' }}>
        <BasicInfoForm
          categories={categories}
          cities={cities}
          hostOptions={hosts}
          draftKey="showtik.admin.eventDraft"
          submitLabel="Continue"
          onSubmit={async (body) => {
            const created = await adminApi.createEvent(token, body);
            router.push(`/events/${created.event_id}/manage/media`);
          }}
        />
      </div>
    </div>
  );
}

export default function AdminNewEventPage() {
  return (
    <AdminShell>
      <NewEventInner />
    </AdminShell>
  );
}
