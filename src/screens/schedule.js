(function () {
  function renderTable(sessions) {
    const table = document.createElement('table')
    table.className = 'schedule-table'
    table.innerHTML = `
      <thead>
        <tr>
          <th>Enter</th>
          <th>End</th>
          <th>Session</th>
          <th>Enter</th>
        </tr>
      </thead>
      <tbody>
        ${sessions
          .map(
            (s) => `
          <tr data-session-id="${s.id}">
            <td>${s.enter}</td>
            <td>${s.end}</td>
            <td class="schedule-table-session">${s.title}</td>
            <td class="schedule-table-enter">
              <button class="schedule-table-enter-btn" aria-label="enter" data-session-id="${s.id}">
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
    const { congress, dates, sessionsByDate } = window.octopusData
    const activeDate = dates[0]

    const el = document.createElement('div')
    el.className = 'screen screen-schedule'

    const body = document.createElement('div')
    body.className = 'schedule-body'

    const label = document.createElement('div')
    label.className = 'section-label section-label--lg'
    label.innerHTML = '<span class="section-label-bar"></span><span>WELCOME</span>'

    const tabs = document.createElement('div')
    tabs.className = 'tabs'
    tabs.innerHTML = dates
      .map(
        (d) =>
          `<button class="tab${d === activeDate ? ' tab--active' : ''}" data-date="${d}">${d}</button>`
      )
      .join('')

    const tableWrap = document.createElement('div')
    tableWrap.className = 'schedule-table-wrap'
    tableWrap.appendChild(renderTable(sessionsByDate[activeDate] || []))

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

    return el
  }

  window.OctopusApp.register('schedule', render)
})()
