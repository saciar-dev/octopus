const { app, BrowserWindow, ipcMain, shell } = require('electron/main')
const path = require('node:path')
const fs = require('node:fs')
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
const { isDownloaded, resolveLocalPath, downloadOnDemand } = require('./src/main/presentationDownloader')

const CONFIG_PATH = path.join(__dirname, 'config.json')

let config = applyConfigDefaults(require('./config.json'))

let mainWindow

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

ipcMain.handle('open-presentation', async (_event, presentacion) => {
  let localPath
  if (isDownloaded(presentacion)) {
    localPath = resolveLocalPath(presentacion)
  } else {
    try {
      localPath = await downloadOnDemand(presentacion, config)
    } catch (err) {
      return { success: false, error: `No se pudo descargar la presentación: ${err.message}` }
    }
  }

  const openError = await shell.openPath(localPath)
  if (openError) {
    return { success: false, error: `No se pudo abrir el archivo de presentación: ${openError}` }
  }

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