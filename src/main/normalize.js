const truncateToHM = (time) => time.slice(0, 5)

const normalizePresentacion = (presentacion) => {
  if (Array.isArray(presentacion)) {
    return null
  }
  return {
    id: presentacion.id,
    nombreArchivo: presentacion.nombreArchivo,
    extension: presentacion.extension,
    actualizado: presentacion.actualizado,
    esVirtual: presentacion.esVirtual,
  }
}

const normalizeSponsor = (nombreSponsor, imagenSponsor) => {
  if (nombreSponsor == null && imagenSponsor == null) {
    return null
  }
  return { name: nombreSponsor, logo: imagenSponsor }
}

const normalizeCharla = (charla) => ({
  id: charla.id,
  enter: truncateToHM(charla.hora_ini),
  end: truncateToHM(charla.hora_fin),
  title: charla.titulo,
  speaker: {
    name: charla.disertante,
    role: charla.rol,
    photo: charla.imagen,
    sessionTitle: charla.titulo,
    bio: charla.bio,
    social: {
      facebook: charla.facebook,
      instagram: charla.instagram,
      linkedIn: charla.linkedIn,
      twitter: charla.twitter,
    },
    sponsor: normalizeSponsor(charla.nombreSponsor, charla.imagenSponsor),
    followMeQr: charla.qr,
    presentacion: normalizePresentacion(charla.presentacion),
    enVivo: charla.enVivo,
  },
})

const normalizeBloque = (charlasDelBloque) => {
  const sorted = [...charlasDelBloque].sort((a, b) => a.hora_ini.localeCompare(b.hora_ini))
  const { bloque } = sorted[0]

  return {
    id: bloque.id,
    name: bloque.nombre,
    enter: truncateToHM(sorted[0].hora_ini),
    end: truncateToHM(sorted[sorted.length - 1].hora_fin),
    charlas: sorted.map(normalizeCharla),
  }
}

const normalizeCharlas = (charlas, idSala) => {
  const charlasPorSala = charlas[String(idSala)] ?? {}
  const dates = Object.keys(charlasPorSala)

  const sessionsByDate = {}
  for (const date of dates) {
    const bloques = charlasPorSala[date]
    const bloqueList = Object.values(bloques).map(normalizeBloque)
    bloqueList.sort((a, b) => a.enter.localeCompare(b.enter))
    sessionsByDate[date] = bloqueList
  }

  return { dates, sessionsByDate }
}

const normalizeState = ({ congress, salas, charlas, idSala }) => {
  const sala = salas.find((s) => s.id === idSala)

  return {
    congress: {
      name: congress.nombre,
      room: sala ? sala.nombre : null,
      logo: congress.logo,
    },
    ...normalizeCharlas(charlas, idSala),
  }
}

module.exports = { normalizeState, normalizeCharlas }
