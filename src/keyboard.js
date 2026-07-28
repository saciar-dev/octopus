// Manejo de foco por teclado centralizado (Esc/flechas/Enter), compartido
// por todas las pantallas en vez de repetirse en cada una.
window.OctopusKeyboard = (function () {
  let items = []
  let focusIndex = -1

  function focusTarget(el) {
    return el.closest('tr') || el
  }

  function updateFocusVisual() {
    items.forEach((el, i) => {
      focusTarget(el).classList.toggle('row--focused', i === focusIndex)
    })
    if (focusIndex >= 0) {
      focusTarget(items[focusIndex]).scrollIntoView({ block: 'nearest' })
    }
  }

  function setFocusGroup(newItems) {
    items = newItems || []
    focusIndex = items.length ? 0 : -1
    updateFocusVisual()
  }

  function move(delta) {
    if (!items.length) return
    focusIndex = (focusIndex + delta + items.length) % items.length
    updateFocusVisual()
  }

  function confirmFocused() {
    if (focusIndex >= 0 && items[focusIndex]) items[focusIndex].click()
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      window.OctopusApp.goBack()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      move(-1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      confirmFocused()
    }
  })

  return { setFocusGroup }
})()
