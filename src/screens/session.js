(function () {
  function render({ congress, session }) {
    const el = document.createElement('div')
    el.className = 'screen screen-session'

    const body = document.createElement('div')
    body.className = 'session-body'

    const label = document.createElement('div')
    label.className = 'section-label section-label--lg'
    label.innerHTML = `<span class="section-label-bar"></span><span>${session.enter} - ${session.end}</span>`

    const panel = document.createElement('div')
    panel.className = 'session-panel'
    panel.innerHTML = `
      <div class="session-panel-speaker">${session.speaker.name}, ${session.speaker.country}</div>
      <div class="session-panel-title">${session.title}</div>
    `

    const spacer = document.createElement('div')
    spacer.className = 'schedule-spacer'

    body.appendChild(label)
    body.appendChild(panel)
    body.appendChild(spacer)

    const goBtn = document.createElement('button')
    goBtn.className = 'btn btn--primary btn--lg'
    goBtn.textContent = 'Go'
    goBtn.addEventListener('click', () => {
      console.log('[Octopus] Go to Speaker: not wired yet')
    })

    el.appendChild(window.OctopusChrome.renderHeader(congress))
    el.appendChild(body)
    el.appendChild(window.OctopusChrome.renderFloatingActions({ extra: goBtn }))
    el.appendChild(window.OctopusChrome.renderFooter())

    return el
  }

  window.OctopusApp.register('session', render)
})()
