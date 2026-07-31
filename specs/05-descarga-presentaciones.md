# SPEC 05 — Descarga de presentaciones

> **Estado:** aprobado
> **Depende de:** SPEC 03 (datos-reales-api), SPEC 04 (configuracion-app)
> **Fecha:** 2026-07-30
> **Objetivo:** Descargar automáticamente en background los archivos de presentación de cada charla desde `{ftpBaseUrl}/sync/ftpspace/{codigoEvento}/{nombreArchivo}`, guardarlos localmente en `userData/presentaciones/`, y hacer que el botón "Go" abra el archivo local (con la app por defecto del SO) descargándolo on-demand si todavía no está disponible.

## Scope

**Incluye:**

- Módulo de descarga (`src/main/presentationDownloader.js` o similar) que, dado un `presentacion` normalizado (`id`, `nombreArchivo`, `extension`, `actualizado`), un `context` (`fecha`, `disertante`) y la config actual (`ftpBaseUrl`, `codigoEvento`), arma la URL `{ftpBaseUrl}/sync/ftpspace/{codigoEvento}/{nombreArchivo}` y descarga el archivo a `userData/presentaciones/{fecha}/{disertante}/{nombreArchivo}` (corrección post-Paso 8: organización por carpetas en vez de `{id}{extension}` plano).
- Nuevo campo `ftpBaseUrl` en `config.json` (ej. `https://octopus-ftp.space/`), independiente de `apiBaseUrl`. Se define/edita a mano en `config.json`, sin campo en la pantalla de configuración (SPEC 04) — fuera de scope de esta spec agregar UI para este campo.
- Manifest en `userData/presentaciones/manifest.json` (`{ "<id>": "<actualizado descargado>" }`), actualizado tras cada descarga exitosa, usado para decidir si una presentación ya está descargada y al día (comparando contra `presentacion.actualizado`).
- Precarga en background: tras el fetch inicial, cada refresh periódico (1 min), el reset manual y el guardado de config (SPEC 04), se recorren todas las charlas del `state` normalizado y se encolan para descarga secuencial (una por una) las presentaciones cuyo archivo local no existe o cuyo `actualizado` no coincide con el manifest. Presentaciones `esVirtual: true` se descargan igual, sin tratamiento especial.
- Si una descarga individual de la cola falla (red, 404, etc.), se loguea el error y se continúa con la siguiente; no hay reintento inmediato — la presentación sigue figurando como no descargada/desactualizada y se reintentará en el próximo escaneo (próximo refresh periódico, reset o guardado de config).
- Botón "Go" en Speaker: al hacer click, si la presentación ya está descargada y al día según el manifest, se abre directamente; si no (todavía no llegó la precarga, o falló), se dispara una descarga on-demand en ese momento, mostrando un estado de carga en el botón mientras se espera, y luego se abre el archivo. Si la descarga on-demand también falla, se muestra el mensaje de error existente (patrón SPEC 02) en vez de abrir.
- Apertura de archivos híbrida (corrección post-Paso 7): para `.ppt`/`.pptx`, se mantiene el mecanismo de SPEC 02 (`POWERPNT.EXE /S`, modo presentación/slideshow directo) si PowerPoint está instalado; para cualquier otra extensión (`.pdf`, etc.), o si no se encuentra PowerPoint, se usa `shell.openPath()` de Electron según la extensión real, con la app por defecto del sistema operativo.
- El handler `open-presentation` (IPC) pasa a recibir `{ presentacion, fecha, disertante }` (corrección post-Paso 8: antes solo `presentacion`) en vez de una ruta de archivo cruda, ya que ahora resuelve la ruta local (`userData/presentaciones/{fecha}/{disertante}/{nombreArchivo}`) internamente y dispara la descarga on-demand si hace falta. `fecha` y `disertante` se propagan desde el renderer: `schedule.js` (fecha activa) → `session.js` → `speaker.js`, que arma el payload con `speaker.name` como `disertante`.

**Fuera de scope (para specs futuras):**

