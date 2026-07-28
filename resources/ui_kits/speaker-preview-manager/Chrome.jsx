function Header({ room = 'A' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', background: '#fff', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-accent-soft)' }}>
          <img src="../../assets/logo-mark.png" style={{ width: 30, filter: 'brightness(0) invert(1)' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: 'var(--fs-h2)', color: 'var(--color-brand-primary)', letterSpacing: 0.3 }}>
          INTERNATIONAL CONGRESS OF VARIATIC SURGERY
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body-lg)', color: 'var(--color-text-muted)' }}>
        ROOM <span style={{ color: 'var(--color-accent-soft)', fontWeight: 'var(--fw-bold)' }}>{room}</span>
      </div>
    </div>
  );
}

function Footer() {
  return <div style={{ height: 10, background: 'var(--color-brand-primary)' }} />;
}

window.SpeakerPreviewChrome = Object.assign(window.SpeakerPreviewChrome || {}, { Header, Footer });
