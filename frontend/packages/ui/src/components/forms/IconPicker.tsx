'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';
import { Modal } from '../layout/Modal';

/** Curated set of Lucide icon names relevant to event categories -- searchable
 *  by label or keyword so a super admin can find e.g. "Cycling" without
 *  knowing it maps to the "bike" icon. Kept short and hand-picked rather than
 *  exposing all ~1500 Lucide icons, which would make the picker unusable. */
const CATEGORY_ICONS: { name: string; label: string; keywords?: string }[] = [
  { name: 'music', label: 'Music', keywords: 'concert gig' },
  { name: 'mic-2', label: 'Live performance', keywords: 'mic stage' },
  { name: 'headphones', label: 'DJ / Electronic', keywords: 'edm party' },
  { name: 'guitar', label: 'Band', keywords: 'rock' },
  { name: 'piano', label: 'Classical', keywords: 'music' },
  { name: 'disc-3', label: 'Nightlife', keywords: 'club dj' },
  { name: 'drama', label: 'Theatre', keywords: 'drama play' },
  { name: 'theater', label: 'Performing arts', keywords: 'theatre' },
  { name: 'clapperboard', label: 'Film', keywords: 'movie cinema' },
  { name: 'popcorn', label: 'Movies', keywords: 'cinema film' },
  { name: 'laugh', label: 'Comedy', keywords: 'standup funny' },
  { name: 'party-popper', label: 'Festival', keywords: 'celebration party' },
  { name: 'palette', label: 'Art', keywords: 'painting exhibition' },
  { name: 'brush', label: 'Craft', keywords: 'art workshop' },
  { name: 'camera', label: 'Photography', keywords: 'photo' },
  { name: 'graduation-cap', label: 'Education', keywords: 'workshop class course' },
  { name: 'book-open', label: 'Literature', keywords: 'books reading' },
  { name: 'briefcase', label: 'Business', keywords: 'conference networking' },
  { name: 'users', label: 'Networking', keywords: 'meetup community' },
  { name: 'cpu', label: 'Tech', keywords: 'technology hackathon' },
  { name: 'laptop', label: 'Coding', keywords: 'tech workshop' },
  { name: 'gamepad-2', label: 'Gaming', keywords: 'esports' },
  { name: 'joystick', label: 'Esports', keywords: 'gaming' },
  { name: 'activity', label: 'Athletics', keywords: 'sports track field' },
  { name: 'medal', label: 'Marathon', keywords: 'running race athletics' },
  { name: 'footprints', label: 'Running', keywords: 'marathon walk' },
  { name: 'bike', label: 'Cycling', keywords: 'bicycle ride' },
  { name: 'trophy', label: 'Championship', keywords: 'sports tournament' },
  { name: 'dumbbell', label: 'Fitness', keywords: 'gym workout' },
  { name: 'heart-pulse', label: 'Wellness', keywords: 'health yoga' },
  { name: 'volleyball', label: 'Volleyball', keywords: 'sports' },
  { name: 'goal', label: 'Football', keywords: 'soccer sports' },
  { name: 'target', label: 'Sports', keywords: 'games' },
  { name: 'waves', label: 'Swimming', keywords: 'water aquatics' },
  { name: 'mountain', label: 'Trekking', keywords: 'hiking outdoors' },
  { name: 'tent', label: 'Camping', keywords: 'outdoors adventure' },
  { name: 'flag', label: 'Racing', keywords: 'sports motorsport' },
  { name: 'car', label: 'Motorsport', keywords: 'racing cars' },
  { name: 'utensils', label: 'Food', keywords: 'dining restaurant' },
  { name: 'coffee', label: 'Cafe', keywords: 'coffee drink' },
  { name: 'wine', label: 'Wine tasting', keywords: 'drinks' },
  { name: 'beer', label: 'Beer festival', keywords: 'drinks' },
  { name: 'cake', label: 'Food festival', keywords: 'dessert' },
  { name: 'pizza', label: 'Food & Drink', keywords: 'food' },
  { name: 'baby', label: 'Kids & Family', keywords: 'children family' },
  { name: 'paw-print', label: 'Pets', keywords: 'animals' },
  { name: 'plane', label: 'Travel', keywords: 'trip tour' },
  { name: 'globe', label: 'Cultural', keywords: 'world international' },
  { name: 'landmark', label: 'Heritage', keywords: 'culture history' },
  { name: 'church', label: 'Spiritual', keywords: 'religious' },
  { name: 'hand-heart', label: 'Charity', keywords: 'fundraiser cause' },
  { name: 'shirt', label: 'Fashion', keywords: 'style' },
  { name: 'sparkles', label: 'Special', keywords: 'featured' },
  { name: 'ticket', label: 'General', keywords: 'event' },
  { name: 'calendar', label: 'General event', keywords: 'other' },
];

export interface IconPickerProps {
  /** Currently selected Lucide icon name (kebab-case), or null for none. */
  value: string | null;
  onChange: (icon: string | null) => void;
  /** Small label shown above the trigger button, e.g. the category name. */
  label?: string;
}

/** IconPicker -- a searchable grid of category icons in a Modal. Used by the
 *  super admin when assigning an icon to a category (e.g. switching a Sports
 *  category into more specific ones like Cycling, Marathon, Athletics). */
export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const selected = CATEGORY_ICONS.find((i) => i.name === value);
  const q = query.trim().toLowerCase();
  const results = q
    ? CATEGORY_ICONS.filter((i) => i.name.includes(q) || i.label.toLowerCase().includes(q) || i.keywords?.includes(q))
    : CATEGORY_ICONS;

  const pick = (name: string | null) => {
    onChange(name);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        type="button"
        title={label ? `Choose icon for ${label}` : 'Choose icon'}
        onClick={() => setOpen(true)}
        style={{
          width: 34, height: 34, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)',
          background: value ? 'var(--color-accent-tint)' : 'var(--surface-card)',
          color: value ? 'var(--color-accent)' : 'var(--text-subtle)', cursor: 'pointer',
        }}
      >
        <Icon name={value ?? 'tag'} size={16} />
      </button>

      <Modal open={open} title="Choose an icon" onClose={() => { setOpen(false); setQuery(''); }} width={440}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons — e.g. cycling, marathon, music…"
          style={{
            width: '100%', padding: '10px 12px', marginBottom: 16, border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-control)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--text-heading)',
            background: 'var(--surface-card)', boxSizing: 'border-box',
          }}
        />

        {selected && (
          <button
            type="button"
            onClick={() => pick(null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, background: 'none', border: 'none', color: 'var(--color-error)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0 }}
          >
            <Icon name="x" size={13} />Remove icon
          </button>
        )}

        {results.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '12px 0' }}>No icons match &ldquo;{query}&rdquo;.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {results.map((i) => {
              const active = i.name === value;
              return (
                <button
                  key={i.name}
                  type="button"
                  title={i.label}
                  onClick={() => pick(i.name)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px',
                    border: `1px solid ${active ? 'var(--color-accent)' : 'var(--border-default)'}`,
                    background: active ? 'var(--color-accent-tint)' : 'var(--surface-card)',
                    borderRadius: 'var(--radius-control)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Icon name={i.name} size={19} color={active ? 'var(--color-accent)' : 'var(--text-body)'} />
                  <span style={{ fontSize: 10.5, color: active ? 'var(--color-accent)' : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>{i.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
