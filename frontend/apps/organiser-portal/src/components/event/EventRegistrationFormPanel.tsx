'use client';

import * as React from 'react';
import { Icon, Select, Switch, Button } from '@cyrokx/ui';
import { PanelHead } from './PanelHead';
import { NotWiredNote } from './panelState';

const ADDABLE = ['Blood group', 'Club / team name', 'Nationality', 'Medical conditions', 'Estimated finish time', 'Photo ID number'];

interface Field {
  id: string;
  name: string;
  type: string;
  meta: string;
  required: boolean;
  order: number;
  enabled: boolean;
  locked?: boolean;
}

const INITIAL_FIELDS: Field[] = [
  { id: 'f1', name: 'Full Name', type: 'text', meta: 'Placeholder: Enter full name…', required: true, order: 1, enabled: true, locked: true },
  { id: 'f2', name: 'Birth Date', type: 'date', meta: 'Placeholder: YYYY-MM-DD', required: true, order: 2, enabled: true, locked: true },
  { id: 'f3', name: 'Gender', type: 'select', meta: 'Options: Male, Female, Other', required: true, order: 3, enabled: true },
  { id: 'f4', name: 'Address', type: 'text', meta: 'Placeholder: Address with city', required: true, order: 4, enabled: true },
  { id: 'f5', name: 'T-shirt Size', type: 'select', meta: 'Options: XXS, XS, S, M, L, XL, XXL, XXXL, 4XL', required: true, order: 5, enabled: true },
  { id: 'f6', name: 'Mobile Number', type: 'text', meta: 'Placeholder: Your mobile number', required: true, order: 6, enabled: true },
  { id: 'f7', name: 'Emergency Contact Number', type: 'text', meta: 'Placeholder: Emergency contact', required: true, order: 7, enabled: true },
];

function iconBtn(color: string, disabled?: boolean): React.CSSProperties {
  return { width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'var(--surface-card)', color: disabled ? 'var(--text-subtle)' : color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 };
}

/** EventRegistrationForm — form-field builder: add fields, then set required /
 *  display order / enabled per row with save + delete controls. */
export function EventRegistrationFormPanel() {
  const [fields, setFields] = React.useState<Field[]>(INITIAL_FIELDS);
  const [pick, setPick] = React.useState('');
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const savedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  const saveRow = (id: string) => {
    setSavedId(id);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedId(null), 1600);
  };

  const patch = (id: string, k: keyof Field, v: string | number | boolean) =>
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, [k]: v } : f)));

  const addField = () => {
    if (!pick) return;
    setFields([...fields, { id: Math.random().toString(36).slice(2), name: pick, type: 'text', meta: 'Placeholder: —', required: false, order: fields.length + 1, enabled: true }]);
    setPick('');
  };

  const remove = (id: string) => setFields((fs) => fs.filter((f) => f.id !== id));

  return (
    <div>
      <PanelHead title="Registration form" subtitle="Fields every participant fills in when they register. Name and Birth Date are required by the system." />

      <NotWiredNote>Form fields save locally for now — the registration-form API is backend follow-up work.</NotWiredNote>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 14 }}>Add field</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Select value={pick} onChange={(e) => setPick(e.target.value)} options={ADDABLE} placeholder="Select a field to add to the form" />
          </div>
          <Button onClick={addField}><Icon name="plus" size={16} />Add field</Button>
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', padding: '18px 22px 4px' }}>Form fields</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {['Field', 'Required', 'Order', 'Enabled', ''].map((h, i) => (
                <th key={h || i} style={{ textAlign: i === 0 ? 'left' : 'center', padding: '12px 22px', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)', width: i === 0 ? 'auto' : 120 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => (
              <tr key={f.id} style={{ borderBottom: i < fields.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                <td style={{ padding: '16px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-heading)' }}>{f.name}</span>
                    {f.locked && <span title="System field" style={{ display: 'inline-flex', color: 'var(--text-subtle)' }}><Icon name="lock" size={13} /></span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Type: {f.type} · {f.meta}</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Switch checked={f.required} onChange={(e) => patch(f.id, 'required', e.target.checked)} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input type="number" value={f.order} onChange={(e) => patch(f.id, 'order', Number(e.target.value))} style={{ width: 56, textAlign: 'center', padding: '7px 6px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--text-heading)' }} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Switch checked={f.enabled} onChange={(e) => patch(f.id, 'enabled', e.target.checked)} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button title="Save" onClick={() => saveRow(f.id)} style={iconBtn(savedId === f.id ? 'var(--color-success)' : 'var(--color-accent-secondary)')}><Icon name={savedId === f.id ? 'check' : 'save'} size={16} /></button>
                    <button title="Delete" onClick={() => remove(f.id)} disabled={f.locked} style={iconBtn('var(--color-error)', f.locked)}><Icon name="trash-2" size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
