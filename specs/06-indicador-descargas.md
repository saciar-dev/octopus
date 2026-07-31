# SPEC 06 — Indicador de descargas en curso

> **Estado:** aprobado
> **Depende de:** SPEC 05 (descarga-presentaciones)
> **Fecha:** 2026-07-31
> **Objetivo:** Mostrar en el footer, visible en todas las pantallas, un indicador de texto en inglés con el progreso de la cola de descarga en background ("Downloading X/Y") y, si hubo fallos en el último escaneo, un mensaje de error temporal ("N failed"), sin tocar el estado de carga ya existente del botón Go.

## Scope

**Incluye:**

- El footer compartido (`OctopusChrome.renderFooter()`, usado en `config.js`/`schedule.js`/`session.js`/`speaker.js`, y el `.screen-footer` propio de `splash.js`) pasa a mostrar un indicador de texto + ícono cuando la cola de descarga en background (`presentationDownloader.js`) está activa o acaba de fallar algo. En reposo (cola vacía, nada en curso, sin fallos recientes) el footer queda vacío, igual que hoy.
- `presentationDownloader.js` emite el progreso de cada escaneo (`processQueue`) hacia el proceso main: total de pendientes detectadas al iniciar el escaneo (Y, recalculado dinámicamente si se agregan más pendientes mientras corre), cuántas ya se resolvieron (X, éxito o error cuentan como "resueltas" a los fines del contador), y cuántas fallaron en ese escaneo puntual.
- `main.js` reenvía ese progreso al renderer vía IPC push (`webContents.send`), y `preload.js` expone un listener (`onDownloadProgress` o similar) en `window.octopusBridge`.
- En el renderer, un módulo/listener centralizado (probablemente en `app.js`, ya que corre en todas las pantallas) escucha ese evento y actualiza el/los nodo(s) `.screen-footer` presentes en el DOM en cada momento:
  - Mientras `processQueue` está corriendo: ícono pequeño de spinner (SVG con `@keyframes` de rotación, mismo estilo de trazo `stroke="currentColor"` que los íconos ya usados en `chrome.js`) + texto `"Downloading X/Y"`.
  - Al terminar un escaneo, si hubo `N` fallos: ícono de advertencia (signo de exclamación, mismo estilo de trazo) + texto `"N failed"`, visible unos segundos, y después el footer vuelve a quedar vacío (salvo que ya haya arrancado un escaneo nuevo).
  - Si el escaneo termina sin fallos: el footer vuelve a quedar vacío inmediatamente.
- Este indicador es puramente informativo: no es clickeable, no despliega detalle de archivos individuales, no ofrece reintento manual.
- Texto en inglés (chrome de UI, según CLAUDE.md), independiente del idioma del contenido de sesión/disertante.
- Ambos íconos son nuevos (no existen en las 4 pantallas fuente ni en el sistema de diseño actual) — se documenta como decisión explícita pedida por el usuario, construidos con el mismo lenguaje visual (SVG stroke, `currentColor`) que los íconos ya existentes en `chrome.js`, no como una librería de íconos nueva.

**Fuera de scope (para specs futuras):**

- Estado de carga del botón "Go" (descarga on-demand) — ya existe desde SPEC 05 y no cambia; el indicador de este spec es exclusivo de la cola de background.
- Panel expandible o detalle de qué archivos específicos se están descargando o fallaron — solo contador agregado + ícono.
- Persistencia del historial de fallos entre reinicios de la app o entre escaneos — el contador de fallidas es del último escaneo únicamente, no acumulativo.
- Mensaje/ícono de estado "al día" permanente cuando no hay actividad — el footer queda vacío en reposo.
- Otros usos del ícono de spinner/advertencia fuera de este footer (ej. no se reutiliza en el botón Go).

## Data model

**Estado de progreso en memoria (`src/main/presentationDownloader.js`), no persistido:**

```js
// Progreso del escaneo (processQueue) actualmente en curso, o null si no hay ninguno corriendo
let currentProgress = null
// currentProgress = { total: number, resolved: number, failed: number }
// - total: cantidad de pendientes detectadas al iniciar el escaneo; crece si enqueueDownloads
//   agrega más pendientes mientras este escaneo ya está corriendo (Y dinámico)
// - resolved: cuántas de esas ya terminaron de procesarse (éxito o error), incluye a `failed`
// - failed: cuántas de las resueltas terminaron en error en este escaneo puntual
```

