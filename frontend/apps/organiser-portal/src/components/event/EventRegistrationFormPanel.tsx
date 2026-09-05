'use client';

import * as React from 'react';
import { Icon, Select, Switch, Button, Input } from '@cyrokx/ui';
import { organiserApi, ApiError } from '@cyrokx/api-client';
import type { FormField, FormFieldType, FormFieldInput } from '@cyrokx/api-client';
import { PanelHead } from './PanelHead';

/** A field being edited in the builder. Mirrors FormField but with a stable
 *  client-only `key` so React rows survive reorders before a save assigns ids. */
interface DraftField {
  key: string;
  label: string;
  field_type: FormFieldType;
  options: string[];
  required: boolean;
}

const TYPE_OPTIONS = [
  { value: 'text', label: 'Textual response' },
  { value: 'single_choice', label: 'Single selection' },
  { value: 'multi_choice', label: 'Multiple choice' },
];

const TYPE_LABEL: Record<FormFieldType, string> = {
  text: 'Textual response',
  single_choice: 'Single selection',
  multi_choice: 'Multiple choice',
};

const TYPE_ICON: Record<FormFieldType, string> = {
  text: 'align-left',
  single_choice: 'circle-dot',
  multi_choice: 'check-square',
};

// Handy starting points an organiser can drop in and rename. These are just
// pre-filled drafts of the three generic types -- not special server fields.
const PRESETS: { label: string; field_type: FormFieldType; options?: string[] }[] = [
  { label: 'Full name', field_type: 'text' },
  { label: 'T-shirt size', field_type: 'single_choice', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { label: 'Blood group', field_type: 'single_choice', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  { label: 'Emergency contact number', field_type: 'text' },
];

function newKey() {
  return Math.random().toString(36).slice(2);
}

function toDraft(f: FormField): DraftField {
  return { key: newKey(), label: f.label, field_type: f.field_type, options: f.options ?? [], required: f.required };
}

function isChoice(t: FormFieldType) {
  return t === 'single_choice' || t === 'multi_choice';
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, marginBottom: 20,
};

interface Props {
  eventId: string;
  token: string | null;
}

/** EventRegistrationForm — a generic form builder. The organiser composes any
 *  registration form they need out of three field types (textual response,
 *  single selection, multiple choice), so anything from a T-shirt size to a
 *  bespoke field their event needs is just a field they add here. */
export function EventRegistrationFormPanel({ eventId, token }: Props) {
  const [fields, setFields] = React.useState<DraftField[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const savedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // New-field composer state.
  const [draftLabel, setDraftLabel] = React.useState('');
  const [draftType, setDraftType] = React.useState<FormFieldType>('text');

  React.useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  React.useEffect(() => {
    if (!token) return;
    organiserApi
      .getFormFields(token, eventId)
      .then((res) => setFields(res.fields.map(toDraft)))
      .catch(() => setError('Could not load the registration form.'))
      .finally(() => setLoading(false));
  }, [token, eventId]);

  const patch = (key: string, updates: Partial<DraftField>) =>
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, ...updates } : f)));

  const addField = (preset?: (typeof PRESETS)[number]) => {
    const label = preset ? preset.label : draftLabel.trim();
    const field_type = preset ? preset.field_type : draftType;
    if (!label) { setError('Give the field a label first.'); return; }
    setError(null);
    setFields((fs) => [
      ...fs,
      { key: newKey(), label, field_type, options: preset?.options ?? (isChoice(field_type) ? ['Option 1'] : []), required: false },
    ]);
    setDraftLabel('');
    setDraftType('text');
  };

  const remove = (key: string) => setFields((fs) => fs.filter((f) => f.key !== key));

  const move = (key: string, dir: -1 | 1) =>
    setFields((fs) => {
      const i = fs.findIndex((f) => f.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= fs.length) return fs;
      const next = [...fs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const setOption = (key: string, idx: number, value: string) =>
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, options: f.options.map((o, k) => (k === idx ? value : o)) } : f)));
  const addOption = (key: string) =>
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, options: [...f.options, `Option ${f.options.length + 1}`] } : f)));
  const removeOption = (key: string, idx: number) =>
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, options: f.options.filter((_, k) => k !== idx) } : f)));

  const save = async () => {
    if (!token) return;
    // Client-side validation mirrors the API's rules so the organiser gets
    // instant feedback instead of a 400.
    for (const f of fields) {
      if (!f.label.trim()) { setError('Every field needs a label.'); return; }
      if (isChoice(f.field_type) && f.options.filter((o) => o.trim()).length < 1) {
        setError(`"${f.label}" is a choice field and needs at least one option.`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    const payload: FormFieldInput[] = fields.map((f, i) => ({
      label: f.label.trim(),
      field_type: f.field_type,
      options: isChoice(f.field_type) ? f.options.map((o) => o.trim()).filter(Boolean) : null,
      required: f.required,
      sort_order: i,
    }));
    try {
      const res = await organiserApi.replaceFormFields(token, eventId, payload);
      setFields(res.fields.map(toDraft));
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the form.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PanelHead title="Registration form" subtitle="Build the form every participant fills in when they register. Add any field you need — a free-text answer, a single selection, or multiple choices." />

      {/* Composer */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 14 }}>Add a field</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 240px' }}>
            <Input label="Field label" placeholder="e.g. Club / team name" value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <Select label="Answer type" value={draftType} onChange={(e) => setDraftType(e.target.value as FormFieldType)} options={TYPE_OPTIONS} />
          </div>
          <Button onClick={() => addField()}><Icon name="plus" size={16} />Add field</Button>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginRight: 2 }}>Quick add:</span>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => addField(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--surface-accent-tint)', color: 'var(--color-accent)', border: 'none', borderRadius: 'var(--radius-control)', padding: '6px 11px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              <Icon name="plus" size={13} />{p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', fontSize: 13.5, marginBottom: 16 }}>{error}</div>}

      {/* Field list */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>Form fields{fields.length > 0 && <span style={{ color: 'var(--text-subtle)', fontWeight: 500 }}> · {fields.length}</span>}</div>
          <Button size="sm" onClick={save} loading={saving} disabled={!token || loading}>
            <Icon name={saved ? 'check' : 'save'} size={15} />{saved ? 'Saved' : 'Save form'}
          </Button>
        </div>

        {loading ? (
          <div style={{ padding: '8px 22px 26px', color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
        ) : fields.length === 0 ? (
          <div style={{ padding: '8px 22px 30px', color: 'var(--text-muted)', fontSize: 14 }}>
            No fields yet. Add one above — participants will fill these in at registration.
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--border-default)' }}>
            {fields.map((f, i) => (
              <div key={f.key} style={{ padding: '18px 22px', borderBottom: i < fields.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Reorder */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 26 }}>
                    <button title="Move up" onClick={() => move(f.key, -1)} disabled={i === 0} style={reorderBtn(i === 0)}><Icon name="chevron-up" size={15} /></button>
                    <button title="Move down" onClick={() => move(f.key, 1)} disabled={i === fields.length - 1} style={reorderBtn(i === fields.length - 1)}><Icon name="chevron-down" size={15} /></button>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: '2 1 220px' }}>
                        <Input label={`Field ${i + 1} label`} value={f.label} onChange={(e) => patch(f.key, { label: e.target.value })} />
                      </div>
                      <div style={{ flex: '1 1 170px' }}>
                        <Select label="Answer type" value={f.field_type} onChange={(e) => patch(f.key, { field_type: e.target.value as FormFieldType, options: isChoice(e.target.value as FormFieldType) && f.options.length === 0 ? ['Option 1'] : f.options })} options={TYPE_OPTIONS} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
                      <Icon name={TYPE_ICON[f.field_type]} size={13} /> {TYPE_LABEL[f.field_type]}
                    </div>

                    {/* Options editor for choice fields */}
                    {isChoice(f.field_type) && (
                      <div style={{ marginTop: 12, paddingLeft: 4 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>Options</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {f.options.map((opt, oi) => (
                            <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <Icon name={f.field_type === 'single_choice' ? 'circle' : 'square'} size={15} color="var(--text-subtle)" />
                              <input value={opt} onChange={(e) => setOption(f.key, oi, e.target.value)} placeholder={`Option ${oi + 1}`} style={optionInput} />
                              <button title="Remove option" onClick={() => removeOption(f.key, oi)} disabled={f.options.length <= 1} style={iconBtn('var(--color-error)', f.options.length <= 1)}><Icon name="x" size={14} /></button>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => addOption(f.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', color: 'var(--color-accent)', border: 'none', padding: '8px 2px 0', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                          <Icon name="plus" size={13} />Add option
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Required + delete */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, paddingTop: 24 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-body)', cursor: 'pointer' }}>
                      Required <Switch checked={f.required} onChange={(e) => patch(f.key, { required: e.target.checked })} />
                    </label>
                    <button title="Delete field" onClick={() => remove(f.key)} style={iconBtn('var(--color-error)')}><Icon name="trash-2" size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function reorderBtn(disabled: boolean): React.CSSProperties {
  return { width: 26, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 6, background: 'var(--surface-card)', color: disabled ? 'var(--text-subtle)' : 'var(--text-body)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 };
}

function iconBtn(color: string, disabled?: boolean): React.CSSProperties {
  return { width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'var(--surface-card)', color: disabled ? 'var(--text-subtle)' : color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 };
}

const optionInput: React.CSSProperties = {
  flex: 1, padding: '8px 11px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--text-heading)', background: 'var(--surface-card)',
};
