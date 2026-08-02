const fs = require('fs')
const { execFile } = require('child_process')

const KEYNOTE_APP_PATH = '/Applications/Keynote.app'

const findKeynoteApp = () => {
  return fs.existsSync(KEYNOTE_APP_PATH) ? KEYNOTE_APP_PATH : null
}

const OPEN_AND_PRESENT_SCRIPT = `
on run argv
  set thePath to item 1 of argv
  tell application "Keynote"
    if it is running then
      close every document
    end if
    activate
    set theDoc to open POSIX file thePath
    start theDoc
  end tell
end run
`

const openInKeynote = (localPath) => {
  return new Promise((resolve, reject) => {
    execFile('osascript', ['-e', OPEN_AND_PRESENT_SCRIPT, localPath], (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr ? stderr.trim() : error.message))
        return
      }
      resolve()
    })
  })
}

module.exports = { findKeynoteApp, openInKeynote }
