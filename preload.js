const { contextBridge } = require('electron')
const mockData = require('./src/data/mockData.js')

contextBridge.exposeInMainWorld('octopusData', mockData)
