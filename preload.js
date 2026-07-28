const { contextBridge } = require('electron')
const path = require('path')
const mockData = require(path.join(__dirname, 'src/data/mockData.js'))

contextBridge.exposeInMainWorld('octopusData', mockData)
