'use client';

import * as React from 'react';
import { Icon, Input, Textarea, Select, Button, PageHeading, OrganiserPageView, useIsMobile } from '@showtik/ui';
import { organiserApi, publicApi, ApiError } from '@showtik/api-client';
import type { OrganiserProfile, OrganiserPublicPage } from '@showtik/api-client';
import { PortalShell } from '@/components/PortalShell';
import { useRequireAuth } from '@/lib/auth';
import { setCachedProfile, useOrganiserProfile } from '@/lib/organiser';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://showtik.in';

type Form = { org_name: string; contact_name: string; bio: string; website_url: string; instagram_url: string; phone: string; city: string };
type Errors = Partial<Record<keyof Form, string>>;

function toForm(p: OrganiserProfile): Form {
  return { org_name: p.org_name, contact_name: p.contact_name, bio: p.bio ?? '', website_url: p.website_url ?? '', instagram_url: p.instagram_url ?? '', phone: p.phone ?? '', city: p.city ?? '' };
}

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.org_name.trim()) e.org_name = 'Enter your organisation name.';
  if (!f.contact_name.trim()) e.contact_name = 'Enter a contact name.';
  if (f.bio.length > 4000) e.bio = 'Keep it under 4000 characters.';
  for (const k of ['website_url', 'instagram_url'] as const) {
    if (f[k] && !/^https?:\/\/\S+\.\S+/.test(f[k])) e[k] = 'Enter a full link starting with https://';
  }
  if (f.phone && !/^[+\d][\d\s-]{6,18}$/.test(f.phone)) e.phone = 'Enter a valid phone number.';
  return e;
}