- Archivos `.key` (Keynote): quedan explícitamente para otra spec, no se contempla su apertura en esta.
- Empaquetado/instalador de la app y portabilidad de `config.json` entre PCs del venue: se documenta como riesgo heredado, no se resuelve acá (ver Risks).
- Descarga o resolución de imágenes (logo del congreso, foto del disertante, logo del sponsor, QR) vía el mismo mecanismo — sigue fuera de scope como en SPEC 03.
- Límite de concurrencia configurable, reintentos automáticos con backoff, o barra de progreso de descarga visible al usuario — la precarga es secuencial y silenciosa (sin UI de progreso), salvo el estado de carga puntual del botón Go en la descarga on-demand.
- Limpieza de archivos locales huérfanos (presentaciones descargadas que ya no aparecen en `/charlas`, ej. charla eliminada o cambiada) — el manifest y los archivos se acumulan sin poda automática.
- Límite de espacio en disco o gestión de cuota de almacenamiento.

## Data model

**`userData/presentaciones/manifest.json`** (nuevo; corrección post-Paso 9: clave cambiada de `presentacion.id` a `{fecha}_{charla.id}`):

```json
{
  "2026-09-23_712": "2026-07-28T20:07:07+00:00",
  "2026-09-23_713": "2026-07-29T10:12:03+00:00"
}
```

Convenciones:

- Clave: `` `${fecha}_${charlaId}` `` (`fecha` = clave de `sessionsByDate`, `charlaId` = `charla.id`, no `presentacion.id`). Se eligió `charla.id` en vez de `presentacion.id` porque ahora la ruta local depende del contexto de la charla (fecha + disertante), no solo de la presentación en sí.
- Valor: el `presentacion.actualizado` con el que se descargó exitosamente por última vez ese archivo.
- Se lee/escribe completo (`JSON.parse`/`JSON.stringify`) en cada descarga exitosa; si el archivo no existe todavía (primer arranque), se trata como `{}`.
- La descarga on-demand (Go) necesita `charlaId` además de `fecha`/`disertante` para construir esta clave — se propaga como `session.id` desde `speaker.js` (ver IPC `open-presentation` más abajo).

**Archivos descargados (corrección post-Paso 8):** `userData/presentaciones/{fecha}/{disertante}/{nombreArchivo}` (ej. `userData/presentaciones/2026-09-23/Dr. Felipe Ruiz/713.pptx`), organizados por carpeta de día y de disertante para facilitar la navegación manual del kiosco. `disertante` es `charla.speaker.name` (o `speaker.name` en Speaker), saneado con `sanitizeForPath` — se reemplazan los caracteres inválidos en Windows (`\ / : * ? " < > |`) por `_` antes de usarlo como nombre de carpeta. `fecha` es la clave de fecha ya usada en `sessionsByDate` (`YYYY-MM-DD`).

**Riesgo aceptado (corrección post-Paso 8):** al usar `nombreArchivo` tal cual (en vez de `id`) como nombre de archivo final, si dos presentaciones distintas (`id` distinto) del mismo disertante el mismo día compartieran `nombreArchivo`, se pisarían en disco — y `isDownloaded` de la segunda podría dar falso positivo (el archivo existe, aunque sea el de la otra presentación) ya que solo compara `id`+`actualizado` contra el manifest y la existencia del archivo, no su contenido. Se acepta este riesgo por ser un caso no observado en los datos reales del congreso (SPEC 03); revierte parcialmente la protección anti-colisión que tenía el esquema `{id}{extension}` de la versión anterior de esta spec.

**Estado de descarga en memoria (`main.js`/nuevo módulo), no persistido:**

```js
// Cola de descarga en background, procesada secuencialmente
let downloadQueue = [] // array de objetos `presentacion` pendientes

// Set de ids actualmente en descarga on-demand (disparada desde Go),
// para no disparar dos descargas simultáneas de la misma presentación
// si el usuario hace doble click o coincide con la cola de background.
let inFlightIds = new Set()
```

**IPC `open-presentation`** cambia de firma:

