import React from 'react';

export function Panel({ children, padded = true, style }) {
  return (
    <div style={{
      background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-strong)',
      borderRadius: 'var(--radius-sm)', padding: padded ? 'var(--sp-6)' : 0, ...style,
    }}>{children}</div>
  );
}
