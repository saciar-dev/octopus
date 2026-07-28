(function () {
  function render() {
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
        <button class="icon-btn splash-play" aria-label="play">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>
        </button>
      </div>
      <div class="screen-footer"></div>
    `

    el.querySelector('.splash-gear').addEventListener('click', () => {
      console.log('[Octopus] Settings placeholder clicked')
    })

    el.querySelector('.splash-play').addEventListener('click', () => {
      window.OctopusApp.show('schedule')
    })

    return el
  }

  window.OctopusApp.register('splash', render)
})()
