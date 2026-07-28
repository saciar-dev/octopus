# SPEC 01 — MVP visual de las pantallas Octopus

> **Estado:** aprobado
> **Depende de:** Ninguno
> **Fecha:** 2026-07-28
> **Objetivo:** Implementar la navegación visual completa entre las cuatro pantallas de Octopus (Splash, Schedule, Session, Speaker) con datos de ejemplo hardcodeados, sin lógica de negocio real.

## Scope

**Incluye:**

- Cuatro pantallas navegables: Splash, Schedule, Session, Speaker.
- Splash: logo, subtítulo, botón engranaje (placeholder) y botón Play que navega a Schedule.
- Schedule: header con logo de congreso + título + room, 4 tabs de fecha clickeables (cada una con su propia lista mock de sesiones), tabla de sesiones (Start/End/Session/Enter-icon), botones flotantes back/reset.
- Session: header igual, bloque con horario y datos de la sesión (disertante, país, título) clickeable (navega a Speaker), botones flotantes back/reset.
- Speaker: header igual, foto, título de sesión, nombre/país del disertante, iconos sociales, bio, y a la derecha (según config de la sesión mock) logo de sponsor y/o QR "FOLLOW ME", botones back/Go (el "Go" queda como placeholder: Speaker es la última pantalla del flujo, no navega a ningún lado).
- Las 3 variantes de Speaker (con sponsor+QR, sin sponsor con QR, sin sponsor ni QR) determinadas por la config de cada sesión mock.
- Navegación por click en los botones visibles del diseño.
- Navegación por teclado: Esc = volver (misma acción que el botón back flotante), flechas arriba/abajo = mover foco entre filas/tabs, Enter = confirmar elemento con foco.
- Datos de ejemplo hardcodeados en un archivo mock, con contenido similar al de las capturas (congreso, fechas, sesiones, disertante Roger McIntyre, sponsor Roche, QR).
- Botón de configuración (engranaje) y logo de congreso/sponsor: placeholder de acción (console.log) al clickear, sin pantalla real detrás.
- Ventana Electron redimensionable, que carga en pantalla completa (fullscreen) por defecto.
- Código organizado en `src/screens/` con un archivo por pantalla.

**Fuera de scope (para specs futuras):**

- Persistencia de datos (localStorage, IndexedDB, archivo JSON).
- Lectura de datos reales del congreso (import/API/archivo externo).
- Pantalla de configuración real detrás del botón engranaje.
- Generación real de código QR (se usa una imagen QR mock).
- Lógica de negocio: cálculo de horarios, validaciones, temporización real de sesión.
- Responsive/resize de ventana.
- Sonido, animaciones avanzadas, transiciones entre pantallas más allá de mostrar/ocultar.

## Data model

Datos mock estáticos en `src/data/mockData.js`, sin persistencia:

```js
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
        bio: "Roger McIntyre, MD, FRCPC, completó...",
        social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
        sponsor: { name: "Roche", logo: "assets/sponsors/roche.png" }, // null si no hay sponsor
        followMeQr: "assets/qr/roger-mcintyre.png", // null si no hay QR
      },
    },
    // ...session 2, session 3 (variantes sin sponsor / sin QR)
  ],
  // ...resto de fechas, con listas propias (pueden repetir estructura)
};
```

Convenciones:

- `sponsor: null` → Speaker se renderiza sin logo de sponsor (variante "sin sponsor").
- `followMeQr: null` → Speaker se renderiza sin bloque QR/"FOLLOW ME" (variante "sin QR").
- El estado de navegación actual (pantalla visible, fecha/sesión seleccionada) vive en memoria (variables JS), no se persiste entre reinicios de la app.

## Implementation plan

