const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')
const fs = require('node:fs')

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
}

app.whenReady().then(() => {
  createWindow()

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