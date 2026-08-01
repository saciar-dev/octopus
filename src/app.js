window.OctopusApp = (function () {
  const root = document.getElementById('app')
  const screens = {}
  const history = []
  let current = null
  let lastDownloadPayload = { status: 'idle' }

  const DOWNLOAD_SPINNER_ICON = `<svg class="footer-progress-icon footer-progress-icon--spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 1-9 9" /></svg>`
  const DOWNLOAD_WARNING_ICON = `<svg class="footer-progress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.9 21h16.2a2 2 0 0 0 1.79-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>`

  function updateDownloadFooters() {
    const payload = lastDownloadPayload
    let modifier = ''
    let html = ''
    if (payload.status === 'downloading') {
      modifier = ' screen-footer--downloading'
      html = `${DOWNLOAD_SPINNER_ICON}<span class="footer-progress-text">Downloading ${payload.resolved}/${payload.total}</span>`
    } else if (payload.status === 'failed') {
      modifier = ' screen-footer--failed'
      html = `${DOWNLOAD_WARNING_ICON}<span class="footer-progress-text">${payload.failed} failed</span>`
    }
    document.querySelectorAll('.screen-footer').forEach((footer) => {
      footer.className = `screen-footer${modifier}`
      footer.innerHTML = html
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
    root.innerHTML = ''
    root.appendChild(renderFn(current.params))
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
    })
    window.octopusBridge.getState().then((state) => {
      applyThemeAttributes(state)
      current = { name: 'splash', params: undefined }
      renderCurrent()
    })
  })

  return { register, show, goBack, reset, refreshInPlace }
})()
