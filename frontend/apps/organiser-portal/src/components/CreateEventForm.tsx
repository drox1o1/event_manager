'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Stepper, Input, Textarea, Select, Switch, Button, Badge } from '@showtik/ui';
import { organiserApi, publicApi, ApiError } from '@showtik/api-client';
import type { CategorySummary, FormFieldType, FormFieldInput } from '@showtik/api-client';

const STEPS = ['Details', 'Date & venue', 'Ticket tiers', 'Registration form', 'Images', 'Review & submit'];
const MAX_GALLERY_IMAGES = 3;

interface TierDraft {
  id: string;
  name: string;
  price: string;
  quantity: string;
}

function emptyTier(index: number): TierDraft {
  return { id: `tier-${index}`, name: '', price: '', quantity: '' };
}

interface FieldDraft {
  key: string;
  label: string;
  field_type: FormFieldType;
  options: string[];
  required: boolean;
}

function newKey() {
  return Math.random().toString(36).slice(2);
}

function isChoice(t: FormFieldType) {
  return t === 'single_choice' || t === 'multi_choice';
}

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Textual response' },
  { value: 'single_choice', label: 'Single selection' },
  { value: 'multi_choice', label: 'Multiple choice' },
];

const FIELD_PRESETS: { label: string; field_type: FormFieldType; options?: string[] }[] = [
  { label: 'T-shirt size', field_type: 'single_choice', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { label: 'Blood group', field_type: 'single_choice', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  { label: 'Emergency contact number', field_type: 'text' },
  { label: 'Dietary restrictions', field_type: 'multi_choice', options: ['Vegetarian', 'Vegan', 'Gluten-free', 'None'] },
];

interface GalleryImage {
  id: string;
  file: File;
  preview: string;
}

export interface CreateEventFormProps {
  token: string;
}

/** CreateEvent — multi-step organiser flow. Registration form fields and
 *  gallery images are drafted locally (no eventId exists yet); on submit the
 *  event is created first, then ticket tiers, the registration form, the
 *  banner and the gallery are all attached to it, before it goes to review. */
export function CreateEventForm({ token }: CreateEventFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [categories, setCategories] = React.useState<CategorySummary[]>([]);
  const [details, setDetails] = React.useState({ title: '', categoryId: '', description: '' });
  const [venue, setVenue] = React.useState({ date: '', time: '', name: '', address: '', city: '', capacity: '' });
  const [tiers, setTiers] = React.useState<TierDraft[]>([{ ...emptyTier(0), name: 'Early Bird', price: '499', quantity: '100' }]);
  const [fields, setFields] = React.useState<FieldDraft[]>([]);
  const [draftLabel, setDraftLabel] = React.useState('');
  const [draftType, setDraftType] = React.useState<FormFieldType>('text');
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(null);
  const [galleryImages, setGalleryImages] = React.useState<GalleryImage[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitStage, setSubmitStage] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    publicApi.listCategories().then((res) => setCategories(res.categories)).catch(() => setCategories([]));
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const updateTier = (id: string, key: keyof TierDraft, value: string) =>
    setTiers((list) => list.map((t) => (t.id === id ? { ...t, [key]: value } : t)));

  // --- Registration form builder (local draft; saved after the event is created) ---
  const addField = (preset?: (typeof FIELD_PRESETS)[number]) => {
    const label = preset ? preset.label : draftLabel.trim();
    const field_type = preset ? preset.field_type : draftType;
    if (!label) return;
    setFields((fs) => [...fs, { key: newKey(), label, field_type, options: preset?.options ?? (isChoice(field_type) ? ['Option 1'] : []), required: false }]);
    setDraftLabel('');
    setDraftType('text');
  };
  const removeField = (key: string) => setFields((fs) => fs.filter((f) => f.key !== key));
  const patchField = (key: string, updates: Partial<FieldDraft>) => setFields((fs) => fs.map((f) => (f.key === key ? { ...f, ...updates } : f)));
  const setFieldOption = (key: string, idx: number, value: string) =>
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, options: f.options.map((o, i) => (i === idx ? value : o)) } : f)));
  const addFieldOption = (key: string) =>
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, options: [...f.options, `Option ${f.options.length + 1}`] } : f)));
  const removeFieldOption = (key: string, idx: number) =>
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, options: f.options.filter((_, i) => i !== idx) } : f)));

  const onPickBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const onPickGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setGalleryImages((current) => {
      const room = MAX_GALLERY_IMAGES - current.length;
      const accepted = files.slice(0, Math.max(room, 0));
      const added = accepted.map((file) => ({ id: newKey(), file, preview: URL.createObjectURL(file) }));
      return [...current, ...added];
    });
  };
  const removeGalleryImage = (id: string) => setGalleryImages((imgs) => imgs.filter((g) => g.id !== id));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      setSubmitStage('Creating event…');
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
        setSubmitStage('Adding ticket tiers…');
        await organiserApi.createTicketTiers(token, eventId, validTiers);
      }

      const validFields = fields.filter((f) => f.label.trim());
      if (validFields.length > 0) {
        setSubmitStage('Saving registration form…');
        const payload: FormFieldInput[] = validFields.map((f, i) => ({
          label: f.label.trim(),
          field_type: f.field_type,
          options: isChoice(f.field_type) ? f.options.map((o) => o.trim()).filter(Boolean) : null,
          required: f.required,
          sort_order: i,
        }));
        await organiserApi.replaceFormFields(token, eventId, payload);
      }

      if (bannerFile) {
        setSubmitStage('Uploading banner…');
        const { upload_url, banner_image_url } = await organiserApi.createBannerUploadUrl(token, eventId, bannerFile.type);
        await organiserApi.uploadBannerFile(upload_url, bannerFile);
        await organiserApi.updateEvent(token, eventId, { banner_image_url });
      }

      if (galleryImages.length > 0) {
        setSubmitStage('Uploading gallery photos…');
        const uploaded: { image_url: string; sort_order: number }[] = [];
        for (let i = 0; i < galleryImages.length; i++) {
          const file = galleryImages[i].file;
          const { upload_url, image_url } = await organiserApi.createImageUploadUrl(token, eventId, file.type);
          await organiserApi.uploadImageFile(upload_url, file);
          uploaded.push({ image_url, sort_order: i });
        }
        await organiserApi.replaceEventImages(token, eventId, uploaded);
      }

      setSubmitStage('Submitting for review…');
      await organiserApi.submitEvent(token, eventId);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit your event. Please try again.');
      setSubmitting(false);
      setSubmitStage('');
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
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>Create event</div>
        <button onClick={() => router.push('/events')} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={20} /></button>
      </div>

      <Stepper steps={STEPS} activeIndex={step} style={{ marginBottom: 32, flexWrap: 'wrap', rowGap: 12 }} />

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
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
              Build the form every participant fills in when they register — a T-shirt size, an emergency contact, or anything else your event needs. Optional: skip this step if you don&apos;t need one.
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: '2 1 220px' }}>
                <Input label="Field label" placeholder="e.g. Club / team name" value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} />
              </div>
              <div style={{ flex: '1 1 170px' }}>
                <Select label="Answer type" value={draftType} onChange={(e) => setDraftType(e.target.value as FormFieldType)} options={FIELD_TYPE_OPTIONS} />
              </div>
              <Button onClick={() => addField()} disabled={!draftLabel.trim()}><Icon name="plus" size={16} />Add field</Button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 22 }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginRight: 2 }}>Quick add:</span>
              {FIELD_PRESETS.map((p) => (
                <button key={p.label} onClick={() => addField(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--surface-accent-tint)', color: 'var(--color-accent)', border: 'none', borderRadius: 'var(--radius-control)', padding: '6px 11px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  <Icon name="plus" size={13} />{p.label}
                </button>
              ))}
            </div>

            {fields.length === 0 ? (
              <div style={{ fontSize: 14, color: 'var(--text-subtle)', padding: '16px 0', borderTop: '1px solid var(--border-default)' }}>No fields yet — attendees will only be asked for name, email and phone at checkout.</div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-default)' }}>
                {fields.map((f, i) => (
                  <div key={f.key} style={{ padding: '18px 0', borderBottom: i < fields.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div style={{ flex: '2 1 200px' }}>
                            <Input label={`Field ${i + 1} label`} value={f.label} onChange={(e) => patchField(f.key, { label: e.target.value })} />
                          </div>
                          <div style={{ flex: '1 1 160px' }}>
                            <Select
                              label="Answer type"
                              value={f.field_type}
                              onChange={(e) => patchField(f.key, { field_type: e.target.value as FormFieldType, options: isChoice(e.target.value as FormFieldType) && f.options.length === 0 ? ['Option 1'] : f.options })}
                              options={FIELD_TYPE_OPTIONS}
                            />
                          </div>
                        </div>
                        {isChoice(f.field_type) && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>Options</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {f.options.map((opt, oi) => (
                                <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <input value={opt} onChange={(e) => setFieldOption(f.key, oi, e.target.value)} placeholder={`Option ${oi + 1}`} style={{ flex: 1, padding: '8px 11px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--text-heading)', background: 'var(--surface-card)' }} />
                                  <button onClick={() => removeFieldOption(f.key, oi)} disabled={f.options.length <= 1} style={{ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'var(--surface-card)', color: f.options.length <= 1 ? 'var(--text-subtle)' : 'var(--color-error)', cursor: f.options.length <= 1 ? 'not-allowed' : 'pointer' }}><Icon name="x" size={13} /></button>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => addFieldOption(f.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', color: 'var(--color-accent)', border: 'none', padding: '8px 2px 0', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                              <Icon name="plus" size={13} />Add option
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, paddingTop: 24, flex: 'none' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-body)', cursor: 'pointer' }}>
                          Required <Switch checked={f.required} onChange={(e) => patchField(f.key, { required: e.target.checked })} />
                        </label>
                        <button onClick={() => removeField(f.key)} style={{ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'var(--surface-card)', color: 'var(--color-error)', cursor: 'pointer' }}><Icon name="trash-2" size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>Event banner</div>
            <label
              style={{
                display: 'flex', aspectRatio: '16/6', borderRadius: 'var(--radius-card)',
                border: `1.5px dashed ${bannerPreview ? 'var(--color-accent)' : 'var(--border-default)'}`,
                background: bannerPreview ? `center/cover no-repeat url(${bannerPreview})` : 'var(--color-off-white)',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-subtle)', marginBottom: 28,
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
            {bannerPreview && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -20, marginBottom: 28 }}>{bannerFile?.name} — click the image to replace</div>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>Gallery photos</div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{galleryImages.length}/{MAX_GALLERY_IMAGES}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {galleryImages.map((img) => (
                <div key={img.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 'var(--radius-control)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt="Gallery upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => removeGalleryImage(img.id)}
                    aria-label="Remove photo"
                    style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(5,23,71,0.75)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="x" size={13} />
                  </button>
                </div>
              ))}
              {galleryImages.length < MAX_GALLERY_IMAGES && (
                <label
                  style={{
                    display: 'flex', aspectRatio: '1/1', borderRadius: 'var(--radius-control)',
                    border: '1.5px dashed var(--border-default)', background: 'var(--color-off-white)',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-subtle)',
                  }}
                >
                  <input type="file" accept="image/*" multiple onChange={onPickGallery} style={{ display: 'none' }} />
                  <Icon name="image-plus" size={22} />
                  <div style={{ fontSize: 11.5, textAlign: 'center', padding: '0 8px' }}>Add photos</div>
                </label>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 10 }}>Up to {MAX_GALLERY_IMAGES} photos, shown under the event description. You can select several at once.</div>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ReviewRow label="Title" value={details.title || '—'} />
            <ReviewRow label="Category" value={selectedCategoryName} />
            <ReviewRow label="When" value={venue.date && venue.time ? `${venue.date} at ${venue.time}` : '—'} />
            <ReviewRow label="Venue" value={venue.name ? `${venue.name}, ${venue.city}` : '—'} />
            <ReviewRow label="Capacity" value={venue.capacity || '—'} />
            <ReviewRow label="Ticket tiers" value={`${tiers.filter((t) => t.name.trim()).length} tier(s) configured`} />
            <ReviewRow label="Registration form" value={fields.filter((f) => f.label.trim()).length > 0 ? `${fields.filter((f) => f.label.trim()).length} custom field(s)` : 'Default (name, email, phone)'} />
            <ReviewRow label="Banner" value={bannerFile ? 'Uploaded' : 'Not uploaded'} />
            <ReviewRow label="Gallery" value={galleryImages.length > 0 ? `${galleryImages.length} photo(s)` : 'None'} />
            {error && <div style={{ fontSize: 13, color: 'var(--color-error)' }}>{error}</div>}
            {submitting && submitStage && <div style={{ fontSize: 13, color: 'var(--text-link)', fontWeight: 600 }}>{submitStage}</div>}
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
