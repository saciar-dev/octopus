(function () {
  let unsubscribeFromPrevious = null

  function renderTable(bloques) {
    const table = document.createElement('table')
    table.className = 'schedule-table'
    table.innerHTML = `
      <thead>
        <tr>
          <th>Start</th>
          <th>End</th>
          <th>Session</th>
          <th>Enter</th>
        </tr>
      </thead>
      <tbody>
        ${bloques
          .map(
            (b) => `
          <tr data-bloque-id="${b.id}">
            <td>${b.enter}</td>
            <td>${b.end}</td>
            <td class="schedule-table-session">${b.name}</td>
            <td class="schedule-table-enter">
              <button class="schedule-table-enter-btn" aria-label="enter" data-bloque-id="${b.id}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>
              </button>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    `
    return table
  }

  function render() {
    if (unsubscribeFromPrevious) {
      unsubscribeFromPrevious()
      unsubscribeFromPrevious = null
    }

    const { congress, dates: initialDates } = window.OctopusState.getState().data
    let activeDate = initialDates[0]
    let currentSessionsByDate = {}

    const el = document.createElement('div')
    el.className = 'screen screen-schedule'

    const body = document.createElement('div')
    body.className = 'schedule-body'

    const label = document.createElement('div')
    label.className = 'section-label section-label--lg'
    label.innerHTML = '<span class="section-label-bar"></span><span>WELCOME</span>'

    const tabs = document.createElement('div')
    tabs.className = 'tabs'

    const tableWrap = document.createElement('div')
    tableWrap.className = 'schedule-table-wrap'

    const spacer = document.createElement('div')
    spacer.className = 'schedule-spacer'

    body.appendChild(label)
    body.appendChild(tabs)
    body.appendChild(tableWrap)
    body.appendChild(spacer)

    el.appendChild(window.OctopusChrome.renderHeader(congress))
    el.appendChild(body)
    el.appendChild(window.OctopusChrome.renderFloatingActions())
    el.appendChild(window.OctopusChrome.renderFooter())

    function enterBloque(bloque) {
      window.OctopusApp.show('session', { congress, bloque })
    }

    function selectDate(date) {
      activeDate = date
      tabs.querySelectorAll('.tab').forEach((tabEl) => {
        tabEl.classList.toggle('tab--active', tabEl.dataset.date === date)
      })
      const bloques = currentSessionsByDate[date] || []
      tableWrap.innerHTML = ''
      const table = renderTable(bloques)
      const enterButtons = []
      table.querySelectorAll('tr[data-bloque-id]').forEach((row) => {
        const bloque = bloques.find((b) => String(b.id) === row.dataset.bloqueId)
        const enterBtn = row.querySelector('.schedule-table-enter-btn')
        row.querySelector('.schedule-table-session').addEventListener('click', () => enterBloque(bloque))
        enterBtn.addEventListener('click', () => enterBloque(bloque))
        enterButtons.push(enterBtn)
      })
      tableWrap.appendChild(table)
      window.OctopusKeyboard.setFocusGroup(enterButtons)
    }

    function renderTabs(dates) {
      tabs.innerHTML = dates.map((d) => `<button class="tab" data-date="${d}">${d}</button>`).join('')
      tabs.querySelectorAll('.tab').forEach((tabEl) => {
        tabEl.addEventListener('click', () => selectDate(tabEl.dataset.date))
      })
    }

    function applyData(data) {
      currentSessionsByDate = data.sessionsByDate
      renderTabs(data.dates)
      const dateToShow = data.dates.includes(activeDate) ? activeDate : data.dates[0]
      selectDate(dateToShow)
    }

    applyData(window.OctopusState.getState().data)

    unsubscribeFromPrevious = window.OctopusState.subscribe((state) => {
      if (state.status === 'ready') {
        applyData(state.data)
      }
    })

    return el
  }

  window.OctopusApp.register('schedule', render)
})()
