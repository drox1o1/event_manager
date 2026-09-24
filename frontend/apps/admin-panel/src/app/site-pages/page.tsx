'use client';

import * as React from 'react';
import { Icon, Input, Textarea, Button, Toast } from '@showtik/ui';
import { adminApi, ApiError } from '@showtik/api-client';
import type { SitePageListItem } from '@showtik/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const card: React.CSSProperties = {
  background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24,
};

function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function SitePagesInner() {
  const token = useRequireAuth();
  const [pages, setPages] = React.useState<SitePageListItem[] | null>(null);
  const [mode, setMode] = React.useState<'list' | 'edit' | 'create'>('list');
  const [activeSlug, setActiveSlug] = React.useState<string | null>(null);
  const [slugDraft, setSlugDraft] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [loadingPage, setLoadingPage] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshList = React.useCallback(() => {
    if (!token) return;
    adminApi.listSitePages(token).then((res) => setPages(res.pages)).catch(() => setError('Could not load site pages.'));
  }, [token]);

  React.useEffect(() => { refreshList(); }, [refreshList]);

  const openEdit = async (slug: string) => {
    if (!token) return;
    setMode('edit');
    setActiveSlug(slug);
    setError(null);
    setLoadingPage(true);
    try {
      const page = await adminApi.getSitePage(token, slug);
      setTitle(page.title);
      setBody(page.body);
    } catch {
      setError('Could not load that page.');
    } finally {
      setLoadingPage(false);
    }
  };

  const openCreate = () => {
    setMode('create');
    setActiveSlug(null);
    setSlugDraft('');
    setTitle('');
    setBody('');
    setError(null);
  };

  const backToList = () => { setMode('list'); setActiveSlug(null); setError(null); };

  const save = async () => {
    if (!token) return;
    const slug = mode === 'create' ? slugify(slugDraft) : activeSlug;
    if (!slug || !SLUG_PATTERN.test(slug)) { setError('Slug must be lowercase letters, numbers and hyphens.'); return; }
    if (!title.trim()) { setError('Give the page a title.'); return; }
    if (!body.trim()) { setError('The page needs some body text.'); return; }

    setSaving(true);
    setError(null);
    try {
      await adminApi.upsertSitePage(token, slug, { title: title.trim(), body: body.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      refreshList();
      setMode('list');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the page.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slug: string) => {
    if (!token) return;
    if (!window.confirm(`Delete the "${slug}" page? This can't be undone.`)) return;
    try {
      await adminApi.deleteSitePage(token, slug);
      refreshList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the page.');
    }
  };

  if (!pages) {
    return <div style={{ color: 'var(--text-muted)' }}>{error ?? 'Loading…'}</div>;
  }

  if (mode !== 'list') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={backToList} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex' }}><Icon name="arrow-left" size={20} /></button>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)' }}>{mode === 'create' ? 'New page' : `Edit /${activeSlug}`}</div>
        </div>

        {error && <div style={{ color: 'var(--color-error)', marginBottom: 16, fontSize: 14 }}>{error}</div>}

        {loadingPage ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div style={card}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mode === 'create' && (
                <Input
                  label="URL slug"
                  placeholder="e.g. shipping-policy"
                  value={slugDraft}
                  onChange={(e) => setSlugDraft(e.target.value)}
                />
              )}
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea label="Body" rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
              <div style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>Blank lines start a new paragraph on the public page.</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Button onClick={save} loading={saving}><Icon name="save" size={16} />Save</Button>
              <Button variant="ghost" onClick={backToList}>Cancel</Button>
            </div>
          </div>
        )}

        {saved && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
            <Toast variant="success" title="Page saved" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Site pages</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            Edit the About, Careers, Press, Help, Contact and Refund policy pages — or add a brand new one.
          </div>
        </div>
        <Button onClick={openCreate}><Icon name="plus" size={16} />New page</Button>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16, fontSize: 14 }}>{error}</div>}

      <div style={card}>
        {pages.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No pages yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pages.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', borderBottom: i < pages.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{p.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 2 }}>/{p.slug}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(p.slug)}><Icon name="pencil" size={14} />Edit</Button>
                <button title="Delete page" onClick={() => remove(p.slug)} style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'var(--surface-card)', color: 'var(--color-error)', cursor: 'pointer' }}>
                  <Icon name="trash-2" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SitePagesPage() {
  return (
    <AdminShell>
      <SitePagesInner />
    </AdminShell>
  );
}
