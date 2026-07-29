const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')
const mockData = require(path.join(__dirname, 'src/data/mockData.js'))

contextBridge.exposeInMainWorld('octopusData', mockData)

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
