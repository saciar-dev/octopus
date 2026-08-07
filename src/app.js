window.OctopusApp = (function () {
  const root = document.getElementById('app')
  const screens = {}
  const history = []
  const downloadListeners = []
  let current = null
  let lastDownloadPayload = { status: 'idle' }
  let activeScreenNode = null
  const SCREEN_TRANSITION_MS = 200 // matches --dur-normal en src/styles/app.css

  const DOWNLOAD_SPINNER_ICON = `<svg class="footer-progress-icon footer-progress-icon--spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 1-9 9" /></svg>`
  const DOWNLOAD_WARNING_ICON = `<svg class="footer-progress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.9 21h16.2a2 2 0 0 0 1.79-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>`

  function updateDownloadFooters() {
    const payload = lastDownloadPayload
    let modifier = ''
    let html = ''
    if (payload.status === 'downloading') {
      modifier = ' footer-progress-overlay--visible'
      html = `${DOWNLOAD_SPINNER_ICON}<span class="footer-progress-text">Downloading ${payload.resolved}/${payload.total}</span>`
    } else if (payload.status === 'failed') {
      modifier = ' footer-progress-overlay--visible footer-progress-overlay--failed'
      html = `${DOWNLOAD_WARNING_ICON}<span class="footer-progress-text">${payload.failed} failed</span>`
    }
    document.querySelectorAll('.screen-footer').forEach((footer) => {
      footer.innerHTML = `<div class="footer-progress-overlay${modifier}">${html}</div>`
    })
  }

  function register(name, renderFn) {
    screens[name] = renderFn
  }

  function renderCurrent() {
    const renderFn = screens[current.name]
    if (!renderFn) {
      console.warn(`[Octopus] Screen "${current.name}" is not implemented yet`)
      return
    }
    window.OctopusKeyboard.setFocusGroup([])

    const outgoing = activeScreenNode
    const incoming = renderFn(current.params)
    activeScreenNode = incoming

    incoming.classList.add('screen-enter')
    root.appendChild(incoming)
    if (outgoing) outgoing.classList.add('screen-exit')

    requestAnimationFrame(() => {
      incoming.classList.add('screen-enter-active')
      if (outgoing) outgoing.classList.add('screen-exit-active')
    })

    // outgoing/incoming quedan fijados por closure: aunque una navegación
    // nueva interrumpa esta transición antes de que termine, este cleanup
    // solo va a tocar su propio nodo saliente, nunca el de una transición
    // más nueva (activeScreenNode ya apunta a otro nodo en ese caso).
    setTimeout(() => {
      incoming.classList.remove('screen-enter', 'screen-enter-active')
      if (outgoing && outgoing.parentNode === root) root.removeChild(outgoing)
    }, SCREEN_TRANSITION_MS)

    updateDownloadFooters()
  }

  function show(name, params) {
    if (!screens[name]) {
      console.warn(`[Octopus] Screen "${name}" is not implemented yet`)
      return
    }
    if (current) history.push(current)
    current = { name, params }
    renderCurrent()
  }

  function goBack() {
    const previous = history.pop()
    if (!previous) return
    current = previous
    renderCurrent()
  }

  function reset() {
    history.length = 0
    current = { name: 'splash', params: undefined }
    renderCurrent()
    window.octopusBridge.refreshCharlas()
  }

  function refreshInPlace() {
    window.octopusBridge.refreshCharlas()
  }

  function getDownloadPayload() {
    return lastDownloadPayload
  }

  function subscribeDownload(listener) {
    downloadListeners.push(listener)
    return () => {
      const index = downloadListeners.indexOf(listener)
      if (index !== -1) downloadListeners.splice(index, 1)
    }
  }

  function applyThemeAttributes(state) {
    const settings = state && state.settings
    if (!settings) return
    document.documentElement.dataset.theme = settings.theme
    document.documentElement.dataset.accent = settings.accentColor
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.octopusBridge.onStateUpdated(applyThemeAttributes)
    window.octopusBridge.onDownloadProgress((payload) => {
      lastDownloadPayload = payload
      updateDownloadFooters()
      downloadListeners.forEach((listener) => listener(payload))
    })
    window.octopusBridge.getState().then((state) => {
      applyThemeAttributes(state)
      current = { name: 'splash', params: undefined }
      renderCurrent()
    })
  })

  return { register, show, goBack, reset, refreshInPlace, subscribeDownload, getDownloadPayload }
})()
