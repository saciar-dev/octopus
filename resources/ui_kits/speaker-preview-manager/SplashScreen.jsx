function SplashScreen({ onPlay }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-page)' }}>
      <div style={{ height: 44, background: '#f0f2f6', borderBottom: '1px solid var(--color-border)' }} />
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 48 }}>
        <button style={{ position: 'absolute', top: 24, right: 28, width: 46, height: 46, borderRadius: '50%', background: 'var(--color-accent)', border: 'none', color: '#fff', boxShadow: 'var(--shadow-btn)', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style={{ margin: 'auto' }}><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 3.4l-1.9-.3a7.1 7.1 0 00-.6-1.5l1.1-1.6-1.5-1.5-1.6 1.1a7.1 7.1 0 00-1.5-.6L15 3H9l-.3 1.9c-.5.1-1 .3-1.5.6L5.6 4.4 4.1 5.9l1.1 1.6c-.3.5-.5 1-.6 1.5L3 9.4v5.2l1.9.3c.1.5.3 1 .6 1.5l-1.1 1.6 1.5 1.5 1.6-1.1c.5.3 1 .5 1.5.6L9 21h6l.3-1.9c.5-.1 1-.3 1.5-.6l1.6 1.1 1.5-1.5-1.1-1.6c.3-.5.5-1 .6-1.5l1.9-.3z" /></svg>
        </button>
        <img src="../../assets/logo_octopus.png" style={{ height: 160 }} />
        <button onClick={onPlay} style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--color-accent)', border: 'none', boxShadow: 'var(--shadow-btn)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M8 5l12 7-12 7z" /></svg>
        </button>
      </div>
      <div style={{ height: 10, background: 'var(--color-brand-primary)' }} />
    </div>
  );
}

window.SpeakerPreviewChrome = Object.assign(window.SpeakerPreviewChrome || {}, { SplashScreen });
