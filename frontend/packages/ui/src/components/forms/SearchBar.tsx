'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';

export interface SearchBarProps {
  keyword?: string;
  onKeywordChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  location?: string;
  onLocationChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: () => void;
  style?: React.CSSProperties;
}

/** SearchBar — combined keyword + location search used in the homepage hero and nav. */
export function SearchBar({ keyword, onKeywordChange, location, onLocationChange, onSubmit, style }: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-modal)',
        boxShadow: 'var(--shadow-card)',
        padding: 6,
        gap: 4,
        fontFamily: 'var(--font-sans)',
        maxWidth: 640,
        width: '100%',
        ...style,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flex: '0 0 160px', borderRight: '1px solid var(--border-default)' }}>
        <Icon name="map-pin" size={16} color="var(--text-subtle)" />
        <input
          value={location}
          onChange={onLocationChange}
          placeholder="Any city"
          style={{ border: 'none', outline: 'none', fontSize: 15, width: '100%', background: 'transparent', color: 'var(--text-body)' }}
        />
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flex: 1 }}>
        <Icon name="search" size={16} color="var(--text-subtle)" />
        <input
          value={keyword}
          onChange={onKeywordChange}
          placeholder="Search events, artists, venues"
          style={{ border: 'none', outline: 'none', fontSize: 15, width: '100%', background: 'transparent', color: 'var(--text-body)' }}
        />
      </span>
      <button
        type="submit"
        style={{
          background: 'var(--action-primary-bg)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-control)',
          padding: '12px 24px',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
          flex: 'none',
        }}
      >
        Search
      </button>
    </form>
  );
}
