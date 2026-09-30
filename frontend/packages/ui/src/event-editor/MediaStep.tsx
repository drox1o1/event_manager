'use client';

import * as React from 'react';
import type { OrganiserEventDetail } from '@showtik/api-client';
import { Icon } from '../components/icons/Icon';
import { Input } from '../components/forms/Input';
import { Button } from '../components/forms/Button';
import { Divider, Notice, SaveBar, SectionTitle, SubHeading, checkImage, errMessage } from './ui';
import type { EventEditorApi } from './types';

const MAX_GALLERY = 3;

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

interface StepProps {
  api: EventEditorApi;
  token: string;
  event: OrganiserEventDetail;
  readOnly: boolean;
  onSaved: (goNext: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
}

/** Media — event banner (required to be featured), promo YouTube video, gallery. */
export function MediaStep({ api, token, event, readOnly, onSaved, onDirtyChange }: StepProps) {
  const [banner, setBanner] = React.useState<{ file: File | null; preview: string | null }>({ file: null, preview: event.banner_image_url });
  const [video, setVideo] = React.useState(event.promo_video_url ?? '');
  const [gallery, setGallery] = React.useState<{ id: string; url: string; file?: File }[]>(
    event.gallery_images.map((url, i) => ({ id: `existing-${i}`, url }))
  );
  const [errors, setErrors] = React.useState<{ banner?: string; video?: string; gallery?: string }>({});
  const [saving, setSaving] = React.useState('');
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  const touch = () => setDirty(true);

  const pickBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = checkImage(file);
    if (problem) { setErrors((x) => ({ ...x, banner: problem })); return; }
    setErrors((x) => ({ ...x, banner: undefined }));
    setBanner({ file, preview: URL.createObjectURL(file) });
    touch();
  };

