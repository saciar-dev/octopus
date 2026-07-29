const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('octopusBridge', {
  openPresentation: (pptPath) => ipcRenderer.invoke('open-presentation', pptPath),
  getState: () => ipcRenderer.invoke('get-state'),
  refreshCharlas: () => ipcRenderer.invoke('refresh-charlas'),
  onStateUpdated: (callback) => {
    const listener = (_event, state) => callback(state)
    ipcRenderer.on('state-updated', listener)
    return () => ipcRenderer.removeListener('state-updated', listener)
  },
})
