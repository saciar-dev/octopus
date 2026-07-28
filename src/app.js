window.OctopusApp = (function () {
  const root = document.getElementById('app')
  const screens = {}
  const history = []
  let current = null

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
  }

  document.addEventListener('DOMContentLoaded', () => {
    current = { name: 'splash', params: undefined }
    renderCurrent()
  })

  return { register, show, goBack, reset }
})()
