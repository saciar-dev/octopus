import React from 'react';

export function ScheduleTable({ rows = [], onEnter }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
      <thead>
        <tr>
          {['Enter', 'End', 'Session', 'Enter'].map((h, i) => (
            <th key={i} style={{
              background: 'var(--color-brand-primary)', color: 'var(--color-text-on-brand)',
              fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', textAlign: i === 2 ? 'center' : 'center',
              padding: '10px 14px', border: '1px solid var(--color-brand-primary)',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ background: 'var(--color-bg-surface)' }}>
            <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: 'var(--fs-body-sm)', border: '1px solid var(--color-border)' }}>{r.enter}</td>
            <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: 'var(--fs-body-sm)', border: '1px solid var(--color-border)' }}>{r.end}</td>
            <td style={{ padding: '10px 14px', color: 'var(--color-link)', fontSize: 'var(--fs-body-sm)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>{r.session}</td>
            <td style={{ padding: '10px 14px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
              <button onClick={() => onEnter && onEnter(r)} aria-label="enter" style={{
                width: 20, height: 20, borderRadius: '50%', border: '1.5px solid var(--color-accent)', background: 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M8 5l12 7-12 7z" /></svg>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
