'use client';

import * as React from 'react';
import { Icon, Input, Button, Toast } from '@showtik/ui';
import { adminApi, ApiError } from '@showtik/api-client';
import type { CategorySummary } from '@showtik/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

interface Draft {
  key: string;
  id?: string;
  name: string;
}

const newKey = () => Math.random().toString(36).slice(2);

const card: React.CSSProperties = {
  background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24,
};

function CategoriesInner() {
  const token = useRequireAuth();
  const [categories, setCategories] = React.useState<Draft[] | null>(null);
  const [newName, setNewName] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    adminApi
      .listCategories(token)
      .then((res) => setCategories(res.categories.map((c: CategorySummary) => ({ key: newKey(), id: c.id, name: c.name }))))
      .catch(() => setError('Could not load categories.'));
  }, [token]);

  const patch = (key: string, name: string) =>
    setCategories((cs) => (cs ? cs.map((c) => (c.key === key ? { ...c, name } : c)) : cs));

  const remove = (key: string) => setCategories((cs) => (cs ? cs.filter((c) => c.key !== key) : cs));

  const move = (key: string, dir: -1 | 1) =>
    setCategories((cs) => {
      if (!cs) return cs;
      const i = cs.findIndex((c) => c.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cs.length) return cs;
      const next = [...cs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addCategory = () => {
    const name = newName.trim();
    if (!name) return;
    setCategories((cs) => [...(cs ?? []), { key: newKey(), name }]);
    setNewName('');
  };

  const save = async () => {
    if (!token || !categories) return;
    const names = categories.map((c) => c.name.trim().toLowerCase());
    if (categories.some((c) => !c.name.trim())) { setError('Every category needs a name.'); return; }
    if (new Set(names).size !== names.length) { setError('Category names must be unique.'); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await adminApi.replaceCategories(token, {
        categories: categories.map((c) => ({ id: c.id, name: c.name.trim() })),
      });
      setCategories(res.categories.map((c) => ({ key: newKey(), id: c.id, name: c.name })));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save categories.');
    } finally {
      setSaving(false);
    }
  };

  if (!categories) {
    return <div style={{ color: 'var(--text-muted)' }}>{error ?? 'Loading…'}</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Categories</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            Add, rename, reorder and remove the categories shown in the nav, homepage grid, and event filters.
          </div>
        </div>
        <Button onClick={save} loading={saving}><Icon name={saved ? 'check' : 'save'} size={16} />{saved ? 'Saved' : 'Save changes'}</Button>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16, fontSize: 14 }}>{error}</div>}

      <div style={card}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 20, maxWidth: 400 }}>
          <div style={{ flex: 1 }}>
            <Input label="Add a category" placeholder="e.g. Theatre" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }} />
          </div>
          <Button variant="secondary" onClick={addCategory} disabled={!newName.trim()}><Icon name="plus" size={15} />Add</Button>
        </div>

        {categories.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No categories yet — add one above.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map((c, i) => (
              <div key={c.key} style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', padding: '10px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <button title="Move up" onClick={() => move(c.key, -1)} disabled={i === 0} style={reorderBtn(i === 0)}><Icon name="chevron-up" size={13} /></button>
                  <button title="Move down" onClick={() => move(c.key, 1)} disabled={i === categories.length - 1} style={reorderBtn(i === categories.length - 1)}><Icon name="chevron-down" size={13} /></button>
                </div>
                <input value={c.name} onChange={(e) => patch(c.key, e.target.value)} style={{ flex: 1, padding: '8px 11px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', fontSize: 14.5, fontFamily: 'var(--font-sans)', color: 'var(--text-heading)', background: 'var(--surface-card)' }} />
                <button title="Delete category" onClick={() => remove(c.key)} style={{ width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'var(--surface-card)', color: 'var(--color-error)', cursor: 'pointer', flexShrink: 0 }}>
                  <Icon name="trash-2" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 14 }}>
          A category can&apos;t be deleted while any event still uses it — remove or recategorise those events first.
        </div>
      </div>

      {saved && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
          <Toast variant="success" title="Categories saved" />
        </div>
      )}
    </div>
  );
}

function reorderBtn(disabled: boolean): React.CSSProperties {
  return { width: 22, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 5, background: 'var(--surface-card)', color: disabled ? 'var(--text-subtle)' : 'var(--text-body)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 };
}

export default function CategoriesPage() {
  return (
    <AdminShell>
      <CategoriesInner />
    </AdminShell>
  );
}
