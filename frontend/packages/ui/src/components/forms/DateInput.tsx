'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';

export interface DateInputProps {
  label?: string;
  /** ISO date (YYYY-MM-DD) once complete; while typing, the partial text. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  /** Latest selectable date (ISO), e.g. today for a date of birth. */
  max?: string;
  min?: string;
  style?: React.CSSProperties;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "2010-08-15" -> "15-08-2010". */
export function isoToDmy(iso: string): string {
  if (!ISO_RE.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

/** "15-08-2010" -> "2010-08-15"; null unless it is a real calendar date. */
export function dmyToIso(dmy: string): string | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dmy);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (date.getFullYear() !== Number(yyyy) || date.getMonth() !== Number(mm) - 1 || date.getDate() !== Number(dd)) return null;
  return `${yyyy}-${mm}-${dd}`;
}

/** Inserts the dashes as digits are typed: "15082010" -> "15-08-2010". */
function maskDmy(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
}

/** DateInput — type the date as DD-MM-YYYY (dashes are added automatically)
 *  or pick it from the calendar button. Emits an ISO date once the typed
 *  text is a real date; until then it emits the partial text so the form
 *  can flag it. */
export function DateInput({ label, value, onChange, error, disabled = false, max, min, style }: DateInputProps) {
  const [text, setText] = React.useState(() => (ISO_RE.test(value) ? isoToDmy(value) : value));
  const [focus, setFocus] = React.useState(false);
  const pickerRef = React.useRef<HTMLInputElement>(null);

  // Follow value changes made outside the text box (calendar, form reset).
  React.useEffect(() => {
    if (ISO_RE.test(value)) setText((t) => (dmyToIso(t) === value ? t : isoToDmy(value)));
    else if (!value) setText('');
  }, [value]);

  const onType = (raw: string) => {
    const next = maskDmy(raw);
    setText(next);
    onChange(dmyToIso(next) ?? next);
  };

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el || disabled) return;
    try { el.showPicker(); } catch { el.focus(); el.click(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-sans)', width: '100%', ...style }}>
      {label && <span style={{ fontSize: 13, fontWeight: 'var(--text-label-weight)' as unknown as number, color: 'var(--text-heading)' }}>{label}</span>}
      <span
        style={{
          position: 'relative', display: 'flex', alignItems: 'stretch', borderRadius: 'var(--radius-control)',
          border: `1px solid ${error ? 'var(--color-error)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
          boxShadow: focus && !error ? 'var(--shadow-focus-ring)' : 'none',
          background: disabled ? 'var(--color-muted-bg)' : 'var(--surface-card)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          placeholder="DD-MM-YYYY"
          aria-label={label}
          maxLength={10}
          value={text}
          disabled={disabled}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-sans)', fontSize: 15, padding: '11px 14px', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-body)', letterSpacing: '0.02em' }}
        />
        <button
          type="button"
          aria-label="Open calendar"
          disabled={disabled}
          onClick={openPicker}
          style={{ display: 'flex', alignItems: 'center', padding: '0 12px', border: 'none', borderLeft: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-muted)', cursor: disabled ? 'default' : 'pointer' }}
        >
          <Icon name="calendar" size={17} />
        </button>
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden
          max={max}
          min={min}
          value={ISO_RE.test(value) ? value : ''}
          onChange={(e) => { if (e.target.value) { setText(isoToDmy(e.target.value)); onChange(e.target.value); } }}
          style={{ position: 'absolute', right: 0, bottom: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none', border: 'none', padding: 0 }}
        />
      </span>
      {error && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>{error}</span>}
    </div>
  );
}
