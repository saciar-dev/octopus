function ScheduleScreen({ days, active, onDayChange, onEnterSession, onBack }) {
  const { Header, Footer } = window.SpeakerPreviewChrome;
  const { SectionLabel, Tabs, ScheduleTable, IconButton } = window.OctopusDesignSystem_492d91;
  const day = days.find(d => d.date === active) || days[0];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-page)' }}>
      <Header />
      <div style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel size="lg">WELCOME</SectionLabel>
        <Tabs items={days.map(d => d.date)} active={active} onChange={onDayChange} />
        <ScheduleTable rows={day.sessions} onEnter={row => onEnterSession(day, row)} />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <IconButton icon="back" onClick={onBack} />
          <IconButton icon="refresh" variant="navy" />
        </div>
      </div>
      <Footer />
    </div>
  );
}

window.SpeakerPreviewChrome = Object.assign(window.SpeakerPreviewChrome || {}, { ScheduleScreen });
