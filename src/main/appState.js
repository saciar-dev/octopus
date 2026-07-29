const { fetchCongress, fetchSalas, fetchCharlas } = require('./apiClient')
const { normalizeState, normalizeCharlas } = require('./normalize')

const INITIAL_RETRY_DELAY_MS = 5000
const REFRESH_INTERVAL_MS = 60 * 1000

let state = { status: 'loading', data: null, error: null }
let refreshInFlight = false

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

const refreshCharlas = async (config) => {
  if (refreshInFlight) {
    return
  }
  refreshInFlight = true
  try {
    const charlas = await fetchCharlas(config)
    const { dates, sessionsByDate } = normalizeCharlas(charlas, config.idSala)
    if (state.status === 'ready') {
      state = { ...state, data: { ...state.data, dates, sessionsByDate } }
    }
    console.log('Refresh de charlas OK:', new Date().toISOString())
  } catch (err) {
    console.error('Refresh de charlas falló, se mantienen los datos previos:', err.message)
  } finally {
    refreshInFlight = false
  }
}

const startPeriodicRefresh = (config) => {
  setInterval(() => refreshCharlas(config), REFRESH_INTERVAL_MS)
}

module.exports = { fetchInitialData, getState, refreshCharlas, startPeriodicRefresh }