Convenciones:

- `currentProgress` vive solo en memoria del proceso main, se recrea en cada `npm start`; no se persiste en `manifest.json` ni en ningún archivo — es exclusivamente para informar al renderer en tiempo real.
- Cuando `processQueue` arranca (primera vez que `downloadQueue.length > 0` y `queueRunning` pasa a `true`), se inicializa `currentProgress = { total: downloadQueue.length, resolved: 0, failed: 0 }`.
- Cada vez que `enqueueDownloads` agrega ítems nuevos mientras `queueRunning` ya es `true`, `currentProgress.total` se incrementa en la cantidad agregada (Y dinámico).
- Cada vez que `runDownload` (dentro de `processQueue`) resuelve (éxito o error), `currentProgress.resolved` se incrementa; si fue error, también `currentProgress.failed`.
- Al vaciarse `downloadQueue` y terminar el loop (`queueRunning` vuelve a `false`), si `currentProgress.failed > 0` se emite un evento final de "fallos" y luego, tras el timeout de unos segundos (a definir en el plan), `currentProgress` pasa a `null`; si `failed === 0`, `currentProgress` pasa a `null` inmediatamente.

**Evento IPC push `download-progress`** (nuevo; `main.js` → renderer vía `webContents.send`, expuesto en `preload.js` como `onDownloadProgress(callback)`):

```js
// Payload enviado en cada cambio relevante de currentProgress
{ status: 'downloading', total: 12, resolved: 3 }
// o, al terminar un escaneo con fallos (mensaje temporal):
{ status: 'failed', failed: 2 }
// o, al volver a reposo (cola vacía, sin fallos pendientes de mostrar):
{ status: 'idle' }
```

Convenciones:

- No se agrega ningún campo nuevo a `config.json` ni al `state` normalizado de SPEC 03/04/05 — este progreso es efímero y no forma parte del `state` que ya expone `getState()`/`onStateUpdated`.
- El renderer (listener centralizado en `app.js`) mantiene el último payload recibido en una variable local y lo aplica a todos los nodos `.screen-footer` presentes en el DOM en ese momento (splash usa su propio `.screen-footer`, el resto vía `chrome.js`), para que al navegar de pantalla el footer nuevo ya nazca con el estado correcto sin esperar el próximo evento.

## Implementation plan