```js
// Antes (SPEC 02): ipcRenderer.invoke('open-presentation', pptPath)
// Paso 5-8 de esta spec: ipcRenderer.invoke('open-presentation', presentacion)
// Corrección post-Paso 8 (organización por carpetas) + post-Paso 9 (clave de manifest):
ipcRenderer.invoke('open-presentation', { presentacion, fecha, disertante, charlaId })
// presentacion = { id, nombreArchivo, extension, actualizado, esVirtual }
// (el mismo objeto ya presente en speaker.presentacion del state normalizado)
// fecha = clave de fecha de sessionsByDate (YYYY-MM-DD), propagada desde schedule.js
// disertante = speaker.name, usado (saneado) como nombre de carpeta
// charlaId = session.id (el id de la charla, no de la presentación), usado para la clave del manifest
```

Convenciones:

- No se agrega ningún campo nuevo al modelo normalizado de SPEC 03 (`presentacion` ya tiene todo lo necesario: `id`, `nombreArchivo`, `extension`, `actualizado`); `fecha` y `disertante` viajan aparte, como contexto de la charla, no como parte de `presentacion`.
- El manifest y los archivos descargados viven enteramente en `userData/presentaciones/`, sin relación con `config.json`.

## Implementation plan

1. Crear `src/main/presentationDownloader.js` con `downloadPresentacion(presentacion, config)`: arma la URL `{ftpBaseUrl}/sync/ftpspace/{codigoEvento}/{nombreArchivo}`, hace `fetch`, escribe el binario en `userData/presentaciones/{id}{extension}` (creando la carpeta si no existe), y actualiza `manifest.json` con `{ [id]: actualizado }` tras éxito. Verificación manual: script/log temporal que llame la función con un `presentacion` real y confirme que el archivo aparece en `userData/presentaciones/` y el manifest se actualiza.
2. En el mismo módulo, agregar `isDownloaded(presentacion)`: lee `manifest.json`, devuelve `true` si existe entrada para `id` y su valor coincide con `presentacion.actualizado` Y el archivo local existe en disco (chequeo de ambos, no solo el manifest). Verificación manual: con un archivo ya descargado, cambiar el `actualizado` simulado en el objeto de prueba y confirmar que `isDownloaded` devuelve `false`.
3. Agregar `resolveLocalPath(presentacion)` (solo arma la ruta `userData/presentaciones/{id}{extension}`, sin verificar existencia) y `enqueueDownloads(charlas, config)`: recorre todas las charlas del `state` normalizado, filtra las que tienen `presentacion !== null` y `!isDownloaded(presentacion)`, y las agrega a una cola interna que se procesa secuencialmente (una descarga a la vez, esperando que cada una termine —éxito o error— antes de iniciar la siguiente); errores individuales se loguean con `console.error` y no detienen la cola. Verificación manual: con varias charlas de prueba (algunas ya descargadas, otras no), confirmar en logs que solo se descargan las pendientes, una por vez.
4. En `src/main/appState.js`, invocar `enqueueDownloads(state.sessionsByDate, config)` al final de `fetchInitialData`, `refreshCharlas` y del flujo de `save-settings` (después de que el nuevo `state` esté disponible), sin bloquear la resolución de esas funciones (fire-and-forget). Verificación manual: arrancar `npm start` y ver en logs que arranca la cola de descarga después del fetch inicial; esperar el refresh de 1 min y confirmar que se dispara un nuevo escaneo.
5. En `main.js`, reescribir el handler `open-presentation`: recibe `presentacion` (no `pptPath`); si `isDownloaded(presentacion)` es `true`, resuelve la ruta local y abre directo; si no, llama a `downloadPresentacion` (descarga on-demand, usando `inFlightIds` para no duplicar si ya está en cola background) y, si tiene éxito, abre el archivo recién descargado. Apertura híbrida (corrección post-Paso 7): si la extensión es `.ppt`/`.pptx` y se encuentra `POWERPNT.EXE`, se ejecuta con `execFile(..., ['/S', rutaLocal])` (modo presentación, mecanismo de SPEC 02); en cualquier otro caso (otra extensión, o PowerPoint no encontrado), se usa `shell.openPath(rutaLocal)`. Verificación manual: con una presentación no descargada aún, click en Go dispara la descarga on-demand (visible en logs/Network) y luego abre el archivo; para `.pptx` debe abrir en modo presentación (slideshow), no en modo edición.
6. Ajustar el manejo de errores de `open-presentation`: si `shell.openPath` devuelve un string no vacío (indica error en Electron) o la descarga on-demand falla, devolver `{ success: false, error: <mensaje> }` con mensajes distintos para "no se pudo descargar" vs. "no se pudo abrir el archivo". Verificación manual: apuntar `config.json` a una URL inválida y confirmar que Go muestra el error de descarga sin romper la app; con descarga OK pero extensión no asociada a ningún programa en Windows, confirmar el error de apertura.
7. En `src/screens/speaker.js`, actualizar el listener de Go para llamar `window.octopusBridge.openPresentation(speaker.presentacion)` (objeto completo, no `nombreArchivo`), deshabilitar el botón y mostrar un indicador de carga (ej. texto "Abriendo..." o spinner) mientras la promesa está pendiente, y restaurar el botón al resolver (éxito o error). Verificación manual: click en Go sobre una presentación no descargada muestra el estado de carga en el botón hasta que el archivo se abre o aparece el error.
8. En `preload.js`, actualizar la firma expuesta de `openPresentation` si hace falta (pasa a reenviar el objeto `presentacion` tal cual al `invoke`). Verificación manual: revisar en DevTools del renderer que `octopusBridge.openPresentation(presentacionObj)` funciona end-to-end.
9. **(Corrección post-Paso 8)** Reorganizar el almacenamiento local en carpetas: `buildLocalPath(presentacion, context)` arma `userData/presentaciones/{fecha}/{disertante saneado}/{nombreArchivo}` en vez de `{id}{extension}`; `downloadPresentacion`, `isDownloaded`, `resolveLocalPath`, `downloadOnDemand` y la cola de background (`enqueueDownloads`/`collectPresentaciones`/`processQueue`) pasan a llevar `context` (`{ fecha, disertante }`) junto al `presentacion`. Para que la descarga on-demand (Go) tenga ese contexto, se propaga `fecha` desde `schedule.js` (`activeDate`) → `session.js` → `speaker.js`, que arma `{ presentacion, fecha, disertante: speaker.name }` al invocar `openPresentation`; `main.js` desestructura ese payload. Verificación manual: confirmar que los archivos aparecen en `userData/presentaciones/{fecha}/{disertante}/` tanto en la precarga en background como en la descarga on-demand desde Go.
10. **(Corrección post-Paso 9)** Cambiar la clave del manifest de `presentacion.id` a `` `${fecha}_${charlaId}` ``: `buildManifestKey(context)` centraliza el armado de esta clave; `isDownloaded`, `downloadPresentacion` (lectura/escritura del manifest) y `runDownload` (clave del mapa `inFlightDownloads`) pasan a usarla. `context` se extiende con `charlaId` (`charla.id` en la cola de background, `session.id` en `speaker.js` para el on-demand); `main.js` y el payload IPC de `openPresentation` incluyen `charlaId`. Verificación manual: confirmar que `manifest.json` queda con claves `{fecha}_{charlaId}` (ej. `"2026-09-23_712"`) tanto en la precarga en background como en la descarga on-demand.
11. **(Corrección post-Paso 10, bug reportado por el usuario)** Evitar que un archivo reemplazado en el servidor siga sirviéndose desde caché: `buildDownloadUrl` agrega `?v={presentacion.actualizado}` a la URL de descarga, y `downloadPresentacion` pasa `{ cache: 'no-store' }` a `fetch`. Verificación manual: confirmar con `curl -I` que la URL con `?v=...` devuelve `cf-cache-status: MISS` en vez de `HIT`, y que la descarga sigue funcionando end-to-end con la URL modificada.
12. **(Corrección post-Paso 11, bug reportado por el usuario)** En `src/screens/speaker.js`, el click en Go re-resuelve la presentación actual desde `window.OctopusState.getState()` (`findCurrentPresentacion(fecha, charlaId, fallback)`) en vez de usar directamente `session.speaker.presentacion` capturado al navegar a la pantalla. Bug: si el usuario se queda parado en Speaker y llega un refresh en background (1 min) con un `actualizado` nuevo, el objeto capturado en el render original quedaba desactualizado — Go seguía enviando el `actualizado` viejo, que coincidía con lo que ya había en el manifest/cache y no disparaba la re-descarga (mientras que un `reset`, al renavegar desde cero, sí tomaba el dato fresco). Verificación manual: harness aislado que renderiza Speaker, simula un `onStateUpdated` con `actualizado` nuevo para la misma charla sin renavegar, y confirma que el payload enviado a `openPresentation` refleja el valor nuevo.

