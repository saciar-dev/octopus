const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('octopusBridge', {
  openPresentation: (payload) => ipcRenderer.invoke('open-presentation', payload),
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
  onDownloadProgress: (callback) => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('download-progress', listener)
    return () => ipcRenderer.removeListener('download-progress', listener)
  },
  onDisplayChanged: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('display-changed', listener)
    return () => ipcRenderer.removeListener('display-changed', listener)
  },
})
