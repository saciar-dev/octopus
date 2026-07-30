const { fetchCongress, fetchSalas, fetchCharlas } = require('./apiClient')
const { normalizeState, normalizeCharlas } = require('./normalize')

const INITIAL_RETRY_DELAY_MS = 5000
const REFRESH_INTERVAL_MS = 60 * 1000
const DEFAULT_THEME = 'light'
const DEFAULT_ACCENT_COLOR = 'blue'
const VALID_ACCENT_COLORS = ['blue', 'green', 'orange', 'red', 'violet']
const DEFAULT_SETTINGS_PASSWORD = 'octopus2026'

let state = { status: 'loading', data: null, error: null, settings: null }
let refreshInFlight = false
let listeners = []

const getState = () => state

const onStateChange = (listener) => {
  listeners.push(listener)
}

const setState = (next) => {
  state = next
  for (const listener of listeners) {
    listener(state)
  }
}

const applyConfigDefaults = (config) => ({
  ...config,
  theme: config.theme || DEFAULT_THEME,
  accentColor: VALID_ACCENT_COLORS.includes(config.accentColor) ? config.accentColor : DEFAULT_ACCENT_COLOR,
  settingsPassword: config.settingsPassword || DEFAULT_SETTINGS_PASSWORD,
})

const buildSettingsBlock = (config) => ({
  apiBaseUrl: config.apiBaseUrl,
  codigoEvento: config.codigoEvento,
  idSala: config.idSala,
  theme: config.theme,
  accentColor: config.accentColor,
})

const setSettings = (config) => {
  setState({ ...state, settings: buildSettingsBlock(applyConfigDefaults(config)) })
}

const fetchInitialData = async (config) => {
  const effectiveConfig = applyConfigDefaults(config)
  setSettings(effectiveConfig)
  try {
    const [congress, salas, charlas] = await Promise.all([
      fetchCongress(effectiveConfig),
      fetchSalas(effectiveConfig),
      fetchCharlas(effectiveConfig),
    ])
    setState({
      status: 'ready',
      data: normalizeState({ congress, salas, charlas, idSala: effectiveConfig.idSala }),
      error: null,
      settings: state.settings,
    })
  } catch (err) {
    console.error(`Fetch inicial falló, reintentando en ${INITIAL_RETRY_DELAY_MS}ms:`, err.message)
    setState({ status: 'error', data: null, error: err.message, settings: state.settings })
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
      setState({ ...state, data: { ...state.data, dates, sessionsByDate } })
    }
    console.log('Refresh de charlas OK:', new Date().toISOString())
  } catch (err) {
    console.error('Refresh de charlas falló, se mantienen los datos previos:', err.message)
  } finally {
    refreshInFlight = false
  }
}

const startPeriodicRefresh = (getConfig) => {
  setInterval(() => refreshCharlas(getConfig()), REFRESH_INTERVAL_MS)
}

module.exports = {
  fetchInitialData,
  getState,
  refreshCharlas,
  startPeriodicRefresh,
  onStateChange,
  applyConfigDefaults,
  setSettings,
}
