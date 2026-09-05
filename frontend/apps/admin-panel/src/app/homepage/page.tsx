'use client';

import * as React from 'react';
import { Icon, Input, Textarea, Select, Switch, Button, Toast } from '@cyrokx/ui';
import { adminApi, ApiError } from '@cyrokx/api-client';
import type { HomepageConfig, HomepageSection, HomepageSectionType, HomepageSectionMode, AdminEventSummary } from '@cyrokx/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

type DraftSection = Omit<HomepageSection, 'id' | 'sort_order'> & { key: string };

const SECTION_TYPES = [
  { value: 'category_grid', label: 'Category grid' },
  { value: 'featured_events', label: 'Featured events row' },
  { value: 'trending_events', label: 'Trending events row' },
];
const TYPE_LABEL: Record<HomepageSectionType, string> = {
  category_grid: 'Category grid',
  featured_events: 'Featured events row',
  trending_events: 'Trending events row',
};
const TYPE_ICON: Record<HomepageSectionType, string> = {
  category_grid: 'layout-grid',
  featured_events: 'star',
  trending_events: 'flame',
};

const newKey = () => Math.random().toString(36).slice(2);
const isEventSection = (t: HomepageSectionType) => t !== 'category_grid';

const card: React.CSSProperties = {
  background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, marginBottom: 20,
};

function CardHead({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-accent-tint)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={17} />
      </span>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
      </div>
    </div>
  );
}