1. Crear `src/data/mockData.js` con el congreso, las 4 fechas y las sesiones mock (incluyendo las 3 variantes de sponsor/QR). Verificación manual: el archivo se puede importar sin errores (`node -e "require('./src/data/mockData.js')"` o equivalente).
2. Crear `src/screens/splash.js` (o `.html` + lógica) con logo, subtítulo, botón engranaje (placeholder console.log) y botón Play. Cablear en `main.js`/`index.html` para que sea la vista inicial. Prueba manual: `npm start` abre la app en pantalla completa mostrando Splash.
3. Crear `src/screens/schedule.js`: header (logo congreso + título + room), tabs de fecha, tabla de sesiones poblada desde `mockData.js`, botones flotantes back/reset. Cablear navegación Play (Splash) → Schedule. Prueba manual: click en Play muestra Schedule con la tabla de la primera fecha.
4. Implementar el cambio de tab de fecha en Schedule: click en cada tab recarga la tabla con las sesiones de esa fecha. Prueba manual: clickear cada una de las 4 tabs cambia el contenido de la tabla.
5. Crear `src/screens/session.js`: header igual, bloque de horario + datos de sesión, botones back/reset. Cablear navegación: click en fila de Schedule → Session con los datos de esa sesión. Prueba manual: click en una fila de la tabla muestra la Session correspondiente.
6. Crear `src/screens/speaker.js` con las 3 variantes (sponsor+QR, sin sponsor, sin sponsor ni QR) controladas por los campos `sponsor`/`followMeQr` de la sesión mock, con botones back/Go (Go queda como placeholder). Cablear navegación: click en el bloque de datos de sesión (disertante/país/título) en Session → Speaker. Prueba manual: navegar a sesiones con distinta config muestra las 3 variantes correctamente.
7. Implementar botones flotantes back (Schedule, Session, Speaker) y reset (Schedule, Session): back vuelve a la pantalla anterior en el flujo, reset vuelve a Splash. Prueba manual: recorrer el flujo completo y volver con back/reset en cada pantalla que los tenga.
8. Implementar navegación por teclado: Esc = acción de back, flechas arriba/abajo = mover foco entre filas de tabla/tabs, Enter = confirmar elemento con foco. Prueba manual: recorrer todo el flujo sin usar el mouse.
9. Aplicar tokens y componentes de `references/` (colores, tipografía, spacing, Button, Panel, Tabs, ScheduleTable, SocialIcons, IconButton) a las 4 pantallas para que coincidan visualmente con las capturas. Prueba manual: comparar cada pantalla contra su PNG de referencia en `references/uploads/`.
10. ~~Fijar la ventana Electron en 1366x768 no resizable~~ — descartado. Se decidió que la ventana sea redimensionable y cargue en fullscreen por defecto (`main.js`: `fullscreen: true`, sin `resizable: false`). Prueba manual: `npm start` abre la app en pantalla completa y permite salir de fullscreen/redimensionar.

## Acceptance criteria

- [ ] `npm start` abre la app Electron en una ventana redimensionable, en pantalla completa (fullscreen) por defecto.
- [ ] La pantalla inicial es Splash, mostrando logo, subtítulo "Speaker Preview Manager", botón engranaje y botón Play.
- [ ] Click en el botón engranaje de Splash ejecuta un console.log placeholder y no cambia de pantalla.
- [ ] Click en Play navega a Schedule.
- [ ] Schedule muestra header (logo congreso, título del congreso, "ROOM A"), 4 tabs de fecha y una tabla con columnas Start/End/Session/Enter-icon.
- [ ] Click en cada una de las 4 tabs de fecha cambia el contenido de la tabla a las sesiones mock de esa fecha.
- [ ] Click en una fila de la tabla (o su ícono Enter) navega a Session con los datos de esa sesión (horario, disertante, título).
- [ ] Click en el bloque de datos de sesión (disertante/país/título) de Session navega a Speaker con los datos del disertante de esa sesión.
- [ ] Speaker muestra botones flotantes back y Go (Go es un placeholder sin navegación real, ya que Speaker es la última pantalla del flujo).
- [ ] Speaker muestra foto, título de sesión, nombre y país del disertante, iconos sociales y bio en todas las variantes.
- [ ] Para una sesión con `sponsor` y `followMeQr` definidos, Speaker muestra el logo de sponsor y el bloque "FOLLOW ME" + QR.
- [ ] Para una sesión con `sponsor: null` y `followMeQr` definido, Speaker muestra el bloque "FOLLOW ME" + QR sin logo de sponsor.
- [ ] Para una sesión con `sponsor: null` y `followMeQr: null`, Speaker no muestra ni sponsor ni bloque QR.
- [ ] El botón flotante "back" en Schedule, Session y Speaker vuelve a la pantalla anterior del flujo (Speaker→Session→Schedule→Splash).
- [ ] El botón flotante "reset" en Schedule y Session vuelve directamente a Splash. Speaker no tiene botón reset (tiene back y Go).
- [ ] Presionar Esc en Schedule, Session o Speaker ejecuta la misma acción que el botón "back".
- [ ] Presionar flecha arriba/abajo en Schedule mueve el foco entre las filas de la tabla (o tabs), y Enter confirma el elemento con foco.
- [ ] Las 4 pantallas usan los tokens de color/tipografía/spacing de `references/tokens/` (sin colores o fuentes hardcodeadas distintas al sistema).
- [ ] No hay llamadas a `localStorage`, `fs`, ni a ninguna fuente de datos externa: todo el contenido sale de `src/data/mockData.js`.

