window.OctopusState = (function () {
  let current = { status: 'loading', data: null, error: null }
  const listeners = []

  function set(state) {
    current = state
    listeners.forEach((listener) => listener(current))
  }

  function getState() {
    return current
  }

  function subscribe(listener) {
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index !== -1) listeners.splice(index, 1)
    }
  }

  window.octopusBridge.getState().then(set)
  window.octopusBridge.onStateUpdated(set)

  return { getState, subscribe }
})()
