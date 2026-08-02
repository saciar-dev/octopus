const { app, BrowserWindow, ipcMain, shell, screen } = require('electron/main')
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
const { isDownloaded, resolveLocalPath, downloadOnDemand, downloadEvents } = require('./src/main/presentationDownloader')
const { findKeynoteApp, openInKeynote } = require('./src/main/keynoteOpener')

const CONFIG_PATH = path.join(__dirname, 'config.json')

let config = applyConfigDefaults(require('./config.json'))

let mainWindow

const PRESENTATION_EXTENSIONS = ['.ppt', '.pptx']

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

const resolveOpenStrategy = (extension) => {
  if (process.platform === 'win32' && PRESENTATION_EXTENSIONS.includes(extension) && findPowerPointExecutable()) {
    return 'powerpoint'
  }

  if (process.platform === 'darwin' && extension === '.key') {
    return 'keynote'
  }

  return 'shell'
}

const createWindow = () => {
  const win = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  })

  const notifyDisplayChanged = () => win.webContents.send('display-changed')
  win.on('resize', notifyDisplayChanged)
  win.on('move', notifyDisplayChanged)

  win.loadFile('index.html')
  mainWindow = win
}

ipcMain.handle('open-presentation', async (_event, { presentacion, fecha, disertante, charlaId }) => {
  const context = { fecha, disertante, charlaId }
  let localPath
  if (isDownloaded(presentacion, context)) {
    localPath = resolveLocalPath(presentacion, context)
  } else {
    try {
      localPath = await downloadOnDemand(presentacion, config, context)
    } catch (err) {
      return { success: false, error: `No se pudo descargar la presentación: ${err.message}` }
    }
  }

  const extension = (presentacion.extension || '').toLowerCase()
  const strategy = resolveOpenStrategy(extension)

  if (strategy === 'powerpoint') {
    const powerPointExecutable = findPowerPointExecutable()
    execFile(powerPointExecutable, ['/S', localPath], (error) => {
      if (error) {
        console.error('Error al abrir PowerPoint en modo presentación:', error)
      }
    })
    return { success: true }
  }

  if (strategy === 'keynote') {
    if (!findKeynoteApp()) {
      return { success: false, error: 'No se pudo abrir la presentación en Keynote: Keynote no está instalado en este equipo.' }
    }

    try {
      await openInKeynote(localPath)
      return { success: true }
    } catch (err) {
      return { success: false, error: `No se pudo abrir la presentación en Keynote: ${err.message}` }
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

downloadEvents.on('progress', (payload) => {
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', payload)
  }
})

app.whenReady().then(() => {
  createWindow()
  fetchInitialData(config)
  startPeriodicRefresh(() => config)

  screen.on('display-metrics-changed', () => {
    if (mainWindow) mainWindow.webContents.send('display-changed')
  })

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