1. En `src/main/presentationDownloader.js`, agregar el estado `currentProgress` y un emisor de eventos simple (ej. `EventEmitter` de Node, exportado como `downloadEvents`) que dispare `'progress'` con el payload `{ status, total, resolved, failed }` en cada punto descrito en el Data model: inicio de escaneo (`downloading`, `resolved: 0`), cada resolución individual dentro de `processQueue` (`downloading`, `resolved` actualizado), fin de escaneo con fallos (`failed`), fin de escaneo sin fallos o tras el timeout post-fallos (`idle`). Verificación manual: script/log temporal que se suscribe a `downloadEvents` y corre `enqueueDownloads` con datos de prueba, confirmando en consola la secuencia de eventos esperada.
2. En el mismo módulo, implementar el timeout post-fallos (constante, ej. `FAILED_MESSAGE_DURATION_MS = 6000`): al terminar `processQueue` con `failed > 0`, emitir `{ status: 'failed', failed }` y programar un `setTimeout` que emita `{ status: 'idle' }` pasado ese tiempo, cancelando cualquier timeout pendiente anterior si arranca un nuevo escaneo antes de que se cumpla. Verificación manual: forzar un fallo de descarga (ej. `ftpBaseUrl` inválido temporalmente) y confirmar en logs que el evento `failed` aparece y, ~6s después, aparece `idle`.
3. En `main.js`, suscribirse a `downloadEvents.on('progress', ...)` una sola vez al arrancar la app, y reenviar cada payload a la ventana activa vía `mainWindow.webContents.send('download-progress', payload)`. Verificación manual: con DevTools del renderer abierto, `require('electron').ipcRenderer.on('download-progress', console.log)` y disparar un escaneo real, confirmar que los payloads llegan.
4. En `preload.js`, exponer `onDownloadProgress(callback)` vía `contextBridge`, que se suscribe a `ipcRenderer.on('download-progress', ...)` y llama a `callback(payload)`. Verificación manual: desde DevTools del renderer, `window.octopusBridge.onDownloadProgress(console.log)` y confirmar que loguea los mismos payloads que el paso 3.
5. En `src/app.js`, agregar un listener global (registrado una sola vez, fuera del ciclo de render de pantallas) que llama a `window.octopusBridge.onDownloadProgress` y guarda el último payload recibido en una variable de módulo; implementar una función `updateDownloadFooters()` que busca todos los `.screen-footer` presentes en el DOM y les aplica el contenido (texto + ícono) según el último payload (`idle` → vacío; `downloading` → spinner + `"Downloading X/Y"`; `failed` → advertencia + `"N failed"`). Llamar a `updateDownloadFooters()` tanto al recibir cada evento como después de cada `renderCurrent()`/cambio de pantalla, para que el footer nuevo nazca con el estado correcto. Verificación manual: arrancar `npm start`, forzar un escaneo (reset), navegar entre pantallas mientras corre, confirmar que el footer se actualiza en todas y mantiene el estado correcto al navegar.
6. En `src/styles/app.css`, agregar los estilos del contenido del footer (texto pequeño, tamaño/color consistente con `--color-text-muted` u otro token ya existente) y el `@keyframes` de rotación del ícono de spinner (SVG con `stroke="currentColor"`, mismo lenguaje visual que los íconos de `chrome.js`), más el ícono estático de advertencia (signo de exclamación) para el estado `failed`. Verificación manual: inspeccionar visualmente que el spinner gira de forma fluida y el ícono de advertencia se ve legible sobre el footer, en tema claro y oscuro (SPEC 04).
7. Verificación end-to-end: con presentaciones reales pendientes de descarga (o forzando el escaneo con `reset`), confirmar que el footer muestra `"Downloading X/Y"` con spinner mientras corre la cola, que el contador sube correctamente, que al terminar sin fallos el footer queda vacío, y que forzando al menos un fallo (ej. una presentación con `nombreArchivo` inexistente en el FTP) se ve `"N failed"` con el ícono de advertencia durante unos segundos antes de volver a vacío.

## Acceptance criteria

- [ ] Al arrancar `npm start` o disparar cualquier escaneo (fetch inicial, refresh periódico de 1 min, reset, guardado de config) con presentaciones pendientes, el footer muestra `"Downloading X/Y"` con un ícono de spinner animado, visible en la pantalla en la que esté parado el usuario.
- [ ] El contador `X` sube a medida que se resuelven descargas (éxito o error) dentro del escaneo en curso.
- [ ] Si durante un escaneo en curso se detectan más pendientes (ej. un refresh se dispara mientras otro escaneo todavía corre), `Y` se actualiza dinámicamente para reflejar el nuevo total combinado.
- [ ] Si el escaneo termina sin ningún fallo, el footer vuelve a quedar vacío inmediatamente.
- [ ] Si el escaneo termina con `N` fallos, el footer muestra `"N failed"` con un ícono de advertencia (signo de exclamación) durante unos segundos, y después vuelve a quedar vacío automáticamente (salvo que ya haya arrancado un nuevo escaneo antes de que se cumpla el timeout).
- [ ] El contador de fallidas refleja solo el último escaneo, no es acumulativo entre escaneos.
- [ ] El indicador es visible en las 5 pantallas (Splash, Schedule, Session, Speaker, Config) que usan el footer compartido, y se mantiene consistente al navegar entre ellas mientras un escaneo está en curso.
- [ ] El estado de carga del botón "Go" (SPEC 05) no se ve afectado por este indicador — siguen siendo mecanismos independientes.
- [ ] El texto del indicador está en inglés (`"Downloading X/Y"`, `"N failed"`), consistente con el resto del chrome de UI.
- [ ] No se rompe ninguna funcionalidad existente de SPEC 01-05 (navegación, descarga en background, botón Go, refresh periódico, reset, config, temas) salvo los cambios explícitamente documentados en esta spec.

## Decisions

