import React from 'react';

export function Tabs({ items = [], active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {items.map((item, i) => {
        const isActive = item === active;
        return (
          <button key={i} onClick={() => onChange && onChange(item)} style={{
            padding: '10px 22px', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)',
            fontWeight: isActive ? 'var(--fw-bold)' : 'var(--fw-regular)',
            background: isActive ? 'var(--color-bg-surface)' : 'var(--color-bg-sunken)',
            color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
            borderBottom: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
            borderTop: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)',
            transition: 'background var(--dur-fast) var(--ease-standard)',
          }}>{item}</button>
        );
      })}
    </div>
  );
}
