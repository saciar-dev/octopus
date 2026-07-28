function SpeakerScreen({ session, showSponsor, onBack }) {
  const { Header, Footer } = window.SpeakerPreviewChrome;
  const { SectionLabel, IconButton, SocialIcons } = window.OctopusDesignSystem_492d91;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-page)' }}>
      <Header />
      <div style={{ flex: 1, padding: '28px 32px', display: 'flex', gap: 28 }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--color-bg-sunken)', border: '3px solid var(--color-border-strong)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: 30 }}>
          {session.speaker.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div style={{ flex: 1 }}>
          <SectionLabel>{session.title}</SectionLabel>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-h3)', color: 'var(--color-brand-primary)', margin: '8px 0 6px' }}>{session.speaker}, {session.country}</div>
          <SocialIcons basePath="../../" />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)', color: 'var(--color-link)', lineHeight: 'var(--lh-normal)', marginTop: 16, maxWidth: 640 }}>{session.bio}</p>
        </div>
        <div style={{ width: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          {showSponsor && (
            <div style={{ width: 140, height: 90, border: '2px solid var(--color-accent)', clipPath: 'polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--color-accent)' }}>Sponsor</div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)', color: 'var(--color-brand-primary)', marginBottom: 8 }}>FOLLOW ME</div>
            <div style={{ width: 120, height: 120, background: 'repeating-conic-gradient(#232838 0% 25%, #fff 0% 50%) 0 0/16px 16px', border: '4px solid #fff', boxShadow: 'var(--shadow-sm)' }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 32px 16px' }}>
        <IconButton icon="back" onClick={onBack} />
      </div>
      <Footer />
    </div>
  );
}

window.SpeakerPreviewChrome = Object.assign(window.SpeakerPreviewChrome || {}, { SpeakerScreen });
