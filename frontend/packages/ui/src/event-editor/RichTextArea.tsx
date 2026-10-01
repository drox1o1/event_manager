'use client';

import * as React from 'react';
import Markdown from 'react-markdown';
import { Icon } from '../components/icons/Icon';

/** Description editor with a light formatting toolbar plus a live preview
 *  toggle. Stores plain CommonMark (bold, italic, "## " sub-headings, "- "
 *  bullets, "1. " numbered lists) -- exactly the subset the toolbar buttons
 *  below produce. <RichText> renders it, on this preview and on the public
 *  event page, via the same component so there's no drift between what an
 *  organiser sees while editing and what buyers see once published. */
export function RichTextArea({ value, onChange, placeholder, error, rows = 12 }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean; rows?: number }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [focus, setFocus] = React.useState(false);
  const [preview, setPreview] = React.useState(false);

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
        {!preview && (
          <>
            {tool('bold', 'Bold', () => wrap('**'))}
            {tool('italic', 'Italic', () => wrap('_'))}
            {tool('heading-2', 'Sub-heading', () => prefixLines('heading'))}
            {tool('list-ordered', 'Numbered list', () => prefixLines('number'))}
            {tool('list', 'Bulleted list', () => prefixLines('bullet'))}
          </>
        )}
        <span style={{ flex: 1 }} />
        {!preview && <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{value.length} characters</span>}
        {tool(preview ? 'pencil' : 'eye', preview ? 'Back to editing' : 'Preview', () => setPreview((p) => !p))}
      </div>
      {preview ? (
        <div style={{ padding: '14px 16px', minHeight: 220 }}>
          {value.trim() ? <RichText text={value} /> : <span style={{ color: 'var(--text-subtle)', fontSize: 14 }}>Nothing to preview yet.</span>}
        </div>
      ) : (
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
      )}
    </div>
  );
}

const heading: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text-heading)', margin: '18px 0 8px' }}>{children}</h4>
);

/** Renders the RichTextArea markdown subset -- restricted to exactly what
 *  the toolbar above can produce (bold, italic, headings, lists). Extend
 *  `allowedElements` alongside any new toolbar button, since react-markdown
 *  otherwise happily renders the rest of CommonMark (links, tables, raw
 *  HTML is excluded by default regardless -- see Options.allowElement in
 *  react-markdown's own docs for how skipping an element works). */
export function RichText({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--text-body)', ...style }}>
      <Markdown
        allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3']}
        components={{
          p: ({ children }: { children?: React.ReactNode }) => <p style={{ margin: '0 0 12px' }}>{children}</p>,
          ul: ({ children }: { children?: React.ReactNode }) => <ul style={{ margin: '0 0 14px', paddingLeft: 22 }}>{children}</ul>,
          // `start` must be forwarded -- react-markdown sets it so a numbered
          // list interrupted by another list (e.g. bullets under each number)
          // continues counting instead of every fragment restarting at 1.
          ol: ({ children, start }: { children?: React.ReactNode; start?: number }) => <ol start={start} style={{ margin: '0 0 14px', paddingLeft: 22 }}>{children}</ol>,
          li: ({ children }: { children?: React.ReactNode }) => <li style={{ marginBottom: 4 }}>{children}</li>,
          h1: heading,
          h2: heading,
          h3: heading,
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}
