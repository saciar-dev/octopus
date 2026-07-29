const fetchJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`)
  }
  return response.json()
}

const fetchCongress = (config) =>
  fetchJson(`${config.apiBaseUrl}/api/${config.codigoEvento}`)

const fetchSalas = (config) =>
  fetchJson(`${config.apiBaseUrl}/api/${config.codigoEvento}/salas`)

const fetchCharlas = (config) =>
  fetchJson(`${config.apiBaseUrl}/api/${config.codigoEvento}/charlas/${config.idSala}`)

module.exports = { fetchCongress, fetchSalas, fetchCharlas }
