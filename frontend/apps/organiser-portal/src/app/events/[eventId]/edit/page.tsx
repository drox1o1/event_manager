'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon, Input, Textarea, Select, Button } from '@cyrokx/ui';
import { organiserApi, publicApi, ApiError } from '@cyrokx/api-client';
import type { CategorySummary, OrganiserEventDetail } from '@cyrokx/api-client';
import { PortalShell } from '@/components/PortalShell';
import { useRequireAuth } from '@/lib/auth';

function EditEventInner() {
  const token = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [categories, setCategories] = React.useState<CategorySummary[]>([]);
  const [event, setEvent] = React.useState<OrganiserEventDetail | null>(null);
  const [form, setForm] = React.useState({
    title: '', categoryId: '', description: '', date: '', time: '', venueName: '', address: '', city: '', capacity: '',
  });
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    publicApi.listCategories().then((res) => setCategories(res.categories)).catch(() => setCategories([]));
  }, []);

  React.useEffect(() => {
    if (!token) return;
    organiserApi
      .getMyEvent(token, eventId)
      .then((e) => {
        setEvent(e);
        setForm({
          title: e.title,
          categoryId: e.category_id,
          description: e.description,
          date: e.event_date,
          time: e.event_time.slice(0, 5),
          venueName: e.venue_name,
          address: e.venue_address,
          city: e.city,
          capacity: String(e.capacity),
        });
      })
      .catch(() => setError('Could not load this event.'));
  }, [token, eventId]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await organiserApi.updateEvent(token, eventId, {
        title: form.title,
        category_id: form.categoryId,
        description: form.description,
        event_date: form.date,
        event_time: form.time.length === 5 ? `${form.time}:00` : form.time,
        venue_name: form.venueName,
        venue_address: form.address,
        city: form.city,
        capacity: Number(form.capacity),
      });
      router.push(`/events/${eventId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save changes.');
      setSaving(false);
    }
  };

  if (error && !event) return <div style={{ color: 'var(--color-error)' }}>{error}</div>;
  if (!event) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div style={{ maxWidth: 720 }}>
      <button onClick={() => router.push(`/events/${eventId}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        <Icon name="arrow-left" size={15} /> Back to event
      </button>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 24 }}>Edit event</div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input label="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Select label="Category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} options={categoryOptions} placeholder="Choose a category" />
        <Textarea label="Description" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </div>
        <Input label="Venue name" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} />
        <Textarea label="Address" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginTop: 16 }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
        <Button variant="ghost" onClick={() => router.push(`/events/${eventId}`)}>Cancel</Button>
        <Button onClick={save} loading={saving}>Save changes</Button>
      </div>
    </div>
  );
}

export default function EditEventPage() {
  return (
    <PortalShell>
      <EditEventInner />
    </PortalShell>
  );
}