function HomepageInner() {
  const token = useRequireAuth();
  const [config, setConfig] = React.useState<HomepageConfig | null>(null);
  const [settings, setSettings] = React.useState<HomepageConfig['settings'] | null>(null);
  const [sections, setSections] = React.useState<DraftSection[]>([]);
  const [liveEvents, setLiveEvents] = React.useState<AdminEventSummary[]>([]);
  const [addType, setAddType] = React.useState<HomepageSectionType>('featured_events');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    adminApi
      .getHomepageConfig(token)
      .then((cfg) => {
        setConfig(cfg);
        setSettings(cfg.settings);
        setSections(cfg.sections.map((s) => ({
          key: newKey(), title: s.title, section_type: s.section_type, mode: s.mode, enabled: s.enabled, event_ids: s.event_ids,
        })));
      })
      .catch(() => setError('Could not load the homepage configuration.'));
    adminApi.listAllEvents(token, { status: 'live', pageSize: 50 }).then((r) => setLiveEvents(r.events)).catch(() => setLiveEvents([]));
  }, [token]);

  const eventTitle = React.useMemo(() => {
    const m = new Map(liveEvents.map((e) => [e.event_id, e.title]));
    return (id: string) => m.get(id) ?? 'Event (not live)';
  }, [liveEvents]);

  const setS = <K extends keyof HomepageConfig['settings']>(key: K, value: HomepageConfig['settings'][K]) =>
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

  const patchSection = (key: string, updates: Partial<DraftSection>) =>
    setSections((ss) => ss.map((s) => (s.key === key ? { ...s, ...updates } : s)));

  const move = (key: string, dir: -1 | 1) =>
    setSections((ss) => {
      const i = ss.findIndex((s) => s.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ss.length) return ss;
      const next = [...ss];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const removeSection = (key: string) => setSections((ss) => ss.filter((s) => s.key !== key));

  const addSection = () => {
    setSections((ss) => [
      ...ss,
      { key: newKey(), title: TYPE_LABEL[addType], section_type: addType, mode: 'auto', enabled: true, event_ids: [] },
    ]);
  };

  const toggleCurated = (key: string, eventId: string) =>
    setSections((ss) => ss.map((s) => {
      if (s.key !== key) return s;
      const has = s.event_ids.includes(eventId);
      return { ...s, event_ids: has ? s.event_ids.filter((id) => id !== eventId) : [...s.event_ids, eventId] };
    }));

  const save = async () => {
    if (!token || !settings) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.replaceHomepage(token, {
        settings,
        sections: sections.map((s) => ({
          title: s.title.trim() || TYPE_LABEL[s.section_type],
          section_type: s.section_type,
          mode: isEventSection(s.section_type) ? s.mode : 'auto',
          enabled: s.enabled,
          event_ids: isEventSection(s.section_type) && s.mode === 'curated' ? s.event_ids : [],
        })),
      });
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the homepage.');
    } finally {
      setSaving(false);
    }
  };

  if (!settings || !config) {
    return <div style={{ color: 'var(--text-muted)' }}>{error ?? 'Loading…'}</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Homepage</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Control the public event website front page — hero, banner, and the sections buyers see.</div>
        </div>
        <Button onClick={save} loading={saving}><Icon name={saved ? 'check' : 'save'} size={16} />{saved ? 'Saved' : 'Save changes'}</Button>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      {/* Hero */}
      <div style={card}>
        <CardHead icon="type" title="Hero" description="The headline area at the top of the homepage." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Eyebrow (small label above the headline)" value={settings.hero_eyebrow} onChange={(e) => setS('hero_eyebrow', e.target.value)} />
          <Input label="Headline" value={settings.hero_headline} onChange={(e) => setS('hero_headline', e.target.value)} />
          <Textarea label="Subheadline (optional)" rows={2} value={settings.hero_subheadline ?? ''} onChange={(e) => setS('hero_subheadline', e.target.value || null)} />
          <Switch label="Show the search bar in the hero" checked={settings.hero_search_enabled} onChange={(e) => setS('hero_search_enabled', e.target.checked)} />
        </div>
      </div>

      {/* Announcement banner */}
      <div style={card}>
        <CardHead icon="megaphone" title="Announcement banner" description="An optional strip above the hero — promotions, notices, launches." />
        <Switch label="Show the announcement banner" checked={settings.banner_enabled} onChange={(e) => setS('banner_enabled', e.target.checked)} />
        {settings.banner_enabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <Input label="Banner text" value={settings.banner_text ?? ''} onChange={(e) => setS('banner_text', e.target.value || null)} placeholder="New Year festival tickets now live 🎉" />
            <Input label="Link URL (optional)" value={settings.banner_link_url ?? ''} onChange={(e) => setS('banner_link_url', e.target.value || null)} placeholder="/events or https://…" />
          </div>
        )}
      </div>

      {/* Sections */}
      <div style={card}>
        <CardHead icon="layout-template" title="Sections" description="Add, remove, reorder, rename and toggle the blocks shown down the homepage." />

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px' }}>
            <Select label="Add a section" value={addType} onChange={(e) => setAddType(e.target.value as HomepageSectionType)} options={SECTION_TYPES} />
          </div>
          <Button variant="secondary" onClick={addSection}><Icon name="plus" size={16} />Add section</Button>
        </div>

        {sections.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '8px 0 4px' }}>No sections — the homepage will show only the hero.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sections.map((s, i) => (
              <div key={s.key} style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', padding: 16, opacity: s.enabled ? 1 : 0.6 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 24 }}>
                    <button title="Move up" onClick={() => move(s.key, -1)} disabled={i === 0} style={reorderBtn(i === 0)}><Icon name="chevron-up" size={15} /></button>
                    <button title="Move down" onClick={() => move(s.key, 1)} disabled={i === sections.length - 1} style={reorderBtn(i === sections.length - 1)}><Icon name="chevron-down" size={15} /></button>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: '2 1 240px' }}>
                        <Input label={`Section ${i + 1} title`} value={s.title} onChange={(e) => patchSection(s.key, { title: e.target.value })} />
                      </div>
                      <div style={{ flex: '1 1 180px' }}>
                        <Select label="Type" value={s.section_type} onChange={(e) => patchSection(s.key, { section_type: e.target.value as HomepageSectionType })} options={SECTION_TYPES} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
                      <Icon name={TYPE_ICON[s.section_type]} size={13} /> {TYPE_LABEL[s.section_type]}
                    </div>

                    {isEventSection(s.section_type) && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <ModeChip active={s.mode === 'auto'} label="Automatic (latest live events)" onClick={() => patchSection(s.key, { mode: 'auto' })} />
                          <ModeChip active={s.mode === 'curated'} label="Curated (pick events)" onClick={() => patchSection(s.key, { mode: 'curated' })} />
                        </div>

                        {s.mode === 'curated' && (
                          <div style={{ marginTop: 12 }}>
                            {s.event_ids.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {s.event_ids.map((id) => (
                                  <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-accent-tint)', color: 'var(--color-accent)', borderRadius: 'var(--radius-control)', padding: '5px 10px', fontSize: 12.5, fontWeight: 600 }}>
                                    {eventTitle(id)}
                                    <button onClick={() => toggleCurated(s.key, id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'inline-flex' }}><Icon name="x" size={13} /></button>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)' }}>
                              {liveEvents.length === 0 ? (
                                <div style={{ padding: 12, fontSize: 13, color: 'var(--text-muted)' }}>No live events to choose from yet.</div>
                              ) : liveEvents.map((ev) => {
                                const picked = s.event_ids.includes(ev.event_id);
                                return (
                                  <button key={ev.event_id} onClick={() => toggleCurated(s.key, ev.event_id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: picked ? 'var(--color-accent-tint)' : 'none', border: 'none', borderBottom: '1px solid var(--border-default)', padding: '9px 12px', fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--text-body)' }}>
                                    <Icon name={picked ? 'check-square' : 'square'} size={15} color={picked ? 'var(--color-accent)' : 'var(--text-subtle)'} />
                                    <span style={{ fontWeight: 600 }}>{ev.title}</span>
                                    <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>· {ev.city}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, paddingTop: 22 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-body)' }}>
                      Visible <Switch checked={s.enabled} onChange={(e) => patchSection(s.key, { enabled: e.target.checked })} />
                    </label>
                    <button title="Remove section" onClick={() => removeSection(s.key)} style={iconBtn('var(--color-error)')}><Icon name="trash-2" size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {saved && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
          <Toast variant="success" title="Homepage saved" />
        </div>
      )}
    </div>
  );
}

function ModeChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: active ? 'var(--color-accent)' : 'var(--surface-card)', color: active ? '#fff' : 'var(--text-body)', border: `1px solid ${active ? 'var(--color-accent)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-control)', padding: '7px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
      {label}
    </button>
  );
}

function reorderBtn(disabled: boolean): React.CSSProperties {
  return { width: 26, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 6, background: 'var(--surface-card)', color: disabled ? 'var(--text-subtle)' : 'var(--text-body)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 };
}

function iconBtn(color: string): React.CSSProperties {
  return { width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'var(--surface-card)', color, cursor: 'pointer' };
}

export default function HomepageCmsPage() {
  return (
    <AdminShell>
      <HomepageInner />
    </AdminShell>
  );
}
