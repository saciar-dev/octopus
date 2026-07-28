(function () {
  const SOCIAL_ICONS = {
    facebook: 'references/assets/icons/social/facebook.png',
    instagram: 'references/assets/icons/social/instagram.png',
    linkedin: 'references/assets/icons/social/linkedin.png',
    twitter: 'references/assets/icons/social/twitter.png',
  }

  function initials(name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
  }

  function render({ congress, session }) {
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

    const nameCountry = document.createElement('div')
    nameCountry.className = 'speaker-name'
    nameCountry.textContent = `${speaker.name}, ${speaker.country}`

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
    main.appendChild(nameCountry)
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

    const goBtn = document.createElement('button')
    goBtn.className = 'btn btn--primary btn--lg'
    goBtn.textContent = 'Go'
    goBtn.addEventListener('click', async () => {
      goError.hidden = true
      const result = await window.octopusBridge.openPresentation(speaker.pptPath)
      if (!result.success) {
        goError.textContent = result.error
        goError.hidden = false
      }
    })

    el.appendChild(window.OctopusChrome.renderHeader(congress))
    el.appendChild(body)
    el.appendChild(window.OctopusChrome.renderFloatingActions({ showReset: false, extra: goBtn }))
    el.appendChild(goError)
    el.appendChild(window.OctopusChrome.renderFooter())

    return el
  }

  window.OctopusApp.register('speaker', render)
})()
