'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Stepper, Input, Textarea, Select, Button, Badge } from '@cyrokx/ui';
import { organiserApi, publicApi, ApiError } from '@cyrokx/api-client';
import type { CategorySummary } from '@cyrokx/api-client';

const STEPS = ['Details', 'Date & venue', 'Ticket tiers', 'Images', 'Review & submit'];

interface TierDraft {
  id: string;
  name: string;
  price: string;
  quantity: string;
}

function emptyTier(index: number): TierDraft {
  return { id: `tier-${index}`, name: '', price: '', quantity: '' };
}

export interface CreateEventFormProps {
  token: string;
}

/** CreateEvent — multi-step organiser flow. On submit: create the event,
 *  bulk-create ticket tiers, attach the banner (if uploaded), then submit for
 *  review — all against authenticated_api. */
export function CreateEventForm({ token }: CreateEventFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [categories, setCategories] = React.useState<CategorySummary[]>([]);
  const [details, setDetails] = React.useState({ title: '', categoryId: '', description: '' });
  const [venue, setVenue] = React.useState({ date: '', time: '', name: '', address: '', city: '', capacity: '' });
  const [tiers, setTiers] = React.useState<TierDraft[]>([{ ...emptyTier(0), name: 'Early Bird', price: '499', quantity: '100' }]);
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    publicApi.listCategories().then((res) => setCategories(res.categories)).catch(() => setCategories([]));
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const updateTier = (id: string, key: keyof TierDraft, value: string) =>
    setTiers((list) => list.map((t) => (t.id === id ? { ...t, [key]: value } : t)));

  const onPickBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const created = await organiserApi.createEvent(token, {
        title: details.title,
        category_id: details.categoryId,
        description: details.description,
        event_date: venue.date,
        event_time: venue.time.length === 5 ? `${venue.time}:00` : venue.time,
        venue_name: venue.name,
        venue_address: venue.address,
        city: venue.city,
        capacity: Number(venue.capacity),
      });
      const eventId = created.event_id;

      const validTiers = tiers
        .filter((t) => t.name.trim() && t.price !== '' && t.quantity !== '')
        .map((t) => ({ name: t.name, price: t.price, quantity_total: Number(t.quantity) }));
      if (validTiers.length > 0) {
        await organiserApi.createTicketTiers(token, eventId, validTiers);
      }

      if (bannerFile) {
        const { upload_url, banner_image_url } = await organiserApi.createBannerUploadUrl(token, eventId);
        await organiserApi.uploadBannerFile(upload_url, bannerFile);
        await organiserApi.updateEvent(token, eventId, { banner_image_url });
      }

      await organiserApi.submitEvent(token, eventId);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit your event. Please try again.');
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Icon name="check" size={30} strokeWidth={2.5} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Submitted for review</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
          {details.title || 'Your event'} is now <Badge status="review" /> with our moderation team. We&apos;ll review it within 24 hours.
        </div>
        <Button onClick={() => router.push('/events')}>Back to my events</Button>
      </div>
    );
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const selectedCategoryName = categories.find((c) => c.id === details.categoryId)?.name ?? '—';

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)' }}>Create event</div>
        <button onClick={() => router.push('/events')} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={20} /></button>
      </div>

      <Stepper steps={STEPS} activeIndex={step} style={{ marginBottom: 32 }} />

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 28 }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Input label="Event title" placeholder="Jazz Night at The Terrace" value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} />
            <Select label="Category" value={details.categoryId} onChange={(e) => setDetails({ ...details, categoryId: e.target.value })} options={categoryOptions} placeholder="Choose a category" />
            <Textarea label="Description" placeholder="Tell attendees what to expect…" rows={5} value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} />
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
              <Input label="Date" type="date" value={venue.date} onChange={(e) => setVenue({ ...venue, date: e.target.value })} />
              <Input label="Time" type="time" value={venue.time} onChange={(e) => setVenue({ ...venue, time: e.target.value })} />
            </div>
            <Input label="Venue name" placeholder="The Terrace, Bandra" value={venue.name} onChange={(e) => setVenue({ ...venue, name: e.target.value })} />
            <Textarea label="Address" placeholder="Full venue address" rows={3} value={venue.address} onChange={(e) => setVenue({ ...venue, address: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
              <Input label="City" placeholder="Mumbai" value={venue.city} onChange={(e) => setVenue({ ...venue, city: e.target.value })} />
              <Input label="Capacity" type="number" placeholder="200" value={venue.capacity} onChange={(e) => setVenue({ ...venue, capacity: e.target.value })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            {tiers.map((t, i) => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 0.9fr auto', gap: 12, alignItems: 'end', marginBottom: 18, paddingBottom: 18, borderBottom: i < tiers.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                <Input label="Tier name" placeholder="VIP" value={t.name} onChange={(e) => updateTier(t.id, 'name', e.target.value)} />
                <Input label="Price (₹)" type="number" placeholder="999" value={t.price} onChange={(e) => updateTier(t.id, 'price', e.target.value)} />
                <Input label="Quantity" type="number" placeholder="100" value={t.quantity} onChange={(e) => updateTier(t.id, 'quantity', e.target.value)} />
                <button onClick={() => setTiers(tiers.filter((x) => x.id !== t.id))} disabled={tiers.length === 1} style={{ height: 44, width: 44, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'none', color: 'var(--text-subtle)', cursor: tiers.length === 1 ? 'not-allowed' : 'pointer' }}>
                  <Icon name="trash-2" size={16} />
                </button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setTiers([...tiers, emptyTier(tiers.length)])}><Icon name="plus" size={15} />Add tier</Button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>Event banner</div>
            <label
              style={{
                display: 'flex', aspectRatio: '16/6', borderRadius: 'var(--radius-card)',
                border: `1.5px dashed ${bannerPreview ? 'var(--color-accent)' : 'var(--border-default)'}`,
                background: bannerPreview ? `center/cover no-repeat url(${bannerPreview})` : 'var(--color-off-white)',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-subtle)',
              }}
            >
              <input type="file" accept="image/*" onChange={onPickBanner} style={{ display: 'none' }} />
              {!bannerPreview && (
                <>
                  <Icon name="upload-cloud" size={28} />
                  <div style={{ fontSize: 13 }}>Click to upload banner — 1600×600 recommended</div>
                </>
              )}
            </label>
            {bannerPreview && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{bannerFile?.name} — click the image to replace</div>}
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ReviewRow label="Title" value={details.title || '—'} />
            <ReviewRow label="Category" value={selectedCategoryName} />
            <ReviewRow label="When" value={venue.date && venue.time ? `${venue.date} at ${venue.time}` : '—'} />
            <ReviewRow label="Venue" value={venue.name ? `${venue.name}, ${venue.city}` : '—'} />
            <ReviewRow label="Capacity" value={venue.capacity || '—'} />
            <ReviewRow label="Ticket tiers" value={`${tiers.filter((t) => t.name.trim()).length} tier(s) configured`} />
            <ReviewRow label="Banner" value={bannerFile ? 'Uploaded' : 'Not uploaded'} />
            {error && <div style={{ fontSize: 13, color: 'var(--color-error)' }}>{error}</div>}
            <div style={{ background: 'var(--color-off-white)', borderRadius: 'var(--radius-control)', padding: 14, fontSize: 13, color: 'var(--text-muted)' }}>
              Submitting sends this event to our moderation team. We&apos;ll review it within 24 hours before it goes live.
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button variant="ghost" onClick={step === 0 ? () => router.push('/events') : back}>{step === 0 ? 'Cancel' : 'Back'}</Button>
        {step < STEPS.length - 1
          ? <Button onClick={next} disabled={step === 0 && (!details.title || !details.categoryId)}>Continue</Button>
          : <Button onClick={submit} loading={submitting}>Submit for review</Button>}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border-default)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text-heading)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
