const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')
const mockData = require(path.join(__dirname, 'src/data/mockData.js'))

contextBridge.exposeInMainWorld('octopusData', mockData)

contextBridge.exposeInMainWorld('octopusBridge', {
  openPresentation: (pptPath) => ipcRenderer.invoke('open-presentation', pptPath),
})
