window.OctopusScale = (function () {
  const BASE_WIDTH = 1920
  const BASE_HEIGHT = 1080

  function apply() {
    const app = document.getElementById('app')
    if (!app) return
    // clientWidth/clientHeight reflect the actual laid-out viewport (no
    // scrollbar, already settled after resize/maximize), more reliable
    // than window.innerWidth/innerHeight in a windowed/maximized state.
    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = document.documentElement.clientHeight
    const scale = Math.min(viewportWidth / BASE_WIDTH, viewportHeight / BASE_HEIGHT)
    const left = (viewportWidth - BASE_WIDTH * scale) / 2
    const top = (viewportHeight - BASE_HEIGHT * scale) / 2
    app.style.transform = `translate(${left}px, ${top}px) scale(${scale})`
  }

  window.addEventListener('resize', apply)
  document.addEventListener('DOMContentLoaded', apply)

  if (window.ResizeObserver) {
    new ResizeObserver(apply).observe(document.documentElement)
  }

  if (window.octopusBridge && window.octopusBridge.onDisplayChanged) {
    window.octopusBridge.onDisplayChanged(() => {
      apply()
      setTimeout(apply, 100)
      setTimeout(apply, 300)
    })
  }

  return { apply }
})()
