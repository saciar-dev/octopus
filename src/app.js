window.OctopusApp = (function () {
  const root = document.getElementById('app')
  const screens = {}

  function register(name, renderFn) {
    screens[name] = renderFn
  }

  function show(name, params) {
    const renderFn = screens[name]
    if (!renderFn) {
      console.warn(`[Octopus] Screen "${name}" is not implemented yet`)
      return
    }
    root.innerHTML = ''
    root.appendChild(renderFn(params))
  }

  document.addEventListener('DOMContentLoaded', () => {
    show('splash')
  })

  return { register, show }
})()
