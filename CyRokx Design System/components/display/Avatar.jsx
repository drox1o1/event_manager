import React from 'react';

/** Avatar — organiser/user avatar, image or initials fallback. */
export function Avatar({ src, name = '', size = 40, style }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return src ? (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: 'none', ...style }}
    />
  ) : (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--color-accent-tint)',
        color: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: size * 0.38,
        flex: 'none',
        ...style,
      }}
    >
      {initials || '?'}
    </span>
  );
}
