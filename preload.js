const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('octopusBridge', {
  openPresentation: (pptPath) => ipcRenderer.invoke('open-presentation', pptPath),
  getState: () => ipcRenderer.invoke('get-state'),
  refreshCharlas: () => ipcRenderer.invoke('refresh-charlas'),
  verifySettingsPassword: (password) => ipcRenderer.invoke('verify-settings-password', password),
  fetchSalas: ({ apiBaseUrl, codigoEvento }) => ipcRenderer.invoke('fetch-salas', { apiBaseUrl, codigoEvento }),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  onStateUpdated: (callback) => {
    const listener = (_event, state) => callback(state)
    ipcRenderer.on('state-updated', listener)
    return () => ipcRenderer.removeListener('state-updated', listener)
  },
})
