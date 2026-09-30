'use client';

import * as React from 'react';
import { Icon } from '../icons/Icon';
import { useIsMobile } from '../../hooks/useMediaQuery';

export interface SearchBarProps {
  keyword?: string;
  onKeywordChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  location?: string;
  onLocationChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: () => void;
  style?: React.CSSProperties;
}

const inputStyle: React.CSSProperties = {
  border: 'none', outline: 'none', width: '100%', minWidth: 0, background: 'transparent',
  fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: '20px', color: 'var(--text-body)', padding: 0,
};

/** SearchBar — combined location + keyword search used in the homepage hero.
 *  One 48px control: city | keyword | button, all vertically centred. */
export function SearchBar({ keyword, onKeywordChange, location, onLocationChange, onSubmit, style }: SearchBarProps) {
  const isMobile = useIsMobile();
  const field: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px' };
  return (
    <form
      role="search"
      onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(); }}
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        boxShadow: '0 1px 1px rgba(0,0,0,0.02), 0 4px 8px -4px rgba(0,0,0,0.04), 0 16px 24px -8px rgba(0,0,0,0.06)',
        padding: 4,
        gap: 4,
        fontFamily: 'var(--font-sans)',
        maxWidth: 720,
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <label style={{ ...field, flex: isMobile ? 'none' : '0 0 180px', borderRight: isMobile ? 'none' : '1px solid var(--border-default)', borderBottom: isMobile ? '1px solid var(--border-default)' : 'none' }}>
        <Icon name="map-pin" size={16} color="var(--text-subtle)" />
        <input aria-label="City" value={location} onChange={onLocationChange} placeholder="Any city" style={inputStyle} />
      </label>
      <label style={{ ...field, flex: 1 }}>
        <Icon name="search" size={16} color="var(--text-subtle)" />
        <input aria-label="Search" value={keyword} onChange={onKeywordChange} placeholder="Search events, artists, venues" style={inputStyle} />
      </label>
      <button
        type="submit"
        style={{
          height: 40,
          padding: '0 20px',
          background: 'var(--action-primary-bg)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          fontSize: 14,
          cursor: 'pointer',
          flex: 'none',
        }}
      >
        Search
      </button>
    </form>
  );
}
