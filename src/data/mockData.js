const congress = {
  name: "INTERNATIONAL CONGRESS OF VARIATIC SURGERY",
  room: "A",
  logo: "assets/congress-logo.png", // placeholder circular, no es el logo Octopus
};

const dates = ["2022-03-01", "2022-03-02", "2022-07-08", "2022-08-27"];

// Una lista de sesiones por fecha
const sessionsByDate = {
  "2022-03-01": [
    {
      id: "s1",
      enter: "09:05",
      end: "10:45",
      title: "Session 1: Dysregulated circuits, dysregulated emotions...",
      speaker: {
        name: "Roger McIntyre",
        country: "Canada",
        photo: "assets/speakers/roger-mcintyre.jpg",
        sessionTitle: "Infección por CMV en TCPH alogénico: prevención y tratamiento",
        bio: "Roger McIntyre, MD, FRCPC, completó su especialización en psiquiatría y su fellowship en psicofarmacología en la Universidad de Toronto, donde actualmente es profesor de psiquiatría y farmacología. Dirige la Mood Disorders Psychopharmacology Unit y ha publicado más de 500 artículos revisados por pares sobre trastornos del ánimo y comorbilidades metabólicas.",
        social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
        sponsor: { name: "Roche", logo: "assets/sponsors/roche.png" }, // null si no hay sponsor
        followMeQr: "assets/qr/roger-mcintyre.png", // null si no hay QR
        pptPath: "C:\\Users\\Evento\\documents\\Octopus\\data\\presentations\\254\\254.pptx",
      },
    },
    {
      id: "s2",
      enter: "11:00",
      end: "12:30",
      title: "Session 2: Metabolic comorbidities in mood disorders",
      speaker: {
        name: "Ana Belén Torres",
        country: "España",
        photo: "assets/speakers/ana-torres.jpg",
        sessionTitle: "Comorbilidades metabólicas en trastornos del estado de ánimo",
        bio: "Ana Belén Torres, MD, es especialista en endocrinología y coordina el programa de salud metabólica del Hospital Clínico de Barcelona. Su investigación se centra en la relación entre trastornos del ánimo y síndrome metabólico.",
        social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
        sponsor: null, // variante: sin sponsor
        followMeQr: "assets/qr/ana-torres.png",
        pptPath: "C:\\Octopus\\presentations\\ana-torres.pptx",
      },
    },
    {
      id: "s3",
      enter: "13:00",
      end: "14:15",
      title: "Session 3: Long-term outcomes in bipolar disorder",
      speaker: {
        name: "Marco Ferreira",
        country: "Brasil",
        photo: "assets/speakers/marco-ferreira.jpg",
        sessionTitle: "Resultados a largo plazo en el trastorno bipolar",
        bio: "Marco Ferreira, MD, PhD, es profesor titular de psiquiatría en la Universidad de São Paulo y director del Instituto de Trastornos del Ánimo. Sus líneas de trabajo abarcan neuroimagen y seguimiento longitudinal en trastorno bipolar.",
        social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
        sponsor: null, // variante: sin sponsor
        followMeQr: null, // variante: sin QR
        pptPath: "C:\\Octopus\\presentations\\marco-ferreira.pptx",
      },
    },
  ],
  "2022-03-02": [
    {
      id: "s4",
      enter: "09:30",
      end: "10:50",
      title: "Session 4: Inflammation and depression",
      speaker: {
        name: "Laura Gimenez",
        country: "Argentina",
        photo: "assets/speakers/laura-gimenez.jpg",
        sessionTitle: "Inflamación y depresión: mecanismos y tratamiento",
        bio: "Laura Gimenez, MD, es investigadora en el CONICET y especialista en psiquiatría biológica, con foco en biomarcadores inflamatorios en trastornos afectivos.",
        social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
        sponsor: { name: "Roche", logo: "assets/sponsors/roche.png" },
        followMeQr: "assets/qr/laura-gimenez.png",
        pptPath: "C:\\Octopus\\presentations\\laura-gimenez.pptx",
      },
    },
    {
      id: "s5",
      enter: "11:15",
      end: "12:45",
      title: "Session 5: Cognitive dysfunction across mood episodes",
      speaker: {
        name: "Diego Salas",
        country: "Chile",
        photo: "assets/speakers/diego-salas.jpg",
        sessionTitle: "Disfunción cognitiva a lo largo de los episodios del ánimo",
        bio: "Diego Salas, MD, es neuropsiquiatra en la Universidad de Chile, dedicado al estudio de la cognición en pacientes con trastornos afectivos crónicos.",
        social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
        sponsor: null,
        followMeQr: "assets/qr/diego-salas.png",
        pptPath: "C:\\Octopus\\presentations\\diego-salas.pptx",
      },
    },
  ],
  "2022-07-08": [
    {
      id: "s6",
      enter: "09:00",
      end: "10:20",
      title: "Session 6: Novel therapeutics in treatment-resistant depression",
      speaker: {
        name: "Sofía Ramallo",
        country: "México",
        photo: "assets/speakers/sofia-ramallo.jpg",
        sessionTitle: "Nuevas terapéuticas en depresión resistente al tratamiento",
        bio: "Sofía Ramallo, MD, PhD, lidera el programa de depresión resistente en el Instituto Nacional de Psiquiatría de México y participa en ensayos clínicos de terapias novedosas.",
        social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
        sponsor: { name: "Roche", logo: "assets/sponsors/roche.png" },
        followMeQr: "assets/qr/sofia-ramallo.png",
        pptPath: "C:\\Octopus\\presentations\\sofia-ramallo.pptx",
      },
    },
    {
      id: "s7",
      enter: "10:40",
      end: "12:00",
      title: "Session 7: Perinatal mood and anxiety disorders",
      speaker: {
        name: "Valentina Cruz",
        country: "Colombia",
        photo: "assets/speakers/valentina-cruz.jpg",
        sessionTitle: "Trastornos del ánimo y ansiedad en el período perinatal",
        bio: "Valentina Cruz, MD, es psiquiatra perinatal en la Universidad Nacional de Colombia, enfocada en la detección y tratamiento temprano de trastornos afectivos durante el embarazo y el posparto.",
        social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
        sponsor: null,
        followMeQr: null, // variante: sin QR
        pptPath: "C:\\Octopus\\presentations\\valentina-cruz.pptx",
      },
    },
  ],
  "2022-08-27": [
    {
      id: "s8",
      enter: "09:15",
      end: "10:30",
      title: "Session 8: Digital phenotyping in psychiatry",
      speaker: {
        name: "Tomás Herrera",
        country: "Uruguay",
        photo: "assets/speakers/tomas-herrera.jpg",
        sessionTitle: "Fenotipado digital en psiquiatría",
        bio: "Tomás Herrera, MD, es investigador en salud digital en la Universidad de la República, especializado en el uso de datos de dispositivos móviles para el seguimiento de trastornos del ánimo.",
        social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
        sponsor: { name: "Roche", logo: "assets/sponsors/roche.png" },
        followMeQr: "assets/qr/tomas-herrera.png",
        pptPath: "C:\\Octopus\\presentations\\tomas-herrera.pptx",
      },
    },
    {
      id: "s9",
      enter: "10:50",
      end: "12:10",
      title: "Session 9: Sleep and circadian rhythms in mood disorders",
      speaker: {
        name: "Camila Duarte",
        country: "Paraguay",
        photo: "assets/speakers/camila-duarte.jpg",
        sessionTitle: "Sueño y ritmos circadianos en los trastornos del ánimo",
        bio: "Camila Duarte, MD, es especialista en medicina del sueño y colabora con el servicio de psiquiatría del Hospital de Clínicas de Asunción, con foco en la relación entre ritmos circadianos y trastornos afectivos.",
        social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
        sponsor: null,
        followMeQr: "assets/qr/camila-duarte.png",
        pptPath: "C:\\Octopus\\presentations\\archivo-inexistente.pptx", // ruta inválida a propósito, para probar el caso de error
      },
    },
  ],
};

module.exports = { congress, dates, sessionsByDate };
