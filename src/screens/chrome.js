window.OctopusChrome = (function () {
  // El logo circular de congreso todavía no tiene un asset final propio
  // (ver mockData.congress.logo); se reutiliza el logo-mark de Octopus
  // como placeholder visual, tal como hace el ui-kit de referencia.
  function renderHeader(congress) {
    const el = document.createElement('div')
    el.className = 'app-header'
    el.innerHTML = `
      <div class="app-header-brand">
        <div class="app-header-badge">
          <img src="references/assets/logo-mark.png" alt="" />
        </div>
        <div class="app-header-title">${congress.name}</div>
      </div>
      <div class="app-header-room">ROOM <span>${congress.room}</span></div>
    `
    return el
  }

  function renderFooter() {
    const el = document.createElement('div')
    el.className = 'screen-footer'
    return el
  }

  function renderFloatingActions({ onBack, onReset, extra, showReset = true } = {}) {
    const el = document.createElement('div')
    el.className = 'floating-actions'
    el.innerHTML = `
      <button class="icon-btn icon-btn--sm floating-back" aria-label="back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      ${
        showReset
          ? `<button class="icon-btn icon-btn--sm icon-btn--navy floating-reset" aria-label="reset">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 1 2.34 5.66M4 12V6m0 6h6" /></svg>
      </button>`
          : ''
      }
    `
    el.querySelector('.floating-back').addEventListener('click', () => {
      if (onBack) onBack()
      else console.log('[Octopus] back placeholder clicked')
    })
    const resetBtn = el.querySelector('.floating-reset')
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (onReset) onReset()
        else console.log('[Octopus] reset placeholder clicked')
      })
    }
    if (extra) el.appendChild(extra)
    return el
  }

  return { renderHeader, renderFooter, renderFloatingActions }
})()