## Decisions

- **Sí:** datos hardcodeados en `src/data/mockData.js`. Permite ver las pantallas pobladas sin depender de ingesta real de datos, que queda para otra spec.
- **No:** persistencia (localStorage/IndexedDB/archivo). No aplica a un MVP puramente visual; se decide en la spec que agregue datos reales.
- **Sí:** navegación mostrar/ocultar vistas dentro de la misma ventana Electron, sin router ni multi-ventana. Es la forma más simple para 4 pantallas fijas en un kiosco.
- **No:** framework de UI (React/Vue) para este MVP. El repo no tiene bundler configurado; JS/HTML/CSS plano alcanza para 4 pantallas y evita esfuerzo de setup fuera de scope.
- **Sí:** organización en `src/screens/` con un archivo por pantalla. Prioriza claridad para specs futuras que agreguen lógica a cada pantalla por separado.
- **Sí:** las 3 variantes de Speaker (sponsor+QR, sin sponsor, sin sponsor ni QR) controladas por campos de datos (`sponsor`, `followMeQr`), no por un selector manual. Mantiene el MVP fiel a cómo se comportaría con datos reales de congreso.
- **Sí:** navegación por teclado con Esc/flechas/Enter, pensando en el uso kiosco/tablet sin mouse.
- **No:** generación real de QR. Se usa una imagen QR estática de ejemplo; la generación dinámica queda fuera de scope.
- **No:** ventana fija 1366x768 no resizable. Se decidió priorizar una ventana redimensionable que abra en fullscreen por defecto en lugar de un tamaño fijo (cambio de decisión durante la implementación del Paso 10).
- **No:** pantalla de configuración real. El botón engranaje queda como placeholder (console.log) hasta que exista una spec de configuración.

## Risks

| Riesgo                                                              | Mitigación                                                                                  |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Assets de referencia (fotos, logos, QR) no están listos como archivos finales | Usar los recortes/placeholders existentes en `references/assets/` y `references/uploads/`, documentando cuáles son mock. |
| Navegación por teclado (foco en filas/tabs) puede quedar inconsistente entre pantallas si no se centraliza | Implementar el manejo de foco en un único helper compartido entre pantallas, no repetido por archivo. |
| CSP estricta ya definida en `index.html` (`script-src 'self'`) puede bloquear imports si se usan rutas o inline scripts mal formadas | Mantener todos los scripts en archivos `.js` propios cargados como `<script src="...">`, sin inline scripts. |

## What is **not** in this spec

- Persistencia de datos (localStorage, IndexedDB, archivo JSON).
- Lectura de datos reales del congreso (import/API/archivo externo).
- Pantalla de configuración real detrás del botón engranaje.
- Generación real de código QR.
- Lógica de negocio (cálculo de horarios, validaciones, temporización real de sesión).
- Responsive/resize de ventana.
- Animaciones/transiciones avanzadas entre pantallas.

Cada uno de estos, si se implementa, va en su propia spec.
