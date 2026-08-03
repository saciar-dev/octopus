const fs = require('fs')
const { execFile } = require('child_process')

const KEYNOTE_APP_PATH = '/Applications/Keynote.app'

const findKeynoteApp = () => {
  return fs.existsSync(KEYNOTE_APP_PATH) ? KEYNOTE_APP_PATH : null
}

const STOP_AND_CLOSE_SCRIPT = `
tell application "Keynote"
  if it is running then
    try
      stop
    end try
    close every document
  end if
end tell
`

const ACTIVATE_AND_PRESENT_SCRIPT = `
tell application "Keynote"
  activate
  repeat 20 times
    if (count of documents) > 0 then
      start (document 1)
      return
    end if
    delay 0.25
  end repeat
end tell
error "No se pudo iniciar la presentacion: el documento no cargo a tiempo."
`

const runOsascript = (script) => {
  return new Promise((resolve, reject) => {
    execFile('osascript', ['-e', script], (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr ? stderr.trim() : error.message))
        return
      }
      resolve()
    })
  })
}

const openWithLaunchServices = (localPath) => {
  return new Promise((resolve, reject) => {
    execFile('open', ['-a', 'Keynote', localPath], (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr ? stderr.trim() : error.message))
        return
      }
      resolve()
    })
  })
}

const openInKeynote = async (localPath) => {
  await runOsascript(STOP_AND_CLOSE_SCRIPT)
  await openWithLaunchServices(localPath)
  await runOsascript(ACTIVATE_AND_PRESENT_SCRIPT)
}

module.exports = { findKeynoteApp, openInKeynote }
