'use client';

import * as React from 'react';
import { Icon } from '../components/icons/Icon';

/** Description editor with a light formatting toolbar. Stores a tiny
 *  markdown subset (**bold**, _italic_, "- " bullets, "1. " numbered lists,
 *  "## " sub-headings) which <RichText> renders on the public event page. */
export function RichTextArea({ value, onChange, placeholder, error, rows = 12 }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean; rows?: number }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [focus, setFocus] = React.useState(false);

  const wrap = (marker: string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e) || 'text';
    const next = value.slice(0, s) + marker + selected + marker + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + marker.length, s + marker.length + selected.length); });
  };

  const prefixLines = (kind: 'bullet' | 'number' | 'heading') => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const lineEndIdx = value.indexOf('\n', e);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
    const lines = value.slice(lineStart, lineEnd).split('\n');
    const out = lines.map((l, i) => (kind === 'bullet' ? `- ${l}` : kind === 'number' ? `${i + 1}. ${l}` : `## ${l}`)).join('\n');
    onChange(value.slice(0, lineStart) + out + value.slice(lineEnd));
    requestAnimationFrame(() => el.focus());
  };

  const tool = (icon: string, label: string, onClick: () => void) => (
    <button type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick} style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', borderRadius: 6, color: 'var(--text-heading)', cursor: 'pointer' }}>
      <Icon name={icon} size={16} />
    </button>
  );

  return (
    <div style={{ border: `1px solid ${error ? 'var(--color-error)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-card)', background: 'var(--surface-card)', boxShadow: focus && !error ? 'var(--shadow-focus-ring)' : 'none', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '8px 10px', borderBottom: '1px solid var(--border-default)' }}>
        {tool('bold', 'Bold', () => wrap('**'))}
        {tool('italic', 'Italic', () => wrap('_'))}
        {tool('heading-2', 'Sub-heading', () => prefixLines('heading'))}
        {tool('list-ordered', 'Numbered list', () => prefixLines('number'))}
        {tool('list', 'Bulleted list', () => prefixLines('bullet'))}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{value.length} characters</span>
      </div>
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', padding: '14px 16px', fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.6, color: 'var(--text-body)', background: 'transparent', boxSizing: 'border-box', minHeight: 220 }}
      />
    </div>
  );
}

function inline(text: string, keyPrefix: string): React.ReactNode[] {
  // **bold** and _italic_ only; everything else is plain text (no HTML injection).
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    parts.push(tok.startsWith('**')
      ? <strong key={`${keyPrefix}-${i++}`}>{tok.slice(2, -2)}</strong>
      : <em key={`${keyPrefix}-${i++}`}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Renders the RichTextArea markdown subset safely as React elements. */
export function RichText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split('\n');
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    const k = `l${blocks.length}`;
    blocks.push(<Tag key={k} style={{ margin: '0 0 14px', paddingLeft: 22 }}>{list.items.map((it, i) => <li key={i} style={{ marginBottom: 4 }}>{inline(it, `${k}-${i}`)}</li>)}</Tag>);
    list = null;
  };
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-•]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || num) {
      const ordered = !!num;
      if (!list || list.ordered !== ordered) { flush(); list = { ordered, items: [] }; }
      list.items.push((bullet ? bullet[1] : num![1]));
      return;
    }
    flush();
    if (!line.trim()) return;
    const h = line.match(/^#{1,3}\s+(.*)$/);
    if (h) {
      blocks.push(<h4 key={`h${idx}`} style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', margin: '18px 0 8px' }}>{inline(h[1], `h${idx}`)}</h4>);
    } else {
      blocks.push(<p key={`p${idx}`} style={{ margin: '0 0 12px' }}>{inline(line, `p${idx}`)}</p>);
    }
  });
  flush();
  return <div style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--text-body)', ...style }}>{blocks}</div>;
}
