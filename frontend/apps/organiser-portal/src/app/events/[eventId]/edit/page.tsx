'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageLoader } from '@showtik/ui';

/** Legacy edit route — the step-by-step editor replaced it. */
export default function EditEventRedirect() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  React.useEffect(() => { router.replace(`/events/${params.eventId}/manage/basic`); }, [router, params.eventId]);
  return <PageLoader tone="dark" />;
}
