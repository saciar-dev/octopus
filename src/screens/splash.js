(function () {
  let unsubscribeFromPrevious = null
  let unsubscribeDownloadFromPrevious = null

  function render() {
    if (unsubscribeFromPrevious) {
      unsubscribeFromPrevious()
      unsubscribeFromPrevious = null
    }
    if (unsubscribeDownloadFromPrevious) {
      unsubscribeDownloadFromPrevious()
      unsubscribeDownloadFromPrevious = null
    }
    const el = document.createElement('div')
    el.className = 'screen screen-splash'
    el.innerHTML = `
      <div class="splash-wave">
        <svg viewBox="0 0 400 100" preserveAspectRatio="none">
          <path d="M0,0 L400,0 L400,55 C320,90 280,20 200,45 C120,70 80,10 0,55 Z"></path>
        </svg>
      </div>
      <div class="splash-body">
        <div class="splash-main">
          <img class="splash-mascot" src="references/assets/logo-mark.png" alt="" />
          <h1 class="splash-word">Octopus</h1>
          <p class="splash-sub">Speaker Preview Manager</p>
        </div>
        <button class="icon-btn splash-play" aria-label="play" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>
        </button>
        <div class="splash-pulse">
          <svg class="splash-pulse-trace" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path class="splash-pulse-trace-beat" pathLength="100" d="M0,20 L60,20 L74,4 L88,36 L102,20 L200,20"></path>
            <path class="splash-pulse-trace-drop" pathLength="100" d="M0,10 L70,10 L120,34 L200,34"></path>
          </svg>
          <span class="splash-pulse-label"></span>
        </div>
        <button class="icon-btn splash-gear" aria-label="settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3.2"></circle>
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"></path>
          </svg>
        </button>
      </div>
      <div class="screen-footer"></div>
    `

    const playBtn = el.querySelector('.splash-play')
    const pulseEl = el.querySelector('.splash-pulse')
    const pulseLabel = el.querySelector('.splash-pulse-label')

    let lastDataState = window.OctopusState.getState()
    let lastDownloadPayload = window.OctopusApp.getDownloadPayload()

    function applyState() {
      pulseEl.classList.remove('is-ready', 'is-loading', 'is-error')
      if (lastDownloadPayload.status === 'downloading') {
        playBtn.disabled = true
        pulseEl.classList.add('is-loading')
        pulseLabel.textContent = 'Descargando presentación...'
      } else if (lastDownloadPayload.status === 'failed') {
        playBtn.disabled = true
        pulseEl.classList.add('is-error')
        pulseLabel.textContent = 'La descarga falló. Reintentando...'
      } else if (lastDataState.status === 'ready') {
        playBtn.disabled = false
        pulseEl.classList.add('is-ready')
        pulseLabel.textContent = 'Ready to preview'
      } else if (lastDataState.status === 'error') {
        playBtn.disabled = true
        pulseEl.classList.add('is-error')
        pulseLabel.textContent = 'No se pudo conectar. Reintentando...'
      } else {
        playBtn.disabled = true
        pulseEl.classList.add('is-loading')
        pulseLabel.textContent = 'Cargando datos...'
      }
    }

    applyState()
    unsubscribeFromPrevious = window.OctopusState.subscribe((state) => {
      lastDataState = state
      applyState()
    })
    unsubscribeDownloadFromPrevious = window.OctopusApp.subscribeDownload((payload) => {
      lastDownloadPayload = payload
      applyState()
    })

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
