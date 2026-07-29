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

const normalizeState = ({ congress, salas, charlas, idSala }) => {
  const sala = salas.find((s) => s.id === idSala)

  const charlasPorSala = charlas[String(idSala)] ?? {}
  const dates = Object.keys(charlasPorSala)

  const sessionsByDate = {}
  for (const date of dates) {
    const bloques = charlasPorSala[date]
    const flattened = Object.values(bloques).flat()
    flattened.sort((a, b) => a.hora_ini.localeCompare(b.hora_ini))
    sessionsByDate[date] = flattened.map(normalizeCharla)
  }

  return {
    congress: {
      name: congress.nombre,
      room: sala ? sala.nombre : null,
      logo: congress.logo,
    },
    dates,
    sessionsByDate,
  }
}

module.exports = { normalizeState }