function ProfileInner() {
  const token = useRequireAuth();
  const isMobile = useIsMobile();
  const { profile } = useOrganiserProfile(token);
  const [form, setForm] = React.useState<Form | null>(null);
  const [images, setImages] = React.useState<{ logo: string | null; cover: string | null }>({ logo: null, cover: null });
  const [files, setFiles] = React.useState<{ logo?: File; cover?: File }>({});
  const [errors, setErrors] = React.useState<Errors>({});
  const [cities, setCities] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [tab, setTab] = React.useState<'edit' | 'preview'>('edit');

  React.useEffect(() => { publicApi.getSiteChrome().then((r) => setCities(r.cities)).catch(() => setCities([])); }, []);
  React.useEffect(() => {
    if (profile && !form) { setForm(toForm(profile)); setImages({ logo: profile.logo_url, cover: profile.cover_url }); }
  }, [profile, form]);

  if (!token || !profile || !form) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  const set = (k: keyof Form, v: string) => { const next = { ...form, [k]: v }; setForm(next); if (Object.keys(errors).length) setErrors(validate(next)); };

  const pick = (kind: 'logo' | 'cover') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setMessage({ tone: 'err', text: 'Choose a JPG/PNG image under 10 MB.' }); return; }
    setFiles((f) => ({ ...f, [kind]: file }));
    setImages((i) => ({ ...i, [kind]: URL.createObjectURL(file) }));
  };

  const save = async () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true); setMessage(null);
    try {
      const uploaded: { logo_url?: string | null; cover_url?: string | null } = {};
      for (const kind of ['logo', 'cover'] as const) {
        const file = files[kind];
        if (file) {
          const { upload_url, image_url } = await organiserApi.createProfileImageUploadUrl(token, kind, file.type || 'image/jpeg');
          await organiserApi.uploadFile(upload_url, file);
          uploaded[`${kind}_url`] = image_url;
        } else if (!images[kind]) {
          uploaded[`${kind}_url`] = null;
        }
      }
      const updated = await organiserApi.updateMe(token, {
        org_name: form.org_name.trim(), contact_name: form.contact_name.trim(), bio: form.bio.trim() || null,
        website_url: form.website_url.trim() || null, instagram_url: form.instagram_url.trim() || null,
        phone: form.phone.trim() || null, city: form.city || null, ...uploaded,
      });
      setCachedProfile(token, updated);
      setFiles({});
      setMessage({ tone: 'ok', text: 'Organiser page saved.' });
    } catch (err) {
      setMessage({ tone: 'err', text: err instanceof ApiError ? err.message : 'Could not save. Please try again.' });
    } finally { setSaving(false); }
  };

  const previewPage: OrganiserPublicPage = {
    id: profile.id, org_name: form.org_name || 'Your organisation', bio: form.bio || null, logo_url: images.logo, cover_url: images.cover,
    website_url: form.website_url || null, instagram_url: form.instagram_url || null, city: form.city || null, member_since: profile.created_at, events: [],
  };
  const publicUrl = `${SITE_URL.replace(/\/+$/, '')}/organisers/${profile.id}`;

  const imagePicker = (kind: 'logo' | 'cover', label: string, hint: string) => (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>{label}</div>
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, cursor: 'pointer', borderRadius: kind === 'logo' ? 20 : 'var(--radius-card)', width: kind === 'logo' ? 110 : '100%', aspectRatio: kind === 'logo' ? '1 / 1' : '4 / 1', border: '1.5px dashed var(--border-default)', background: images[kind] ? `center/cover no-repeat url(${images[kind]})` : 'var(--color-off-white)', color: 'var(--text-muted)', fontSize: 12.5 }}>
        <input type="file" accept="image/*" onChange={pick(kind)} style={{ display: 'none' }} />
        {!images[kind] && <><Icon name="image-plus" size={20} />Upload</>}
      </label>
      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: 'var(--text-subtle)' }}>
        {hint}
        {images[kind] && <button type="button" onClick={() => { setImages((i) => ({ ...i, [kind]: null })); setFiles((f) => ({ ...f, [kind]: undefined })); }} style={{ border: 'none', background: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: 0, fontSize: 12 }}>Remove</button>}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeading
        title="Organiser page"
        description="Your public page on Showtik — buyers see it from every event you host."
        actions={profile.status === 'verified' ? <a href={publicUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><Button variant="secondary"><Icon name="external-link" size={15} />View public page</Button></a> : undefined}
      />

      <div style={{ display: 'inline-flex', background: 'var(--surface-card)', borderRadius: 'var(--radius-pill)', padding: 4, boxShadow: 'var(--shadow-card)', marginBottom: 20 }}>
        {(['edit', 'preview'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', fontWeight: 600, background: tab === t ? 'var(--color-ink)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-body)' }}>
            {t === 'edit' ? 'Edit details' : 'Preview'}
          </button>
        ))}
      </div>

      {message && <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 'var(--radius-control)', background: message.tone === 'ok' ? 'var(--status-success-bg)' : 'var(--status-error-bg)', color: message.tone === 'ok' ? 'var(--status-success-text)' : 'var(--status-error-text)', fontSize: 14, fontWeight: 600 }}>{message.text}</div>}

      {tab === 'edit' ? (
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: isMobile ? 18 : 28, display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 820 }}>
          {imagePicker('cover', 'Cover image', '1600×400 recommended')}
          {imagePicker('logo', 'Logo', 'Square, 400×400')}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <Input label="Organisation name *" value={form.org_name} error={errors.org_name} onChange={(e) => set('org_name', e.target.value)} />
            <Input label="Contact person *" value={form.contact_name} error={errors.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
            <Select label="Based in" value={form.city} placeholder="Choose a city" options={cities} onChange={(e) => set('city', e.target.value)} />
            <Input label="Phone (not shown publicly)" type="tel" value={form.phone} error={errors.phone} onChange={(e) => set('phone', e.target.value)} />
            <Input label="Website" icon="globe" placeholder="https://" value={form.website_url} error={errors.website_url} onChange={(e) => set('website_url', e.target.value)} />
            <Input label="Instagram" icon="instagram" placeholder="https://instagram.com/…" value={form.instagram_url} error={errors.instagram_url} onChange={(e) => set('instagram_url', e.target.value)} />
          </div>
          <Textarea label="About" rows={6} placeholder="Who you are, the events you run, what attendees can expect…" value={form.bio} error={errors.bio} onChange={(e) => set('bio', e.target.value)} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setTab('preview')}><Icon name="eye" size={15} />Preview</Button>
            <Button onClick={save} loading={saving}>Save organiser page</Button>
          </div>
        </div>
      ) : (
        <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-default)' }}>
          <OrganiserPageView page={previewPage} previewLabel="Preview" />
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PortalShell>
      <ProfileInner />
    </PortalShell>
  );
}
