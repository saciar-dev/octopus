(function () {
  function renderPasswordGate({ onSuccess }) {
    const el = document.createElement('div')
    el.className = 'config-gate'
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

  function renderFormPlaceholder() {
    const el = document.createElement('div')
    el.className = 'config-form-placeholder'
    el.textContent = 'Settings form (Step 9)'
    return el
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
      body.appendChild(renderFormPlaceholder())
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