## Acceptance criteria

- [x] Al arrancar `npm start` con la API accesible, tras el fetch inicial se descargan en background y de forma secuencial todas las presentaciones (`presentacion !== null`) que no estén ya en `userData/presentaciones/` con el `actualizado` vigente.
- [x] Los archivos descargados quedan en `userData/presentaciones/{fecha}/{disertante}/{nombreArchivo}`, y `userData/presentaciones/manifest.json` registra el `actualizado` de cada descarga exitosa (indexado por `{fecha}_{charlaId}`).
- [x] Si una presentación ya está descargada y su `actualizado` coincide con el manifest, no se vuelve a descargar en un nuevo escaneo (fetch inicial, refresh, reset o guardado de config).
- [x] Si el `actualizado` de una presentación cambia en la API respecto al manifest, se vuelve a descargar y se sobrescribe el archivo local y la entrada del manifest.
- [x] Cada refresh periódico (1 min), el botón "reset" y el guardado de configuración (SPEC 04) disparan un nuevo escaneo de descargas pendientes/desactualizadas.
- [x] Si falla la descarga de una presentación durante el escaneo en background, el resto de la cola continúa descargándose sin interrupción, y esa presentación queda pendiente para el próximo escaneo.
- [x] En Speaker, al hacer click en "Go" sobre una presentación ya descargada y al día, el archivo se abre: si es `.ppt`/`.pptx` y PowerPoint está instalado, en modo presentación (slideshow, `POWERPNT.EXE /S`, como en SPEC 02); en cualquier otro caso, con la app por defecto del sistema operativo según su extensión.
- [x] En Speaker, al hacer click en "Go" sobre una presentación no descargada todavía (o desactualizada), el botón muestra un estado de carga, se dispara la descarga on-demand, y al completarse se abre el archivo automáticamente.
- [x] Si la descarga on-demand disparada desde Go falla, se muestra el mensaje de error existente (patrón SPEC 02) sin romper la app, y el botón vuelve a su estado normal.
- [x] Presentaciones con `esVirtual: true` se descargan y abren igual que el resto, sin tratamiento especial.
- [x] No se rompe ninguna funcionalidad existente de SPEC 01/02/03/04 (navegación, botón Go condicional a `presentacion !== null`, sufijo de rol, refresh periódico, reset, config) salvo los cambios explícitamente documentados en esta spec.

