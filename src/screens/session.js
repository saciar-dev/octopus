(function () {
  function render({ congress, session }) {
    const el = document.createElement('div')
    el.className = 'screen screen-session'

    const body = document.createElement('div')
    body.className = 'session-body'

    const label = document.createElement('div')
    label.className = 'section-label section-label--lg'
    label.innerHTML = `<span class="section-label-bar"></span><span>${session.enter} - ${session.end}</span>`

    const moderatorSuffix = session.speaker.role === 'MODERADOR' ? ' (Moderador)' : ''

    const panel = document.createElement('div')
    panel.className = 'session-panel session-panel--clickable'
    panel.innerHTML = `
      <div class="session-panel-speaker">${session.speaker.name}${moderatorSuffix}</div>
      <div class="session-panel-title">${session.title}</div>
    `
    panel.addEventListener('click', () => {
      window.OctopusApp.show('speaker', { congress, session })
    })

    const spacer = document.createElement('div')
    spacer.className = 'schedule-spacer'

    body.appendChild(label)
    body.appendChild(panel)
    body.appendChild(spacer)

    el.appendChild(window.OctopusChrome.renderHeader(congress))
    el.appendChild(body)
    el.appendChild(window.OctopusChrome.renderFloatingActions())
    el.appendChild(window.OctopusChrome.renderFooter())

    return el
  }

  window.OctopusApp.register('session', render)
})()
