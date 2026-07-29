const { fetchCongress, fetchSalas, fetchCharlas } = require('./apiClient')
const { normalizeState } = require('./normalize')

const INITIAL_RETRY_DELAY_MS = 5000

let state = { status: 'loading', data: null, error: null }

const getState = () => state

const fetchInitialData = async (config) => {
  try {
    const [congress, salas, charlas] = await Promise.all([
      fetchCongress(config),
      fetchSalas(config),
      fetchCharlas(config),
    ])
    state = {
      status: 'ready',
      data: normalizeState({ congress, salas, charlas, idSala: config.idSala }),
      error: null,
    }
  } catch (err) {
    console.error(`Fetch inicial falló, reintentando en ${INITIAL_RETRY_DELAY_MS}ms:`, err.message)
    state = { status: 'error', data: null, error: err.message }
    setTimeout(() => fetchInitialData(config), INITIAL_RETRY_DELAY_MS)
  }
}

module.exports = { fetchInitialData, getState }
