import React, { useState } from 'react';
import { Icon } from '../icons/Icon';
import { Tag } from '../display/Tag';

/** EventCard — the core discovery unit: image, title, date, city, price-from, category tag. Lifts on hover. */
export function EventCard({ image, title, date, city, priceFrom, category, soldOut = false, onClick, style }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 'var(--radius-card)',
        background: 'var(--surface-card)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: hover ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '4/3', background: image ? `center/cover no-repeat url(${image})` : 'linear-gradient(135deg, #EFEAE4, #E4DED6)' }}>
        {!image && (
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
            <Icon name="image" size={28} />
          </span>
        )}
        {category && (
          <span style={{ position: 'absolute', top: 12, left: 12 }}>
            <Tag style={{ background: 'rgba(255,255,255,0.92)', border: 'none' }}>{category}</Tag>
          </span>
        )}
        {soldOut && (
          <span style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,13,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em' }}>
            SOLD OUT
          </span>
        )}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6, lineHeight: 1.3 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
          <Icon name="calendar" size={13} /> {date}
          <span style={{ margin: '0 2px' }}>&middot;</span>
          <Icon name="map-pin" size={13} /> {city}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-subtle)' }}>from <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 16 }}>{priceFrom}</span></div>
      </div>
    </div>
  );
}
