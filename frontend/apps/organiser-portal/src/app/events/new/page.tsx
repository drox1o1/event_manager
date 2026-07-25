'use client';

import { PortalShell } from '@/components/PortalShell';
import { CreateEventForm } from '@/components/CreateEventForm';
import { useRequireAuth } from '@/lib/auth';

function NewEventInner() {
  const token = useRequireAuth();
  if (!token) return null;
  return <CreateEventForm token={token} />;
}

export default function NewEventPage() {
  return (
    <PortalShell>
      <NewEventInner />
    </PortalShell>
  );
}
