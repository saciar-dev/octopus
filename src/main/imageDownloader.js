const fs = require('node:fs')
const fsPromises = require('node:fs/promises')
const path = require('node:path')
const { app } = require('electron/main')

const getImagenesDir = () => path.join(app.getPath('userData'), 'imagenes')

const buildDownloadUrl = ({ tipo, imagen, qr }, config) => {
  const base = `${config.apiBaseUrl.replace(/\/$/, '')}/img/${config.codigoEvento}`
  if (tipo === 'profile') return `${base}/profile/${imagen}`
  if (tipo === 'qr') return `${base}/profile/${imagen}/qr/${qr}`
  if (tipo === 'sponsor') return `${base}/sponsor/${imagen}`
  throw new Error(`Tipo de imagen desconocido: ${tipo}`)
}

const buildLocalPath = ({ tipo, imagen, qr }) => {
  if (tipo === 'profile') return path.join(getImagenesDir(), 'profile', imagen)
  if (tipo === 'qr') return path.join(getImagenesDir(), 'qr', qr)
  if (tipo === 'sponsor') return path.join(getImagenesDir(), 'sponsor', imagen)
  throw new Error(`Tipo de imagen desconocido: ${tipo}`)
}

const downloadImage = async (item, config) => {
  const url = buildDownloadUrl(item, config)
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Descarga de imagen falló (${response.status}): ${url}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())

  const localPath = buildLocalPath(item)
  await fsPromises.mkdir(path.dirname(localPath), { recursive: true })
  await fsPromises.writeFile(localPath, buffer)

  return localPath
}

const isImageDownloaded = (item) => fs.existsSync(buildLocalPath(item))

const buildItemKey = ({ tipo, imagen, qr }) => `${tipo}:${imagen}:${qr ?? ''}`

const collectImageItems = (sessionsByDate) => {
  const items = new Map()
  const add = (item) => items.set(buildItemKey(item), item)

  for (const bloques of Object.values(sessionsByDate)) {
    for (const bloque of bloques) {
      for (const charla of bloque.charlas) {
        const { photo, sponsor, followMeQr } = charla.speaker
        if (photo !== null) {
          add({ tipo: 'profile', imagen: photo })
          if (followMeQr !== null) {
            add({ tipo: 'qr', imagen: photo, qr: followMeQr })
          }
        }
        if (sponsor !== null && sponsor.logo !== null) {
          add({ tipo: 'sponsor', imagen: sponsor.logo })
        }
      }
    }
  }
  return [...items.values()]
}

let imageDownloadQueue = []
let imageQueueRunning = false

const processImageQueue = async (config) => {
  if (imageQueueRunning || imageDownloadQueue.length === 0) return
  imageQueueRunning = true
  while (imageDownloadQueue.length > 0) {
    const item = imageDownloadQueue.shift()
    try {
      await downloadImage(item, config)
    } catch (err) {
      console.error(`Error al descargar imagen ${buildItemKey(item)}:`, err.message)
    }
  }
  imageQueueRunning = false
}

const enqueueImageDownloads = (sessionsByDate, config) => {
  const queuedKeys = new Set(imageDownloadQueue.map(buildItemKey))
  const pending = collectImageItems(sessionsByDate).filter(
    (item) => !queuedKeys.has(buildItemKey(item)) && !isImageDownloaded(item)
  )
  imageDownloadQueue.push(...pending)
  processImageQueue(config)
}

module.exports = {
  getImagenesDir,
  buildDownloadUrl,
  buildLocalPath,
  downloadImage,
  isImageDownloaded,
  enqueueImageDownloads,
}
