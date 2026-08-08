(function () {
  function renderPasswordGate({ onSuccess }) {
    const el = document.createElement('div')
    el.className = 'config-gate panel'
    el.innerHTML = `
      <div class="config-gate-body">
        <label class="config-field-label" for="config-password">Password</label>
        <input class="config-input" type="password" id="config-password" autocomplete="off" />
        <div class="config-gate-error" hidden></div>
        <button class="btn btn--primary btn--lg config-gate-submit">Unlock</button>
      </div>
    `

    const input = el.querySelector('#config-password')
    const errorEl = el.querySelector('.config-gate-error')
    const submitBtn = el.querySelector('.config-gate-submit')

    async function submit() {
      const password = input.value
      const isValid = await window.octopusBridge.verifySettingsPassword(password)
      if (isValid) {
        errorEl.hidden = true
        errorEl.textContent = ''
        onSuccess()
      } else {
        errorEl.hidden = false
        errorEl.textContent = 'Incorrect password. Try again.'
        input.value = ''
        input.focus()
      }
    }

    submitBtn.addEventListener('click', submit)
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submit()
    })

    return el
  }

  const ACCENT_SWATCH_COLORS = {
    blue: 'var(--blue-500)',
    green: 'var(--green-500)',
    orange: 'var(--color-accent-warm)',
    red: 'var(--red-500)',
    violet: '#7c4fd1',
  }

  function renderForm({ settings }) {
    const el = document.createElement('div')
    el.className = 'config-form'
    el.innerHTML = `
      <div class="panel config-panel">
        <div class="section-label"><span class="section-label-bar"></span><span>Connection</span></div>
        <div class="config-field">
          <label class="config-field-label" for="config-apiBaseUrl">API base URL</label>
          <input class="config-input" type="text" id="config-apiBaseUrl" />
        </div>
        <div class="config-field">
          <label class="config-field-label" for="config-codigoEvento">Event code</label>
          <input class="config-input" type="text" id="config-codigoEvento" />
        </div>
        <div class="config-field">
          <button class="btn btn--outline btn--md config-fetch-salas" type="button">Search rooms</button>
        </div>
        <div class="config-field">
          <label class="config-field-label" for="config-idSala">Room</label>
          <select class="config-input" id="config-idSala"></select>
        </div>
      </div>
      <div class="panel config-panel">
        <div class="section-label"><span class="section-label-bar"></span><span>Appearance</span></div>
        <div class="config-field">
          <div class="config-field-label">Theme</div>
          <div class="tabs config-theme-tabs">
            <button class="tab" type="button" data-theme-value="light">Light</button>
            <button class="tab" type="button" data-theme-value="dark">Dark</button>
          </div>
        </div>
        <div class="config-field">
          <div class="config-field-label">Accent color</div>
          <div class="config-accent-swatches">
            <button class="config-accent-swatch" type="button" data-accent-value="blue" aria-label="Blue"></button>
            <button class="config-accent-swatch" type="button" data-accent-value="green" aria-label="Green"></button>
            <button class="config-accent-swatch" type="button" data-accent-value="orange" aria-label="Orange"></button>
            <button class="config-accent-swatch" type="button" data-accent-value="red" aria-label="Red"></button>
            <button class="config-accent-swatch" type="button" data-accent-value="violet" aria-label="Violet"></button>
          </div>
        </div>
      </div>
      <div class="config-form-error" hidden></div>
      <div class="config-field">
        <button class="btn btn--primary btn--lg config-save" type="button">Save</button>
      </div>
    `

    const apiBaseUrlInput = el.querySelector('#config-apiBaseUrl')
    const codigoEventoInput = el.querySelector('#config-codigoEvento')
    const fetchSalasBtn = el.querySelector('.config-fetch-salas')
    const idSalaSelect = el.querySelector('#config-idSala')
    const errorEl = el.querySelector('.config-form-error')
    const themeTabs = el.querySelectorAll('.config-theme-tabs .tab')
    const accentSwatches = el.querySelectorAll('.config-accent-swatch')
    const saveBtn = el.querySelector('.config-save')

    apiBaseUrlInput.value = settings.apiBaseUrl
    codigoEventoInput.value = settings.codigoEvento

    let selectedTheme = settings.theme
    let selectedAccent = settings.accentColor

    function setSelectedTheme(theme) {
      selectedTheme = theme
      themeTabs.forEach((tab) => tab.classList.toggle('tab--active', tab.dataset.themeValue === theme))
    }

    function setSelectedAccent(accent) {
      selectedAccent = accent
      accentSwatches.forEach((swatch) =>
        swatch.classList.toggle('config-accent-swatch--selected', swatch.dataset.accentValue === accent)
      )
    }

    themeTabs.forEach((tab) => {
      tab.addEventListener('click', () => setSelectedTheme(tab.dataset.themeValue))
    })
    accentSwatches.forEach((swatch) => {
      swatch.style.background = ACCENT_SWATCH_COLORS[swatch.dataset.accentValue]
      swatch.addEventListener('click', () => setSelectedAccent(swatch.dataset.accentValue))
    })

    setSelectedTheme(selectedTheme)
    setSelectedAccent(selectedAccent)

    function populateSalas(salas, selectedId) {
      idSalaSelect.innerHTML = ''
      for (const sala of salas) {
        const option = document.createElement('option')
        option.value = sala.id
        option.textContent = sala.nombre
        idSalaSelect.appendChild(option)
      }
      if (selectedId != null && salas.some((s) => String(s.id) === String(selectedId))) {
        idSalaSelect.value = String(selectedId)
      }
    }

    async function buscarSalas(selectedId) {
      errorEl.hidden = true
      errorEl.textContent = ''
      try {
        const salas = await window.octopusBridge.fetchSalas({
          apiBaseUrl: apiBaseUrlInput.value,
          codigoEvento: codigoEventoInput.value,
        })
        populateSalas(salas, selectedId)
      } catch (err) {
        errorEl.hidden = false
        errorEl.textContent = 'Could not fetch rooms. Check the URL and event code.'
      }
    }

    fetchSalasBtn.addEventListener('click', () => buscarSalas())

    async function submitSave() {
      const values = {
        apiBaseUrl: apiBaseUrlInput.value,
        codigoEvento: codigoEventoInput.value,
        idSala: idSalaSelect.value ? Number(idSalaSelect.value) : null,
        theme: selectedTheme,
        accentColor: selectedAccent,
      }

      if (!values.apiBaseUrl || !values.codigoEvento || !values.idSala) {
        errorEl.hidden = false
        errorEl.textContent = 'Fill in the URL, event code and select a room before saving.'
        return
      }

      saveBtn.disabled = true
      const result = await window.octopusBridge.saveSettings(values)
      if (result.success) {
        window.OctopusApp.reset()
      } else {
        saveBtn.disabled = false
        errorEl.hidden = false
        errorEl.textContent = result.error || 'Could not save settings.'
      }
    }

    saveBtn.addEventListener('click', submitSave)

    buscarSalas(settings.idSala)

    return {
      el,
      getValues: () => ({
        apiBaseUrl: apiBaseUrlInput.value,
        codigoEvento: codigoEventoInput.value,
        idSala: idSalaSelect.value ? Number(idSalaSelect.value) : null,
        theme: selectedTheme,
        accentColor: selectedAccent,
      }),
      showError: (message) => {
        errorEl.hidden = false
        errorEl.textContent = message
      },
    }
  }

  function render() {
    const el = document.createElement('div')
    el.className = 'screen screen-config'

    const title = document.createElement('div')
    title.className = 'section-label section-label--lg'
    title.innerHTML = '<span class="section-label-bar"></span><span>Settings</span>'

    const body = document.createElement('div')
    body.className = 'config-body'

    function showGate() {
      body.innerHTML = ''
      body.appendChild(renderPasswordGate({ onSuccess: showForm }))
    }

    function showForm() {
      body.innerHTML = ''
      const settings = window.OctopusState.getState().settings
      const form = renderForm({ settings })
      body.appendChild(form.el)
    }

    showGate()

    el.appendChild(title)
    el.appendChild(body)
    el.appendChild(window.OctopusChrome.renderFloatingActions({ showReset: false }))
    el.appendChild(window.OctopusChrome.renderFooter())

    return el
  }

  window.OctopusApp.register('config', render)
})()
