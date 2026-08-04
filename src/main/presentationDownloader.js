const fs = require('node:fs')
const fsPromises = require('node:fs/promises')
const path = require('node:path')
const EventEmitter = require('node:events')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const { app } = require('electron/main')

const execFileAsync = promisify(execFile)

const downloadEvents = new EventEmitter()
const emitProgress = (payload) => downloadEvents.emit('progress', payload)

const INVALID_PATH_CHARS = /[\\/:*?"<>|]/g

const getPresentacionesDir = () => path.join(app.getPath('userData'), 'presentaciones')
const getManifestPath = () => path.join(getPresentacionesDir(), 'manifest.json')

const buildDownloadUrl = (presentacion, config) =>
  `${config.ftpBaseUrl.replace(/\/$/, '')}/sync/ftpspace/${config.codigoEvento}/${presentacion.nombreArchivo}?v=${encodeURIComponent(presentacion.actualizado)}`

const sanitizeForPath = (value) => value.replace(INVALID_PATH_CHARS, '_').trim()

const buildLocalPath = (presentacion, config, context) =>
  path.join(
    getPresentacionesDir(),
    sanitizeForPath(config.codigoEvento),
    context.fecha,
    sanitizeForPath(context.disertante),
    presentacion.nombreArchivo
  )

const buildManifestKey = (context) => `${context.fecha}_${context.charlaId}`

const readManifest = () => {
  try {
    return JSON.parse(fs.readFileSync(getManifestPath(), 'utf-8'))
  } catch (err) {
    return {}
  }
}

const writeManifest = (manifest) => {
  fs.writeFileSync(getManifestPath(), JSON.stringify(manifest, null, 2))
}

const isDownloaded = (presentacion, config, context) => {
  const manifest = readManifest()
  const entry = manifest[buildManifestKey(context)]
  if (entry === undefined || entry !== presentacion.actualizado) {
    return false
  }
  return fs.existsSync(buildLocalPath(presentacion, config, context))
}

const stripQuarantine = async (localPath) => {
  if (process.platform !== 'darwin') return
  try {
    await execFileAsync('xattr', ['-d', 'com.apple.quarantine', localPath])
  } catch (err) {
    const message = err.stderr || err.message || ''
    if (!message.includes('No such xattr')) {
      console.error(`No se pudo remover com.apple.quarantine de ${localPath}:`, message.trim() || err)
    }
  }
}

const downloadPresentacion = async (presentacion, config, context) => {
  const url = buildDownloadUrl(presentacion, config)
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Descarga de presentación falló (${response.status}): ${url}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())

  const localPath = buildLocalPath(presentacion, config, context)
  await fsPromises.mkdir(path.dirname(localPath), { recursive: true })
  await fsPromises.writeFile(localPath, buffer)
  await stripQuarantine(localPath)

  const manifest = readManifest()
  manifest[buildManifestKey(context)] = presentacion.actualizado
  writeManifest(manifest)

  return localPath
}

const resolveLocalPath = (presentacion, config, context) => buildLocalPath(presentacion, config, context)

const FAILED_MESSAGE_DURATION_MS = 6000

let downloadQueue = []
let queueRunning = false
let currentProgress = null
let failedMessageTimeout = null
const inFlightDownloads = new Map()

const runDownload = (presentacion, config, context) => {
  const key = buildManifestKey(context)
  const existing = inFlightDownloads.get(key)
  if (existing) {
    return existing
  }
  const promise = downloadPresentacion(presentacion, config, context).finally(() => {
    inFlightDownloads.delete(key)
  })
  inFlightDownloads.set(key, promise)
  return promise
}

const downloadOnDemand = (presentacion, config, context) => runDownload(presentacion, config, context)

const collectPresentaciones = (sessionsByDate) => {
  const items = []
  for (const [fecha, bloques] of Object.entries(sessionsByDate)) {
    for (const bloque of bloques) {
      for (const charla of bloque.charlas) {
        const presentacion = charla.speaker.presentacion
        if (presentacion !== null) {
          items.push({ presentacion, context: { fecha, disertante: charla.speaker.name, charlaId: charla.id } })
        }
      }
    }
  }
  return items
}

const processQueue = async (config) => {
  if (queueRunning || downloadQueue.length === 0) return
  queueRunning = true
  if (failedMessageTimeout) {
    clearTimeout(failedMessageTimeout)
    failedMessageTimeout = null
  }
  currentProgress = { total: downloadQueue.length, resolved: 0, failed: 0 }
  emitProgress({ status: 'downloading', total: currentProgress.total, resolved: currentProgress.resolved })
  while (downloadQueue.length > 0) {
    const { presentacion, context } = downloadQueue.shift()
    try {
      await runDownload(presentacion, config, context)
    } catch (err) {
      console.error(`Error al descargar presentación ${presentacion.id}:`, err.message)
      currentProgress.failed += 1
    }
    currentProgress.resolved += 1
    emitProgress({ status: 'downloading', total: currentProgress.total, resolved: currentProgress.resolved })
  }
  queueRunning = false
  if (currentProgress.failed > 0) {
    emitProgress({ status: 'failed', failed: currentProgress.failed })
    failedMessageTimeout = setTimeout(() => {
      failedMessageTimeout = null
      currentProgress = null
      emitProgress({ status: 'idle' })
    }, FAILED_MESSAGE_DURATION_MS)
  } else {
    emitProgress({ status: 'idle' })
    currentProgress = null
  }
}

const enqueueDownloads = (sessionsByDate, config) => {
  const queuedKeys = new Set(downloadQueue.map((item) => buildManifestKey(item.context)))
  const pending = collectPresentaciones(sessionsByDate).filter(
    (item) =>
      !queuedKeys.has(buildManifestKey(item.context)) &&
      !inFlightDownloads.has(buildManifestKey(item.context)) &&
      !isDownloaded(item.presentacion, config, item.context)
  )
  downloadQueue.push(...pending)
  if (queueRunning && currentProgress && pending.length > 0) {
    currentProgress.total += pending.length
    emitProgress({ status: 'downloading', total: currentProgress.total, resolved: currentProgress.resolved })
  }
  processQueue(config)
}

module.exports = {
  downloadPresentacion,
  isDownloaded,
  resolveLocalPath,
  enqueueDownloads,
  downloadOnDemand,
  downloadEvents,
}