- **Sí:** el indicador vive en el footer compartido (`OctopusChrome.renderFooter()` + el `.screen-footer` de `splash.js`), visible en las 5 pantallas, en vez de acotarlo a una sola pantalla. La precarga en background puede terminar/fallar mientras el usuario está en cualquier pantalla del kiosco.
- **Sí:** contador simple `"X/Y"` en vez de un panel con detalle de archivos individuales. Consistente con el tono utilitario del kiosco; suficiente para que el staff sepa que hay actividad, sin necesitar una UI de gestión de descargas.
- **Sí:** se agregan dos íconos animados/nuevos (spinner de descarga, advertencia de fallo) pedidos explícitamente por el usuario, aunque no existan en las 4 pantallas fuente del sistema de diseño. Se construyen con el mismo lenguaje visual (SVG stroke, `currentColor`) que los íconos ya usados en `chrome.js`, para minimizar la disonancia visual con el resto de la app.
- **No:** reutilizar este ícono/indicador en el botón "Go" — esa descarga on-demand ya tiene su propio estado de carga (SPEC 05) y queda fuera de scope de esta spec.
- **Sí:** el total `Y` es dinámico — si llegan más pendientes mientras un escaneo ya está corriendo, se suman al total en curso en vez de esperar a un nuevo escaneo separado. Refleja mejor la realidad de que `enqueueDownloads` puede dispararse varias veces mientras `processQueue` todavía no terminó.
- **Sí:** el contador de fallidas es del último escaneo únicamente, no acumulativo entre escaneos. El propio refresh de 1 min ya actúa como reintento natural (decisión heredada de SPEC 05); acumular fallos históricos requeriría persistencia adicional no pedida.
- **Sí:** el mensaje de error (`"N failed"`) se oculta automáticamente tras un timeout fijo (definido en código, no configurable) en vez de quedar visible hasta el próximo escaneo exitoso. Pedido explícito del usuario en Fase 2.
- **No:** estado idle permanente (ej. "Up to date") cuando no hay actividad — el footer queda vacío en reposo, igual que hoy, para no agregar ruido visual constante al kiosco.
- **Sí:** el progreso se transmite en tiempo real vía IPC push (`webContents.send` + listener en `preload.js`), en vez de que el renderer haga polling. Consistente con el patrón ya usado por `onStateUpdated` (SPEC 03) para otros cambios de estado empujados desde el proceso main.
- **No:** persistir el progreso o el historial de fallos en disco (`manifest.json` u otro archivo) — es un estado efímero de sesión, se pierde al reiniciar la app, consistente con que tampoco se persiste el estado del botón Go.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Si `queueRunning` queda en un estado inconsistente (ej. un escenario no contemplado donde `processQueue` termina abruptamente sin llegar al bloque que emite `idle`), el footer podría quedar mostrando `"Downloading X/Y"` indefinidamente aunque la cola ya no esté activa | El bucle de `processQueue` ya es un `while` simple con `try/catch` por descarga individual (SPEC 05); el emisor de progreso se ubica en los mismos puntos de entrada/salida ya probados, minimizando la chance de un estado colgado. Si ocurriera, el próximo escaneo (refresh de 1 min) recalcula `total`/`resolved` desde cero y corrige el indicador. |
| Refreshes muy frecuentes con pocas presentaciones pendientes podrían hacer parpadear el footer (aparece y desaparece cada minuto) en un evento con pocas presentaciones nuevas | Aceptado como comportamiento esperado: si hay algo para descargar, es información real y breve; no se agrega debounce/delay mínimo de aparición en esta spec. |
| Los dos íconos nuevos (spinner, advertencia) no fueron validados contra las 4 pantallas fuente del sistema de diseño, por lo que podrían no calzar perfectamente con el criterio visual original si en el futuro se agregan más capturas de referencia | Aceptado explícitamente por el usuario (Decisions); se construyen siguiendo el mismo lenguaje de trazo (`stroke`, `currentColor`) que los íconos ya existentes en `chrome.js` para minimizar el riesgo. |
| Múltiples pantallas montan su propio nodo `.screen-footer` al navegar; si `updateDownloadFooters()` no se llama de forma consistente tras cada `renderCurrent()`, un footer recién montado podría nacer vacío hasta el próximo evento de progreso (hasta 1 escaneo entero de desfasaje visual) | Mitigado en el plan (Paso 5): `updateDownloadFooters()` se invoca explícitamente después de cada cambio de pantalla, no solo al recibir el evento IPC. |
