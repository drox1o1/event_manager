import * as React from 'react';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  style?: React.CSSProperties;
}

/** Avatar — organiser/user avatar, image or initials fallback. */
export function Avatar({ src, name = '', size = 40, style }: AvatarProps) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
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
