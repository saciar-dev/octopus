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
  if (tipo === 'qr') return path.join(getImagenesDir(), 'profile', imagen, 'qr', qr)
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

module.exports = {
  getImagenesDir,
  buildDownloadUrl,
  buildLocalPath,
  downloadImage,
}
