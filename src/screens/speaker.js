(function () {
  const SOCIAL_ICONS = {
    facebook: 'references/assets/icons/social/facebook.png',
    instagram: 'references/assets/icons/social/instagram.png',
    linkedIn: 'references/assets/icons/social/linkedin.png',
    twitter: 'references/assets/icons/social/twitter.png',
  }

  function initials(name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
  }

  // Busca la presentación más reciente en el estado en vivo, en vez de confiar en el
  // `session.speaker.presentacion` capturado al navegar: si el usuario se queda en esta
  // pantalla y llega un refresh en background con un `actualizado` nuevo, ese objeto
  // capturado queda desactualizado y el click en Go seguiría usando la versión vieja.
  function findCurrentPresentacion(fecha, charlaId, fallback) {
    const data = window.OctopusState.getState().data
    const bloques = data && data.sessionsByDate[fecha]
    if (!bloques) return fallback
    for (const bloque of bloques) {
      const charla = bloque.charlas.find((c) => c.id === charlaId)
      if (charla) return charla.speaker.presentacion
    }
    return fallback
  }

  function render({ congress, session, fecha }) {
    const speaker = session.speaker

    const el = document.createElement('div')
    el.className = 'screen screen-speaker'

    const body = document.createElement('div')
    body.className = 'speaker-body'

    const photo = document.createElement('div')
    photo.className = 'speaker-photo'
    photo.textContent = initials(speaker.name)

    const main = document.createElement('div')
    main.className = 'speaker-main'

    const sessionTitleLabel = document.createElement('div')
    sessionTitleLabel.className = 'section-label'
    sessionTitleLabel.innerHTML = `<span class="section-label-bar"></span><span>${speaker.sessionTitle}</span>`

    const name = document.createElement('div')
    name.className = 'speaker-name'
    name.textContent = `${speaker.name}${window.OctopusRoleLabel.suffix(speaker.role)}`

    const social = document.createElement('div')
    social.className = 'speaker-social'
    social.innerHTML = Object.entries(speaker.social)
      .filter(([, href]) => href)
      .map(([network]) => `<img src="${SOCIAL_ICONS[network]}" alt="${network}" width="26" height="26" />`)
      .join('')

    const bio = document.createElement('p')
    bio.className = 'speaker-bio'
    bio.textContent = speaker.bio

    main.appendChild(sessionTitleLabel)
    main.appendChild(name)
    main.appendChild(social)
    main.appendChild(bio)

    // sponsor.logo y followMeQr todavía no tienen assets finales;
    // se representan con placeholders visuales (badge/checkerboard),
    // igual que en el ui-kit de referencia.
    const side = document.createElement('div')
    side.className = 'speaker-side'

    if (speaker.sponsor) {
      const sponsorBadge = document.createElement('div')
      sponsorBadge.className = 'speaker-sponsor-badge'
      sponsorBadge.textContent = speaker.sponsor.name
      side.appendChild(sponsorBadge)
    }

    if (speaker.followMeQr) {
      const followMe = document.createElement('div')
      followMe.className = 'speaker-followme'
      followMe.innerHTML = `
        <div class="speaker-followme-label">FOLLOW ME</div>
        <div class="speaker-followme-qr"></div>
      `
      side.appendChild(followMe)
    }

    body.appendChild(photo)
    body.appendChild(main)
    body.appendChild(side)

    const goError = document.createElement('div')
    goError.className = 'speaker-go-error'
    goError.hidden = true

    let goBtn = null
    if (speaker.presentacion !== null) {
      goBtn = document.createElement('button')
      goBtn.className = 'btn btn--primary btn--lg'
      goBtn.textContent = 'Go'
      goBtn.addEventListener('click', async () => {
        const MIN_LOADING_MS = 600
        goError.hidden = true
        goBtn.disabled = true
        const originalText = goBtn.textContent
        goBtn.textContent = 'Abriendo...'
        const start = Date.now()
        try {
          const currentPresentacion = findCurrentPresentacion(fecha, session.id, speaker.presentacion)
          const result = await window.octopusBridge.openPresentation({
            presentacion: currentPresentacion,
            fecha,
            disertante: speaker.name,
            charlaId: session.id,
          })
          if (!result.success) {
            goError.textContent = result.error
            goError.hidden = false
          }
        } finally {
          const elapsed = Date.now() - start
          if (elapsed < MIN_LOADING_MS) {
            await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS - elapsed))
          }
          goBtn.disabled = false
          goBtn.textContent = originalText
        }
      })
    }

    el.appendChild(window.OctopusChrome.renderHeader(congress))
    el.appendChild(body)
    el.appendChild(window.OctopusChrome.renderFloatingActions({ showReset: false, extra: goBtn }))
    el.appendChild(goError)
    el.appendChild(window.OctopusChrome.renderFooter())

    return el
  }

  window.OctopusApp.register('speaker', render)
})()
