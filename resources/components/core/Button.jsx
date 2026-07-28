import React from 'react';

const sizes = {
  sm: { h: 32, fs: 'var(--fs-body-sm)', px: 14 },
  md: { h: 40, fs: 'var(--fs-body)', px: 18 },
  lg: { h: 56, fs: 'var(--fs-h3)', px: 26 },
};

export function Button({ variant = 'primary', size = 'md', shape = 'pill', disabled = false, children, onClick, style }) {
  const s = sizes[size] || sizes.md;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: s.h, padding: shape === 'circle' ? 0 : `0 ${s.px}px`,
    width: shape === 'circle' ? s.h : undefined,
    borderRadius: shape === 'circle' ? '50%' : 'var(--radius-pill)',
    fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-bold)', fontSize: s.fs,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'filter var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: 'var(--color-accent)', color: 'var(--color-text-on-brand)', boxShadow: 'var(--shadow-btn)' },
    navy: { background: 'var(--color-brand-primary)', color: 'var(--color-text-on-brand)', boxShadow: 'var(--shadow-sm)' },
    outline: { background: 'transparent', color: 'var(--color-accent)', border: '1.5px solid var(--color-accent)' },
    ghost: { background: 'var(--color-bg-sunken)', color: 'var(--color-brand-primary)' },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.filter = 'brightness(1.08)')}
      onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.96)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );
}
