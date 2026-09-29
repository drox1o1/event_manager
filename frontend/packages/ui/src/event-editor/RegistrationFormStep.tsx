'use client';

import * as React from 'react';
import type { FormFieldType, OrganiserEventDetail } from '@showtik/api-client';
import { Icon } from '../components/icons/Icon';
import { Input } from '../components/forms/Input';
import { Select } from '../components/forms/Select';
import { Switch } from '../components/forms/Switch';
import { Button } from '../components/forms/Button';
import { Notice, SaveBar, SectionTitle, errMessage } from './ui';
import type { EventEditorApi } from './types';

interface FieldDraft {
  key: string;
  label: string;
  field_type: FormFieldType;
  options: string[];
  required: boolean;
}

const TYPE_OPTIONS = [
  { value: 'text', label: 'Short answer' },
  { value: 'single_choice', label: 'Single selection' },
  { value: 'multi_choice', label: 'Multiple choice' },
  { value: 'date', label: 'Date (calendar)' },
  { value: 'dob', label: 'Date of birth (age check)' },
  { value: 'phone', label: 'Contact number (digits only)' },
];

const PRESETS: { label: string; field_type: FormFieldType; options?: string[]; required?: boolean }[] = [
  { label: 'Date of birth', field_type: 'dob', required: true },
  { label: 'Gender', field_type: 'single_choice', options: ['Male', 'Female', 'Other'], required: true },
  { label: 'T-shirt size', field_type: 'single_choice', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true },
  { label: 'Blood group', field_type: 'single_choice', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  { label: 'Emergency contact number', field_type: 'phone', required: true },
  { label: 'ID proof number (Aadhaar / PAN)', field_type: 'text' },
];

const isChoice = (t: FormFieldType) => t === 'single_choice' || t === 'multi_choice';
const newKey = () => Math.random().toString(36).slice(2);

interface StepProps {
  api: EventEditorApi;
  token: string;
  event: OrganiserEventDetail;
  readOnly: boolean;
  onSaved: (goNext: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
}

/** Registration form — the questions every participant answers. Asked once
 *  per ticket at checkout (e.g. each runner's DOB and T-shirt size). */
export function RegistrationFormStep({ api, token, event, readOnly, onSaved, onDirtyChange }: StepProps) {
  const [fields, setFields] = React.useState<FieldDraft[]>(() =>
    event.form_fields.map((f) => ({ key: f.id, label: f.label, field_type: f.field_type, options: f.options ?? [], required: f.required }))
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  const agedTiers = event.ticket_tiers.filter((t) => t.min_age != null || t.max_age != null).map((t) => t.name);

  const mutate = (fn: (fs: FieldDraft[]) => FieldDraft[]) => { setFields(fn); setDirty(true); };
  const patch = (key: string, u: Partial<FieldDraft>) => mutate((fs) => fs.map((f) => (f.key === key ? { ...f, ...u } : f)));
  const move = (idx: number, dir: -1 | 1) => mutate((fs) => {
    const j = idx + dir;
    if (j < 0 || j >= fs.length) return fs;
    const copy = [...fs];
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    return copy;
  });

  const addPreset = (p: (typeof PRESETS)[number]) => mutate((fs) => [...fs, { key: newKey(), label: p.label, field_type: p.field_type, options: p.options ?? [], required: !!p.required }]);
  const addBlank = () => mutate((fs) => [...fs, { key: newKey(), label: '', field_type: 'text', options: [], required: false }]);

  const validate = () => {
    const e: Record<string, string> = {};
    const seen = new Set<string>();
    for (const f of fields) {
      const label = f.label.trim();
      if (!label) e[f.key] = 'Enter a question.';
      else if (seen.has(label.toLowerCase())) e[f.key] = 'This question is already on the form.';
      else if (isChoice(f.field_type) && f.options.map((o) => o.trim()).filter(Boolean).length < 2) e[f.key] = 'Add at least two options.';
      seen.add(label.toLowerCase());
    }
    const dobs = fields.filter((f) => f.field_type === 'dob');
    dobs.slice(1).forEach((f) => { e[f.key] = 'Only one Date of birth question is allowed — ticket age limits use it.'; });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (goNext: boolean) => {
    if (!validate()) return;
    setSaving(true); setApiError(null);
    try {
      await api.replaceFormFields(token, event.event_id, fields.map((f, i) => ({
        label: f.label.trim(),
        field_type: f.field_type,
        options: isChoice(f.field_type) ? f.options.map((o) => o.trim()).filter(Boolean) : null,
        required: f.required,
        sort_order: i,
      })));
      setDirty(false);
      onSaved(goNext);
    } catch (err) {
      setApiError(errMessage(err, 'Could not save the registration form.'));
    } finally { setSaving(false); }
  };

  return (
    <div>
      <SectionTitle title="Registration form" description="Name, email and phone are always collected. Add anything else you need from each participant — it's asked once per ticket." />
      {apiError && <div style={{ marginBottom: 16 }}><Notice tone="error">{apiError}</Notice></div>}
      {agedTiers.length > 0 && !fields.some((f) => f.field_type === 'dob') && (
        <div style={{ marginBottom: 16 }}>
          <Notice tone="warning">
            <strong>{agedTiers.join(', ')}</strong> {agedTiers.length === 1 ? 'has' : 'have'} an age limit. Add a <strong>Date of birth</strong> question so each participant&apos;s age can be checked — publishing is blocked until you do.
          </Notice>
        </div>
      )}

      {!readOnly && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 22 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 4 }}>Quick add:</span>
          {PRESETS.filter((p) => !fields.some((f) => f.label === p.label)).map((p) => (
            <button key={p.label} type="button" onClick={() => addPreset(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--surface-accent-tint)', color: 'var(--color-accent)', border: 'none', borderRadius: 'var(--radius-pill)', padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Icon name="plus" size={13} />{p.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-card)', background: 'var(--color-off-white)', fontSize: 14, color: 'var(--text-muted)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="lock" size={15} /> Name · Email · Phone <span style={{ marginLeft: 'auto', fontSize: 12.5 }}>Always included</span>
        </div>
        {fields.map((f, i) => (
          <div key={f.key} style={{ border: `1px solid ${errors[f.key] ? 'var(--color-error)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-card)', padding: 18, background: 'var(--surface-card)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 240px' }}><Input label={`Question ${i + 1}`} placeholder="e.g. Club / team name" value={f.label} disabled={readOnly} onChange={(e) => patch(f.key, { label: e.target.value })} /></div>
              <div style={{ flex: '1 1 170px' }}><Select label="Answer type" value={f.field_type} disabled={readOnly} options={TYPE_OPTIONS} onChange={(e) => { const t = e.target.value as FormFieldType; patch(f.key, { field_type: t, options: isChoice(t) && f.options.length === 0 ? ['Option 1', 'Option 2'] : f.options }); }} /></div>
            </div>
            {isChoice(f.field_type) && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {f.options.map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Icon name={f.field_type === 'single_choice' ? 'circle' : 'square'} size={15} color="var(--text-subtle)" />
                    <input value={opt} disabled={readOnly} onChange={(e) => patch(f.key, { options: f.options.map((o, k) => (k === oi ? e.target.value : o)) })} style={{ flex: 1, padding: '8px 11px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', fontSize: 14, fontFamily: 'var(--font-sans)' }} />
                    {!readOnly && <button type="button" aria-label="Remove option" onClick={() => patch(f.key, { options: f.options.filter((_, k) => k !== oi) })} style={{ border: 'none', background: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}><Icon name="x" size={15} /></button>}
                  </div>
                ))}
                {!readOnly && <button type="button" onClick={() => patch(f.key, { options: [...f.options, `Option ${f.options.length + 1}`] })} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}><Icon name="plus" size={13} />Add option</button>}
              </div>
            )}
            {errors[f.key] && <div style={{ color: 'var(--color-error)', fontSize: 12.5, marginTop: 8 }}>{errors[f.key]}</div>}
            {!readOnly && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-default)' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-body)' }}>Required <Switch checked={f.required} onChange={(e) => patch(f.key, { required: e.target.checked })} /></label>
                <span style={{ flex: 1 }} />
                <IconBtn icon="arrow-up" label="Move up" disabled={i === 0} onClick={() => move(i, -1)} />
                <IconBtn icon="arrow-down" label="Move down" disabled={i === fields.length - 1} onClick={() => move(i, 1)} />
                <IconBtn icon="trash-2" label="Delete question" danger onClick={() => mutate((fs) => fs.filter((x) => x.key !== f.key))} />
              </div>
            )}
          </div>
        ))}
        {!readOnly && (
          <button type="button" onClick={addBlank} style={{ padding: '16px', border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-card)', background: 'none', color: 'var(--text-heading)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="plus" size={16} /> Add a custom question
          </button>
        )}
      </div>

      {!readOnly && (
        <SaveBar>
          <Button variant="secondary" onClick={() => save(false)} loading={saving} disabled={!dirty}>Save</Button>
          <Button onClick={() => save(true)} loading={saving}>Save &amp; continue</Button>
        </SaveBar>
      )}
    </div>
  );
}

function IconBtn({ icon, label, onClick, disabled, danger }: { icon: string; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} style={{ width: 32, height: 32, border: '1px solid var(--border-default)', borderRadius: 8, background: 'var(--surface-card)', color: disabled ? 'var(--text-subtle)' : danger ? 'var(--color-error)' : 'var(--text-body)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={14} />
    </button>
  );
}