  const pickGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const bad = files.map(checkImage).find(Boolean);
    if (bad) { setErrors((x) => ({ ...x, gallery: bad })); return; }
    const room = MAX_GALLERY - gallery.length;
    if (files.length > room) setErrors((x) => ({ ...x, gallery: `Only ${MAX_GALLERY} photos allowed — extra files were skipped.` }));
    else setErrors((x) => ({ ...x, gallery: undefined }));
    setGallery((g) => [...g, ...files.slice(0, Math.max(room, 0)).map((file) => ({ id: Math.random().toString(36).slice(2), url: URL.createObjectURL(file), file }))]);
    touch();
  };

  const save = async (goNext: boolean) => {
    const next: typeof errors = {};
    if (video.trim() && !youtubeId(video.trim())) next.video = 'Enter a YouTube link, e.g. https://youtube.com/watch?v=…';
    setErrors(next);
    if (Object.keys(next).length) return;
    setApiError(null);
    try {
      let bannerUrl = event.banner_image_url;
      if (banner.file) {
        setSaving('Uploading banner…');
        const { upload_url, banner_image_url } = await api.createBannerUploadUrl(token, event.event_id, banner.file.type || 'image/jpeg');
        await api.uploadFile(upload_url, banner.file);
        bannerUrl = banner_image_url;
      } else if (!banner.preview) {
        bannerUrl = null;
      }
      const galleryChanged = gallery.some((g) => g.file) || gallery.length !== event.gallery_images.length || gallery.some((g, i) => g.url !== event.gallery_images[i]);
      if (galleryChanged) {
        setSaving('Uploading photos…');
        const urls: string[] = [];
        for (const g of gallery) {
          if (g.file) {
            const { upload_url, image_url } = await api.createImageUploadUrl(token, event.event_id, g.file.type || 'image/jpeg');
            await api.uploadFile(upload_url, g.file);
            urls.push(image_url);
          } else {
            urls.push(g.url);
          }
        }
        await api.replaceEventImages(token, event.event_id, urls.map((image_url, sort_order) => ({ image_url, sort_order })));
      }
      setSaving('Saving…');
      await api.updateEvent(token, event.event_id, { banner_image_url: bannerUrl, promo_video_url: video.trim() || null });
      setDirty(false);
      onSaved(goNext);
    } catch (err) {
      setApiError(errMessage(err, 'Could not save media. Please try again.'));
    } finally {
      setSaving('');
    }
  };

  const vid = youtubeId(video.trim());

  return (
    <div>
      <SectionTitle title="Upload event banner" description="This banner will appear everywhere — event page, listings and the homepage." />
      {apiError && <div style={{ marginBottom: 18 }}><Notice tone="error">{apiError}</Notice></div>}
      <label
        style={{
          position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          aspectRatio: '2 / 1', maxHeight: 460, borderRadius: 'var(--radius-card)', overflow: 'hidden', cursor: readOnly ? 'default' : 'pointer',
          border: `1.5px ${banner.preview ? 'solid' : 'dashed'} ${errors.banner ? 'var(--color-error)' : 'var(--border-default)'}`,
          background: banner.preview ? `center/cover no-repeat url(${banner.preview})` : 'var(--color-off-white)',
        }}
      >
        <input type="file" accept="image/*" onChange={pickBanner} disabled={readOnly} style={{ display: 'none' }} />
        {!banner.preview ? (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', fontWeight: 600, color: 'var(--text-heading)' }}>
              <Icon name="camera" size={18} /> Add Banner
            </span>
            <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Max image size 10MB. Recommended dimension: 1200×600px (2:1)</span>
          </>
        ) : !readOnly && (
          <span style={{ position: 'absolute', right: 14, bottom: 14, display: 'flex', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(5,23,71,0.78)', color: '#fff', borderRadius: 'var(--radius-control)', fontSize: 13, fontWeight: 600 }}><Icon name="refresh-cw" size={14} />Replace</span>
            <button type="button" onClick={(e) => { e.preventDefault(); setBanner({ file: null, preview: null }); touch(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(192,57,43,0.9)', color: '#fff', border: 'none', borderRadius: 'var(--radius-control)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Icon name="trash-2" size={14} />Remove</button>
          </span>
        )}
      </label>
      {errors.banner && <div style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 8 }}>{errors.banner}</div>}
      {!banner.preview && <div style={{ marginTop: 12 }}><Notice tone="warning">Events without a banner can&apos;t be featured on the homepage and get far fewer bookings.</Notice></div>}

      <Divider />
      <SubHeading hint="Share a YouTube link to showcase your event in action.">Add a promotional video</SubHeading>
      <Input icon="youtube" placeholder="ex. https://youtube.com/yourvideo" value={video} error={errors.video} disabled={readOnly} onChange={(e) => { setVideo(e.target.value); touch(); }} />
      {vid && (
        <div style={{ marginTop: 14, aspectRatio: '16 / 9', maxWidth: 520, borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
          <iframe title="Promo video preview" src={`https://www.youtube-nocookie.com/embed/${vid}`} style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen />
        </div>
      )}

      <Divider />
      <SubHeading hint={`This media will appear under the gallery section. Up to ${MAX_GALLERY} photos.`}>Upload media</SubHeading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {gallery.map((g) => (
          <div key={g.id} style={{ position: 'relative', aspectRatio: '4 / 3', borderRadius: 'var(--radius-control)', overflow: 'hidden', border: '1px solid var(--border-default)', background: `center/cover no-repeat url(${g.url})` }}>
            {!readOnly && (
              <button type="button" aria-label="Remove photo" onClick={() => { setGallery((x) => x.filter((y) => y.id !== g.id)); touch(); }} style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(5,23,71,0.78)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        ))}
        {!readOnly && gallery.length < MAX_GALLERY && (
          <label style={{ aspectRatio: '4 / 3', borderRadius: 'var(--radius-control)', border: '1.5px dashed var(--border-default)', background: 'var(--color-off-white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>
            <input type="file" accept="image/*" multiple onChange={pickGallery} style={{ display: 'none' }} />
            <Icon name="image-plus" size={22} /> Add photos
          </label>
        )}
      </div>
      {errors.gallery && <div style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 8 }}>{errors.gallery}</div>}

      {!readOnly && (
        <SaveBar>
          {saving && <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{saving}</span>}
          <Button variant="secondary" onClick={() => save(false)} loading={!!saving} disabled={!dirty}>Save</Button>
          <Button onClick={() => save(true)} loading={!!saving}>Save &amp; continue</Button>
        </SaveBar>
      )}
    </div>
  );
}