## Decisions

- **Sí:** URL de descarga `{ftpBaseUrl}/sync/ftpspace/{codigoEvento}/{nombreArchivo}`, confirmada por el usuario (corrección post-Paso 1: originalmente se había documentado `apiBaseUrl`, pero el host de FTP es distinto del de la API). No usa `presentacion.id` en el path.
- **Sí:** `ftpBaseUrl` es un campo nuevo, independiente de `apiBaseUrl`, agregado a `config.json` y editado a mano (sin campo en la pantalla de configuración de SPEC 04).
- **Sí:** precarga en background secuencial (una descarga a la vez), disparada en fetch inicial, refresh periódico, reset y guardado de config. Prioriza simplicidad y no saturar la red del venue sobre velocidad de la carga inicial.
- **No:** concurrencia limitada o paralelismo sin límite. Se puede reconsiderar más adelante si la descarga secuencial resulta demasiado lenta con muchas presentaciones.
- **Sí:** archivos guardados en `app.getPath('userData')/presentaciones/{id}{extension}`, no en la carpeta del proyecto. Es la carpeta estándar de Electron para datos persistentes por instalación/máquina, no viaja con el código ni se pisa en un update del código fuente.
- **Sí:** manifest propio (`manifest.json`) en vez de comparar contra la fecha de modificación del archivo en disco. Es más preciso: la fecha de descarga no tiene relación directa con `actualizado` de la API.
- **Sí:** en caso de fallo de descarga on-demand (Go), no reintento automático — se muestra error inmediato, siguiendo el patrón ya establecido en SPEC 02 para fallos de apertura.
- **No:** reintentos automáticos con backoff durante la precarga en background. Un fallo puntual no debe demorar el resto de la cola; el propio ciclo de refresh de 1 minuto ya actúa como reintento natural.
- **No (corrección post-Paso 7):** reemplazar completamente la lógica de PowerPoint de SPEC 02 por `shell.openPath()`. SPEC 02 exige explícitamente que `.ppt`/`.pptx` abra en modo presentación (slideshow), no en modo edición — `shell.openPath()` solo invoca la app por defecto, que abre PowerPoint en modo edición. Se mantiene un mecanismo híbrido: `.ppt`/`.pptx` sigue usando `POWERPNT.EXE /S` (SPEC 02) si PowerPoint está instalado; cualquier otra extensión (`.pdf`, etc.), o el caso de que no se encuentre PowerPoint, usa `shell.openPath()` delegando en la app por defecto del SO.
- **No:** soporte de archivos `.key` en esta spec. Explícitamente pedido por el usuario para spec futura (probablemente requiere conversión, no apertura directa).
- **Sí:** `esVirtual` no cambia el comportamiento de descarga/apertura en esta spec — se descarga y abre igual que cualquier otra presentación. Su significado semántico queda para una spec futura si hace falta.
- **Sí:** IPC `open-presentation` pasa a recibir el objeto `presentacion` completo en vez de una ruta de archivo cruda. Necesario porque ahora la ruta local se resuelve internamente (`id`+`extension`) y puede requerir disparar una descarga antes de abrir.
- **No:** UI de progreso de descarga en background (barra, contador, notificación). Solo el botón Go muestra un estado de carga puntual en la descarga on-demand; la precarga en background es silenciosa, consistente con el tono utilitario/kiosco del sistema de diseño (sin elementos no contemplados en las 4 pantallas fuente).
- **No:** limpieza de archivos huérfanos ni límite de espacio en disco en esta spec. Se documenta como riesgo aceptado, no bloqueante para el uso normal de un evento.
- **Sí:** el tema de empaquetado/instalador y portabilidad de `config.json` entre PCs del venue queda explícitamente fuera de esta spec (decisión tomada con el usuario durante Fase 2), documentado como riesgo heredado.
- **Sí (corrección post-Paso 8):** organizar los archivos descargados en `userData/presentaciones/{fecha}/{disertante}/{nombreArchivo}` en vez de `{id}{extension}` plano, para que la carpeta sea navegable/inspeccionable manualmente por día y disertante. Pedido explícito del usuario tras ver dónde se guardaban los archivos.
- **Sí (corrección post-Paso 8):** `fecha` y `disertante` se propagan desde el renderer (`schedule.js` → `session.js` → `speaker.js` → IPC) en vez de derivarse en el proceso principal, ya que `main.js` no tiene noción de "la charla actualmente vista" — solo `state.sessionsByDate` completo.
- **Sí (corrección post-Paso 8):** el nombre de carpeta del disertante se sanea reemplazando caracteres inválidos en Windows (`\ / : * ? " < > |`) por `_`, para que la creación de carpeta no falle ante nombres con esos caracteres.
- **Sí (corrección post-Paso 9):** la clave del manifest pasa de `presentacion.id` a `` `${fecha}_${charlaId}` `` (`charla.id`, no `presentacion.id`). Pedido explícito del usuario; además resuelve parte del riesgo de falso positivo documentado en el Data model, ya que ahora la detección "descargado/al día" queda atada a la charla+fecha concreta en vez de solo al `id` de la presentación.
- **Sí (corrección post-Paso 10, bug reportado por el usuario):** la URL de descarga incluye `?v={actualizado}` como cache-busting, y el `fetch` usa `{ cache: 'no-store' }`. Diagnóstico: al reemplazar un archivo en el servidor (con `actualizado` ya actualizado en la API), el usuario seguía viendo/abriendo el archivo viejo. Se confirmó con `curl` que `octopus-ftp.space` está detrás de Cloudflare con `cache-control: max-age=14400` y devolvía `cf-cache-status: HIT` — el CDN podía servir el archivo viejo desde caché de borde hasta 4hs después del reemplazo, sin relación con la lógica de `actualizado`/manifest de esta spec (que sí detectaba el cambio y disparaba la re-descarga correctamente). Agregar `?v={actualizado}` hace que la URL cambie cada vez que cambia `actualizado`, forzando un cache-miss en Cloudflare (verificado con `curl`: `cf-cache-status: MISS`); `cache: 'no-store'` evita además que el propio `fetch` de Electron/Chromium sirva una respuesta cacheada localmente.
- **Sí (corrección post-Paso 11, bug reportado por el usuario):** Go re-resuelve la presentación actual desde `window.OctopusState.getState()` en vez de confiar ciegamente en `session.speaker.presentacion` capturado al navegar a Speaker. `speaker.js`, a diferencia de `schedule.js`, no se suscribía a `window.OctopusState.subscribe` — si el usuario quedaba parado en la pantalla y el refresh periódico traía un `actualizado` nuevo, ese cambio nunca llegaba al closure ya renderizado, y Go seguía mandando el valor viejo (que además podía pegarle a una URL cache-busted vieja ya servida por Cloudflare). Un `reset` sí funcionaba porque renavega desde cero con datos frescos.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `config.json` vive dentro de la carpeta de instalación (`__dirname`), sin empaquetado/instalador definido todavía; distribuir la app a las PCs del venue hoy implica copiar la carpeta del repo a mano, y un futuro instalador podría pisar `config.json` en cada actualización | Riesgo heredado de SPEC 03/04, fuera de scope de esta spec (decisión explícita con el usuario). Documentado para que se resuelva en una spec futura de empaquetado/distribución. |
| La precarga secuencial puede tardar mucho en el primer arranque si hay cientos de presentaciones nuevas, dejando "Go" en descarga on-demand para las que todavía no llegaron en la cola | Aceptado: el fallback on-demand en Go cubre este caso mostrando estado de carga; no bloquea el uso de la app mientras la cola de background avanza. |
| Descargar el mismo archivo simultáneamente desde la cola de background y desde un click en Go (carrera) podría corromper el archivo o duplicar tráfico | `inFlightIds` evita disparar una segunda descarga de la misma presentación si ya hay una en curso; Go espera esa descarga en curso en vez de iniciar una nueva. |
| `shell.openPath()` depende de que el SO tenga una app asociada a la extensión (`.pptx`, `.pdf`, etc.); en una PC del venue sin esa asociación configurada, Go fallaría igual que antes fallaba sin PowerPoint instalado | Se muestra el mensaje de error de apertura devuelto por `shell.openPath()`, consistente con el patrón de error ya usado en SPEC 02. |
| El manifest (`manifest.json`) y los archivos en `userData/presentaciones/` se acumulan sin límite ni poda a lo largo de múltiples eventos usando la misma instalación | Aceptado como riesgo de bajo impacto para esta spec (sin límite de espacio en disco definido); se puede abordar en una spec futura si el disco del kiosco se vuelve un problema real. |
| `octopus-ftp.space` está detrás de Cloudflare con `cache-control: max-age=14400`; si en el futuro se configura "Cache Level: Ignore Query String" (o similar) en Cloudflare, el cache-busting `?v={actualizado}` dejaría de servir para evitar contenido viejo tras reemplazar un archivo | Mitigado hoy verificando con `curl -I` que la query string SÍ afecta la cache key (`cf-cache-status: MISS`). Si cambia la configuración de Cloudflare, habría que revisar este mecanismo (ej. purgar caché vía API de Cloudflare, o cambiar de convención de nombre de archivo en el origen). |
