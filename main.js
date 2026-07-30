const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const fs = require('node:fs')
const { execFile } = require('node:child_process')
const { fetchSalas } = require('./src/main/apiClient')
const {
  fetchInitialData,
  startPeriodicRefresh,
  getState,
  onStateChange,
  refreshCharlas,
  applyConfigDefaults,
  setSettings,
} = require('./src/main/appState')

const CONFIG_PATH = path.join(__dirname, 'config.json')

let config = applyConfigDefaults(require('./config.json'))

let mainWindow

const findPowerPointExecutable = () => {
  const programFilesDirs = [
    process.env['ProgramFiles'],
    process.env['ProgramFiles(x86)'],
  ].filter(Boolean)

  const officeVersionDirs = [
    'Office16', // Office 2016/2019/2021/365
    'Office15', // Office 2013
    'Office14', // Office 2010
  ]

  for (const programFilesDir of programFilesDirs) {
    for (const officeVersionDir of officeVersionDirs) {
      const candidate = path.join(programFilesDir, 'Microsoft Office', 'root', officeVersionDir, 'POWERPNT.EXE')
      if (fs.existsSync(candidate)) {
        return candidate
      }

      const candidateLegacy = path.join(programFilesDir, 'Microsoft Office', officeVersionDir, 'POWERPNT.EXE')
      if (fs.existsSync(candidateLegacy)) {
        return candidateLegacy
      }
    }
  }

  return null
}

const createWindow = () => {
  const win = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  })

  win.loadFile('index.html')
  mainWindow = win
}

ipcMain.handle('open-presentation', (_event, pptPath) => {
  if (!fs.existsSync(pptPath)) {
    return { success: false, error: `No se encontró el archivo de presentación: ${pptPath}` }
  }

  const powerPointExecutable = findPowerPointExecutable()
  if (!powerPointExecutable) {
    return { success: false, error: 'No se encontró PowerPoint instalado en este equipo.' }
  }

  execFile(powerPointExecutable, ['/S', pptPath], (error) => {
    if (error) {
      console.error('Error al abrir PowerPoint:', error)
    }
  })

  return { success: true }
})

ipcMain.handle('get-state', () => getState())

ipcMain.handle('refresh-charlas', () => refreshCharlas(config))

ipcMain.handle('verify-settings-password', (_event, password) => password === config.settingsPassword)

ipcMain.handle('fetch-salas', (_event, { apiBaseUrl, codigoEvento }) => fetchSalas({ apiBaseUrl, codigoEvento }))

ipcMain.handle('save-settings', (_event, newSettings) => {
  const { apiBaseUrl, codigoEvento, idSala, theme, accentColor } = newSettings

  if (!apiBaseUrl || !codigoEvento || !idSala) {
    return { success: false, error: 'Los campos de conexión (URL, código de evento y sala) son obligatorios.' }
  }

  const updatedConfig = { ...config, apiBaseUrl, codigoEvento, idSala, theme, accentColor }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2))

  config = applyConfigDefaults(updatedConfig)
  setSettings(config)
  fetchInitialData(config)

  return { success: true }
})

onStateChange((state) => {
  if (mainWindow) {
    mainWindow.webContents.send('state-updated', state)
  }
})

app.whenReady().then(() => {
  createWindow()
  fetchInitialData(config)
  startPeriodicRefresh(() => config)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})