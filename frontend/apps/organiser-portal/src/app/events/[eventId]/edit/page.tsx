'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon, Input, Textarea, Select, Button } from '@cyrokx/ui';
import { organiserApi, publicApi, ApiError } from '@cyrokx/api-client';
import type { CategorySummary, OrganiserEventDetail } from '@cyrokx/api-client';
import { PortalShell } from '@/components/PortalShell';
import { useRequireAuth } from '@/lib/auth';

const MAX_GALLERY = 3;

/** A gallery slot: either an already-saved image (url only) or a newly picked
 *  file awaiting upload. `preview` drives the thumbnail for both. */
interface GallerySlot {
  url?: string;
  file?: File;
  preview: string;
}

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
  const [gallery, setGallery] = React.useState<GallerySlot[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        setGallery((e.gallery_images ?? []).map((url) => ({ url, preview: url })));
      })
      .catch(() => setError('Could not load this event.'));
  }, [token, eventId]);

  const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    setGallery((g) => [
      ...g,
      ...picked.slice(0, MAX_GALLERY - g.length).map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) =>
    setGallery((g) => {
      const slot = g[idx];
      if (slot?.file) URL.revokeObjectURL(slot.preview);
      return g.filter((_, i) => i !== idx);
    });

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

      // Upload any newly-picked gallery files, then persist the full ordered
      // list (kept + newly uploaded) as the event's gallery images.
      const imageUrls: string[] = [];
      for (const slot of gallery) {
        if (slot.url) {
          imageUrls.push(slot.url);
        } else if (slot.file) {
          const { upload_url, image_url } = await organiserApi.createImageUploadUrl(token, eventId);
          await organiserApi.uploadImageFile(upload_url, slot.file);
          imageUrls.push(image_url);
        }
      }
      await organiserApi.replaceEventImages(token, eventId, imageUrls.map((image_url, sort_order) => ({ image_url, sort_order })));

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

        {/* Gallery images shown under the description on the public event page */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>Description images</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>Add up to {MAX_GALLERY} more images shown under the description ({gallery.length}/{MAX_GALLERY}).</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {gallery.map((slot, i) => (
              <div key={slot.url ?? slot.preview} style={{ position: 'relative', width: 132, height: 88, borderRadius: 'var(--radius-control)', background: `center/cover no-repeat url(${slot.preview})`, border: '1px solid var(--border-default)' }}>
                <button type="button" title="Remove image" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer' }}>
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
            {gallery.length < MAX_GALLERY && (
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: 132, height: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-control)', background: 'var(--color-off-white)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12 }}>
                <Icon name="image-plus" size={20} />Add image
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onPickImages} style={{ display: 'none' }} />
        </div>

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
