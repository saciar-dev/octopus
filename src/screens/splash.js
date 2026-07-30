(function () {
  let unsubscribeFromPrevious = null

  function render() {
    if (unsubscribeFromPrevious) {
      unsubscribeFromPrevious()
      unsubscribeFromPrevious = null
    }
    const el = document.createElement('div')
    el.className = 'screen screen-splash'
    el.innerHTML = `
      <div class="splash-topbar"></div>
      <div class="splash-body">
        <button class="icon-btn splash-gear" aria-label="settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3.2"></circle>
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"></path>
          </svg>
        </button>
        <img class="splash-logo" src="references/assets/logo_octopus.png" alt="Octopus — Speaker Preview Manager" />
        <div class="splash-loading" hidden></div>
        <button class="icon-btn splash-play" aria-label="play" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>
        </button>
      </div>
      <div class="screen-footer"></div>
    `

    const playBtn = el.querySelector('.splash-play')
    const loadingEl = el.querySelector('.splash-loading')

    function applyState(state) {
      if (state.status === 'ready') {
        playBtn.disabled = false
        loadingEl.hidden = true
        loadingEl.textContent = ''
      } else if (state.status === 'error') {
        playBtn.disabled = true
        loadingEl.hidden = false
        loadingEl.textContent = 'No se pudo conectar. Reintentando...'
      } else {
        playBtn.disabled = true
        loadingEl.hidden = false
        loadingEl.textContent = 'Cargando datos...'
      }
    }

    applyState(window.OctopusState.getState())
    unsubscribeFromPrevious = window.OctopusState.subscribe(applyState)

    el.querySelector('.splash-gear').addEventListener('click', () => {
      window.OctopusApp.show('config')
    })

    playBtn.addEventListener('click', () => {
      if (playBtn.disabled) return
      window.OctopusApp.show('schedule')
    })

    return el
  }

  window.OctopusApp.register('splash', render)
})()
