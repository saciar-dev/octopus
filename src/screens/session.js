(function () {
  let unsubscribeFromPrevious = null

  function renderTable(charlas) {
    const table = document.createElement('table')
    table.className = 'schedule-table'
    table.innerHTML = `
      <thead>
        <tr>
          <th>Start</th>
          <th>End</th>
          <th>Speaker</th>
          <th>Enter</th>
        </tr>
      </thead>
      <tbody>
        ${charlas
          .map((c) => {
            const roleSuffix = window.OctopusRoleLabel.suffix(c.speaker.role)
            return `
          <tr data-charla-id="${c.id}">
            <td>${c.enter}</td>
            <td>${c.end}</td>
            <td class="schedule-table-session">
              <div class="schedule-table-session-speaker">${c.speaker.name}${roleSuffix}</div>
              <div class="schedule-table-session-title">${c.title}</div>
            </td>
            <td class="schedule-table-enter">
              <button class="schedule-table-enter-btn" aria-label="enter" data-charla-id="${c.id}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>
              </button>
            </td>
          </tr>
        `
          })
          .join('')}
      </tbody>
    `
    return table
  }

  function render({ congress, bloque, fecha }) {
    if (unsubscribeFromPrevious) {
      unsubscribeFromPrevious()
      unsubscribeFromPrevious = null
    }

    const el = document.createElement('div')
    el.className = 'screen screen-session'

    const body = document.createElement('div')
    body.className = 'session-body'

    const label = document.createElement('div')
    label.className = 'section-label section-label--lg'
    label.innerHTML = `<span class="section-label-bar"></span><span>${bloque.enter} - ${bloque.end} · ${bloque.name}</span>`

    const tableWrap = document.createElement('div')
    tableWrap.className = 'schedule-table-wrap'

    const spacer = document.createElement('div')
    spacer.className = 'schedule-spacer'

    function enterSpeaker(charla) {
      window.OctopusApp.show('speaker', { congress, session: charla, fecha })
    }

    function renderCharlas(charlas) {
      tableWrap.innerHTML = ''
      const table = renderTable(charlas)
      const enterButtons = []
      table.querySelectorAll('tr[data-charla-id]').forEach((row) => {
        const charla = charlas.find((c) => String(c.id) === row.dataset.charlaId)
        const enterBtn = row.querySelector('.schedule-table-enter-btn')
        row.querySelector('.schedule-table-session').addEventListener('click', () => enterSpeaker(charla))
        enterBtn.addEventListener('click', () => enterSpeaker(charla))
        enterButtons.push(enterBtn)
      })
      tableWrap.appendChild(table)
      window.OctopusKeyboard.setFocusGroup(enterButtons)
    }

    function applyData(data) {
      const bloques = data.sessionsByDate[fecha] || []
      const bloqueEncontrado = bloques.find((b) => String(b.id) === String(bloque.id))
      if (!bloqueEncontrado) {
        window.OctopusApp.show('schedule')
        return
      }
      renderCharlas(bloqueEncontrado.charlas)
    }

    renderCharlas(bloque.charlas)

    body.appendChild(label)
    body.appendChild(tableWrap)
    body.appendChild(spacer)

    el.appendChild(window.OctopusChrome.renderHeader(congress))
    el.appendChild(body)
    el.appendChild(window.OctopusChrome.renderFloatingActions())
    el.appendChild(window.OctopusChrome.renderFooter())

    Promise.resolve().then(() => {
      const state = window.OctopusState.getState()
      if (state.status === 'ready') {
        applyData(state.data)
      }
    })

    unsubscribeFromPrevious = window.OctopusState.subscribe((state) => {
      if (state.status === 'ready') {
        applyData(state.data)
      }
    })

    return el
  }

  window.OctopusApp.register('session', render)
})()
