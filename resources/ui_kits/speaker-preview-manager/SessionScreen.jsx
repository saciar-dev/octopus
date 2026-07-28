function SessionScreen({ session, onGo, onBack }) {
  const { Header, Footer } = window.SpeakerPreviewChrome;
  const { SectionLabel, IconButton, Button } = window.OctopusDesignSystem_492d91;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-page)' }}>
      <Header />
      <div style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel size="lg">{session.enter} - {session.end}</SectionLabel>
        <div style={{ background: '#fff', border: '1px solid var(--color-border-strong)', padding: 24, flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-h3)', color: 'var(--color-brand-primary)' }}>{session.speaker}, {session.country}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body-lg)', color: 'var(--color-accent-warm)', marginTop: 6 }}>{session.title}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <IconButton icon="back" onClick={onBack} />
          <Button variant="primary" size="lg" onClick={onGo}>Go</Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

window.SpeakerPreviewChrome = Object.assign(window.SpeakerPreviewChrome || {}, { SessionScreen });
