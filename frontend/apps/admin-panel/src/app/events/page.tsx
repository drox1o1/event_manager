'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Input, Badge, Button, DataTable, EmptyState, Modal, PageHeading } from '@showtik/ui';
import type { BadgeStatus } from '@showtik/ui';
import { adminApi, formatEventDate, ApiError } from '@showtik/api-client';
import type { AdminEventSummary } from '@showtik/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

const FILTERS: { label: string; key: string | null }[] = [
  { label: 'All', key: null },
  { label: 'Featured', key: 'featured' },
  { label: 'Live', key: 'live' },
  { label: 'In review', key: 'review' },
  { label: 'Approved', key: 'approved' },
  { label: 'Draft', key: 'draft' },
  { label: 'Rejected', key: 'rejected' },
  { label: 'Unpublished', key: 'deactivated' },
];

function badgeStatus(status: string): BadgeStatus {
  const allowed: BadgeStatus[] = ['draft', 'review', 'approved', 'rejected', 'live', 'soldout'];
  return (allowed as string[]).includes(status) ? (status as BadgeStatus) : 'draft';
}

type FeatureDialog = { event: AdminEventSummary; linkUrl: string; mobileBanner: string; order: string; uploading?: boolean } | null;

function AllEventsInner() {
  const token = useRequireAuth();
  const router = useRouter();
  const [events, setEvents] = React.useState<AdminEventSummary[] | null>(null);
  const [filter, setFilter] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [feature, setFeature] = React.useState<FeatureDialog>(null);

  const load = React.useCallback(() => {
    if (!token) return;
    adminApi
      .listAllEvents(token, { pageSize: 50 })
      .then((res) => setEvents(res.events))
      .catch(() => setError('Could not load events.'));
  }, [token]);

  React.useEffect(load, [load]);

  const run = async (eventId: string, fn: () => Promise<unknown>, fallback: string) => {
    setBusyId(eventId);
    setError(null);
    try { await fn(); load(); }
    catch (err) { setError(err instanceof ApiError ? err.message : fallback); }
    finally { setBusyId(null); }
  };

  const saveFeature = async (isFeatured: boolean) => {
    if (!token || !feature) return;
    const f = feature;
    setFeature(null);
    await run(f.event.event_id, () => adminApi.featureEvent(token, f.event.event_id, {
      is_featured: isFeatured,
      featured_order: Number(f.order) || 0,
      featured_link_url: f.linkUrl.trim() || null,
      featured_mobile_banner_url: f.mobileBanner || null,
    }), 'Could not update featuring.');
  };

  const uploadMobileBanner = async (file: File) => {
    if (!token || !feature) return;
    const current = feature;
    setFeature({ ...current, uploading: true });
    try {
      const { upload_url, image_url } = await adminApi.createImageUploadUrl(token, current.event.event_id, file.type || 'image/jpeg');
      await adminApi.uploadFile(upload_url, file);
      setFeature((f) => (f ? { ...f, mobileBanner: image_url, uploading: false } : f));
    } catch (err) {
      setFeature((f) => (f ? { ...f, uploading: false } : f));
      setError(err instanceof ApiError ? err.message : 'Could not upload the mobile banner.');
    }
  };

  const featuredCount = (events ?? []).filter((e) => e.is_featured).length;
  const rows = (events ?? []).filter((e) => {
    const matchesFilter = !filter || (filter === 'featured' ? e.is_featured : e.status === filter);
    const q = query.toLowerCase();
    const matchesQuery = e.title.toLowerCase().includes(q) || (e.organiser_name ?? '').toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div>
      <PageHeading
        title="All events"
        description={`${featuredCount} featured on the homepage${featuredCount > 1 ? ' (shown as a carousel)' : ''}.`}
        actions={<Button onClick={() => router.push('/events/new')}><Icon name="plus" size={16} />Create event</Button>}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.label}
                onClick={() => setFilter(f.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--color-accent)' : 'var(--border-default)'}`,
                  background: active ? 'var(--color-accent-tint)' : 'var(--surface-card)',
                  color: active ? 'var(--color-accent)' : 'var(--text-body)',
                }}
              >
                {f.key === 'featured' && <Icon name="star" size={13} />}{f.label}
              </button>
            );
          })}
        </div>
        <div style={{ width: 280 }}>
          <Input icon="search" placeholder="Search events, organisers, cities" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
        {events === null ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="calendar-x" title="No events match" description="Try a different filter or search term." action={<Button onClick={() => router.push('/events/new')}>Create event</Button>} />
        ) : (
          <DataTable<AdminEventSummary & { id: string }>
            columns={[
              {
                key: 'title',
                label: 'Event',
                render: (r) => (
                  <div onClick={() => router.push(`/events/${r.event_id}/manage/basic`)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <div style={{ position: 'relative', width: 72, height: 44, borderRadius: 8, flex: 'none', background: r.banner_image_url ? `center/cover no-repeat url(${r.banner_image_url})` : 'var(--gradient-poster)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
                      {!r.banner_image_url && <Icon name="image" size={16} />}
                      {r.is_featured && <span title="Featured on homepage" style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#F5A524', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="star" size={11} /></span>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{r.title}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{formatEventDate(r.event_date)} · {r.city}{r.listing_type === 'private' ? ' · Private' : ''}</div>
                    </div>
                  </div>
                ),
              },
              { key: 'organiser_name', label: 'Host', render: (r) => r.organiser_name ?? <span style={{ color: 'var(--color-accent-secondary)', fontWeight: 600 }}>Showtik</span> },
              { key: 'status', label: 'Status', render: (r) => r.status === 'deactivated' ? <Badge status="draft">Unpublished</Badge> : <Badge status={badgeStatus(r.status)} /> },
              { key: 'tickets_sold', label: 'Registrations', render: (r) => <a href={`/events/${r.event_id}/registrations`} onClick={(e) => { e.preventDefault(); router.push(`/events/${r.event_id}/registrations`); }} style={{ color: 'var(--text-link)', fontWeight: 600, textDecoration: 'none' }}>{r.tickets_sold} / {r.tickets_total}</a> },
              {
                key: 'action',
                label: '',
                render: (r) => (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {(r.status === 'live' || r.status === 'soldout') && (
                      <Button size="sm" variant="secondary" loading={busyId === r.event_id} onClick={() => setFeature({ event: r, linkUrl: r.featured_link_url ?? '', mobileBanner: r.featured_mobile_banner_url ?? '', order: String(r.featured_order ?? 0) })}>
                        <Icon name="star" size={14} />{r.is_featured ? 'Featured' : 'Feature'}
                      </Button>
                    )}
                    {['draft', 'review', 'approved', 'rejected', 'deactivated'].includes(r.status) && (
                      <Button size="sm" loading={busyId === r.event_id} onClick={() => token && run(r.event_id, () => adminApi.publishEvent(token, r.event_id), 'Could not publish.')}><Icon name="rocket" size={14} />Publish</Button>
                    )}
                    {r.status === 'live' && (
                      <Button size="sm" variant="ghost" loading={busyId === r.event_id} onClick={() => token && window.confirm(`Take "${r.title}" off the public site?`) && run(r.event_id, () => adminApi.unpublishEvent(token, r.event_id), 'Could not unpublish.')}>Unpublish</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/events/${r.event_id}/manage/basic`)}><Icon name="pencil" size={14} />Edit</Button>
                  </div>
                ),
              },
            ]}
            rows={rows.map((r) => ({ ...r, id: r.event_id }))}
          />
        )}
      </div>

      <Modal
        open={!!feature}
        title={feature?.event.is_featured ? 'Featured on homepage' : 'Feature on homepage'}
        onClose={() => setFeature(null)}
        width={520}
        footer={
          <>
            {feature?.event.is_featured && <Button variant="destructive" onClick={() => saveFeature(false)}>Remove from homepage</Button>}
            <Button disabled={feature?.uploading} onClick={() => saveFeature(true)}>{feature?.event.is_featured ? 'Save' : 'Feature event'}</Button>
          </>
        }
      >
        {feature && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!feature.event.banner_image_url && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-control)', background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', fontSize: 13.5 }}>This event has no banner yet — add one in the editor first; the homepage hero is image-led.</div>
            )}
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>The homepage hero shows the event banner on its own, with no text on top. Two or more rotate as a carousel.</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 12px', borderRadius: 'var(--radius-control)', background: 'var(--surface-muted, #f4f5f8)' }}>
              <strong>Banner size:</strong> 1920 × 600 px (16:5), key content inside the centre 1600 × 500. Mobile: 1080 × 810 px (4:3). JPG or WebP, under 500 KB.
            </div>
            <Input label="Link when clicked (optional)" placeholder={`/events/${feature.event.event_id}`} value={feature.linkUrl} maxLength={500} onChange={(e) => setFeature({ ...feature, linkUrl: e.target.value })} />
            <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: -8 }}>Leave blank to open the event page. Use a full https:// address for another site.</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>Mobile banner (optional)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {feature.mobileBanner && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={feature.mobileBanner} alt="Mobile banner" style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-default)' }} />
                )}
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text-link)', cursor: 'pointer' }}>
                  <Icon name="upload" size={14} />{feature.uploading ? 'Uploading…' : feature.mobileBanner ? 'Replace' : 'Upload'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={feature.uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadMobileBanner(file); e.target.value = ''; }} />
                </label>
                {feature.mobileBanner && <Button size="sm" variant="ghost" onClick={() => setFeature({ ...feature, mobileBanner: '' })}>Remove</Button>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 6 }}>Without one, phones show the main banner cropped to 4:3.</div>
            </div>
            <Input label="Carousel position" type="number" min={0} value={feature.order} onChange={(e) => setFeature({ ...feature, order: e.target.value })} />
            <div style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>Lower numbers show first.</div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AllEventsPage() {
  return (
    <AdminShell>
      <AllEventsInner />
    </AdminShell>
  );
}
