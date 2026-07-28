import React from 'react';

export function SectionLabel({ children, size = 'md' }) {
  const fs = size === 'lg' ? 'var(--fs-h2)' : size === 'sm' ? 'var(--fs-body)' : 'var(--fs-h3)';
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 10, minHeight: size === 'lg' ? 28 : 22,
    }}>
      <span style={{ width: 4, background: 'var(--color-accent-soft)', borderRadius: 2, flexShrink: 0 }} />
      <span style={{
        fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: fs,
        color: 'var(--color-text-heading)', display: 'flex', alignItems: 'center',
      }}>{children}</span>
    </div>
  );
}
