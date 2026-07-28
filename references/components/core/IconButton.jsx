import React from 'react';

export function IconButton({ icon = 'back', size = 44, variant = 'primary', onClick, style }) {
  const bg = variant === 'primary' ? 'var(--color-accent)' : variant === 'navy' ? 'var(--color-brand-primary)' : 'var(--color-bg-sunken)';
  const fg = variant === 'muted' ? 'var(--color-brand-primary)' : '#fff';
  const paths = {
    back: 'M15 6l-6 6 6 6',
    forward: 'M9 6l6 6-6 6',
    refresh: 'M4 12a8 8 0 1 1 2.34 5.66M4 12V6m0 6h6',
    play: 'M8 5l12 7-12 7z',
    close: 'M6 6l12 12M18 6L6 18',
  };
  return (
    <button
      onClick={onClick}
      aria-label={icon}
      style={{
        width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: bg, color: fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)', transition: 'filter var(--dur-fast) var(--ease-standard)', ...style,
      }}
      onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
      onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
    >
      <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill={icon === 'play' ? fg : 'none'} stroke={fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[icon] || paths.back} />
      </svg>
    </button>
  );
}
