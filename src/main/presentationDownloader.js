const fs = require('node:fs')
const fsPromises = require('node:fs/promises')
const path = require('node:path')
const { app } = require('electron/main')

const getPresentacionesDir = () => path.join(app.getPath('userData'), 'presentaciones')
const getManifestPath = () => path.join(getPresentacionesDir(), 'manifest.json')

const buildDownloadUrl = (presentacion, config) =>
  `${config.ftpBaseUrl.replace(/\/$/, '')}/sync/ftpspace/${config.codigoEvento}/${presentacion.nombreArchivo}`

const buildLocalPath = (presentacion) =>
  path.join(getPresentacionesDir(), `${presentacion.id}${presentacion.extension}`)

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

const isDownloaded = (presentacion) => {
  const manifest = readManifest()
  const entry = manifest[String(presentacion.id)]
  if (entry === undefined || entry !== presentacion.actualizado) {
    return false
  }
  return fs.existsSync(buildLocalPath(presentacion))
}

const downloadPresentacion = async (presentacion, config) => {
  const url = buildDownloadUrl(presentacion, config)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Descarga de presentación falló (${response.status}): ${url}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())

  await fsPromises.mkdir(getPresentacionesDir(), { recursive: true })
  const localPath = buildLocalPath(presentacion)
  await fsPromises.writeFile(localPath, buffer)

  const manifest = readManifest()
  manifest[String(presentacion.id)] = presentacion.actualizado
  writeManifest(manifest)

  return localPath
}

const resolveLocalPath = (presentacion) => buildLocalPath(presentacion)

let downloadQueue = []
let queueRunning = false
const inFlightDownloads = new Map()

const runDownload = (presentacion, config) => {
  const id = String(presentacion.id)
  const existing = inFlightDownloads.get(id)
  if (existing) {
    return existing
  }
  const promise = downloadPresentacion(presentacion, config).finally(() => {
    inFlightDownloads.delete(id)
  })
  inFlightDownloads.set(id, promise)
  return promise
}

const downloadOnDemand = (presentacion, config) => runDownload(presentacion, config)

const collectPresentaciones = (sessionsByDate) => {
  const presentaciones = []
  for (const bloques of Object.values(sessionsByDate)) {
    for (const bloque of bloques) {
      for (const charla of bloque.charlas) {
        const presentacion = charla.speaker.presentacion
        if (presentacion !== null) {
          presentaciones.push(presentacion)
        }
      }
    }
  }
  return presentaciones
}

const processQueue = async (config) => {
  if (queueRunning) return
  queueRunning = true
  while (downloadQueue.length > 0) {
    const presentacion = downloadQueue.shift()
    try {
      await runDownload(presentacion, config)
    } catch (err) {
      console.error(`Error al descargar presentación ${presentacion.id}:`, err.message)
    }
  }
  queueRunning = false
}

const enqueueDownloads = (sessionsByDate, config) => {
  const queuedIds = new Set(downloadQueue.map((p) => String(p.id)))
  const pending = collectPresentaciones(sessionsByDate).filter(
    (p) => !queuedIds.has(String(p.id)) && !isDownloaded(p)
  )
  downloadQueue.push(...pending)
  processQueue(config)
}

module.exports = { downloadPresentacion, isDownloaded, resolveLocalPath, enqueueDownloads, downloadOnDemand }
