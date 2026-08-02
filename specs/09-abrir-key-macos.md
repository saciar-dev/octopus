# SPEC 09 — Abrir archivos .key (Keynote) en modo presentación desde macOS

> **Estado:** aprobado
> **Depende de:** SPEC 02 (boton-go-powerpoint), SPEC 05 (descarga-presentaciones)
> **Fecha:** 2026-08-01
> **Objetivo:** Al presionar "Go" en la pantalla Speaker con Octopus corriendo en macOS, cuando la presentación de la charla es un archivo `.key`, cerrar cualquier presentación de Keynote previamente abierta, abrir el nuevo archivo en Keynote e iniciar automáticamente el modo presentación (slideshow) vía AppleScript, replicando en Mac el mismo comportamiento de apertura directa en modo presentación que SPEC 02 ya implementa para PowerPoint en Windows.

## Scope

**Incluye:**

- Detección de plataforma en runtime en `main.js`: en Windows (`process.platform === 'win32'`) se mantiene sin cambios el flujo existente de SPEC 02/05 (`.ppt`/`.pptx` vía `POWERPNT.EXE`, resto vía `shell.openPath`). En macOS (`process.platform === 'darwin'`), si la extensión de la presentación es `.key`, se usa el nuevo mecanismo de esta spec; cualquier otra extensión en Mac sigue cayendo al fallback genérico `shell.openPath` (sin cambios, ya funciona así hoy).
- Nuevo módulo (ej. `src/main/keynoteOpener.js`) con:
  - `findKeynoteApp()`: chequea `fs.existsSync('/Applications/Keynote.app')`, análogo a `findPowerPointExecutable()` de SPEC 02.
  - `openInKeynote(localPath)`: ejecuta un script AppleScript vía `osascript` (con `execFile`, sin pasar por una shell) que primero cierra cualquier documento de Keynote actualmente abierto (si Keynote está corriendo), luego abre el archivo en `localPath` y arranca el slideshow (`start <documento>`).
- El handler IPC `open-presentation` en `main.js` pasa a resolver, según plataforma y extensión, cuál mecanismo de apertura usar (Windows+ppt/pptx → PowerPoint; Mac+key → Keynote; cualquier otro caso → `shell.openPath`), reutilizando la resolución de descarga/ruta local ya existente de SPEC 05 (sin cambios en esa parte — el pipeline de descarga es agnóstico a plataforma y extensión).
- Manejo de error visible en la pantalla Speaker (mismo patrón que SPEC 02/05): si Keynote no está instalado (`findKeynoteApp()` devuelve `null`) o el `osascript` falla (incluyendo permiso de Automatización denegado, código -1743, sin distinción especial de mensaje), se devuelve `{ success: false, error: <mensaje> }` y se muestra el error existente en la UI, sin romper la app.

**Fuera de scope (para specs futuras):**

- Apertura de `.ppt`/`.pptx` en macOS vía Keynote o PowerPoint Mac — en Mac, esas extensiones siguen cayendo al fallback genérico `shell.openPath` sin cambios.
- Cualquier conversión de formato (`.pptx` ↔ `.key`) — se asume que el archivo `.key` ya existe tal cual en el servidor de descargas (SPEC 05), sin transformación.
- Mensaje de error específico/guiado para cuando el permiso de Automatización de macOS está denegado (ej. instrucciones para habilitarlo en Preferencias del Sistema) — se usa el mismo mensaje de error genérico que cualquier otra falla de `osascript`.
- Empaquetado/firma/notarización de la app para distribución en Mac, y cualquier permiso de macOS (`NSAppleEventsUsageDescription` en `Info.plist` u otro) más allá de lo que Electron maneje por defecto en desarrollo.
- Detección o manejo de que Keynote ya esté abierto mostrando una presentación en curso activamente al momento del cierre (ej. sin guardar cambios) — se asume uso de kiosco donde los documentos de Keynote abiertos por Octopus no tienen ediciones pendientes del usuario.

## Data model

Este spec no introduce ninguna estructura de datos nueva. `presentacion.extension` ya existe en el modelo normalizado (SPEC 03/05) y es suficiente para detectar `.key`; no se agregan campos a `config.json`, al manifest de descargas, ni al `state`.

## Implementation plan

1. Crear `src/main/keynoteOpener.js` con `findKeynoteApp()`: devuelve `/Applications/Keynote.app` si `fs.existsSync` lo confirma, o `null` en caso contrario. Verificación manual: en una Mac con Keynote instalado, `require('./src/main/keynoteOpener').findKeynoteApp()` desde un script/log temporal devuelve la ruta; renombrando temporalmente la app (o probando en una VM sin Keynote) devuelve `null`.
2. En el mismo módulo, agregar `openInKeynote(localPath)`: arma un script AppleScript como string y lo ejecuta con `execFile('osascript', ['-e', script])` (nunca con `exec`/shell interpolando `localPath`, para evitar inyección de comandos). El script:
   ```applescript
   tell application "Keynote"
     if it is running then
       close every document
     end if
     activate
     set theDoc to open POSIX file "<localPath>"
     start theDoc
   end tell
   ```
   La ruta se pasa como argumento separado a `osascript` (vía un segundo `-e` que referencia una variable, o pasando el path como argument y usando `on run argv`) en vez de interpolarse directamente en el string del script, para no romper con rutas que contengan comillas u otros caracteres especiales. Devuelve una promise que rechaza si `osascript` sale con código de error (incluye stderr en el mensaje, sin parsear el código -1743 de forma especial). Verificación manual: con un `.key` de prueba, llamar `openInKeynote(ruta)` y confirmar que Keynote abre el archivo y arranca el slideshow automáticamente; repetir con otro archivo y confirmar que la ventana anterior se cierra antes de abrir la nueva.
3. En `main.js`, extraer la resolución de plataforma+extensión a una función (ej. `resolveOpenStrategy(extension)`) que devuelve `'powerpoint'` (Windows + `.ppt`/`.pptx` + `POWERPNT.EXE` encontrado), `'keynote'` (Mac + `.key` + Keynote encontrado), o `'shell'` (cualquier otro caso, incluyendo cuando la app específica de la plataforma no se encuentra). Reescribir el handler `open-presentation` para usar esta función en vez del `if (PRESENTATION_EXTENSIONS.includes(extension))` actual, manteniendo intacta la resolución de descarga/ruta local (SPEC 05) antes de decidir cómo abrir. Verificación manual: revisar que en Windows el comportamiento de SPEC 02/05 no cambió (mismos test manuales de esas specs); en Mac, con un `.key` y Keynote instalado, confirmar que se toma la rama `'keynote'`.
4. Cablear la rama `'keynote'` del handler para llamar `openInKeynote(localPath)`, devolviendo `{ success: true }` en éxito o `{ success: false, error: 'No se pudo abrir la presentación en Keynote: <detalle>' }` si falla (Keynote no encontrado, u `openInKeynote` rechaza). Verificación manual: en Mac, click en "Go" sobre una charla con `.key` válido abre Keynote en modo presentación; con Keynote desinstalado (o renombrado temporalmente), confirmar que aparece el error visible en Speaker sin romper la app.
5. Verificación end-to-end en una Mac real con Keynote instalado: `npm start`, entrar a Speaker con una charla que tenga un `.key` (descargado previa o on-demand, reutilizando el pipeline de SPEC 05 sin cambios), click en "Go" — confirmar apertura directa en modo presentación. Repetir el flujo una segunda vez con otra charla `.key` para confirmar que la ventana/documento anterior de Keynote se cierra antes de abrir el nuevo. Probar también el caso de error (Keynote no instalado, o denegar el permiso de Automatización en el diálogo nativo la primera vez) y confirmar que se muestra el mensaje de error sin crashear la app.

## Acceptance criteria

- [ ] Con Octopus corriendo en macOS y Keynote instalado, click en "Go" en Speaker sobre una charla cuya presentación tiene `extension === '.key'` abre Keynote directamente en modo presentación (slideshow), sin que el disertante tenga que iniciar el slideshow manualmente.
- [ ] Si ya había un documento de Keynote abierto por un "Go" anterior, al presionar "Go" de nuevo esa presentación previa se cierra antes de que se abra y arranque la nueva.
- [ ] Si Keynote no está instalado en el Mac (`/Applications/Keynote.app` no existe), click en "Go" sobre una charla `.key` muestra un mensaje de error visible en la pantalla Speaker, sin cerrar ni romper la app Octopus.
- [ ] Si `osascript` falla por cualquier motivo (incluyendo permiso de Automatización denegado por el usuario), click en "Go" muestra el mensaje de error genérico en Speaker, sin romper la app.
- [ ] El comando AppleScript recibe la ruta del archivo sin interpolarla directamente en el string del script (se pasa como argumento separado a `osascript`), evitando inyección de comandos si el nombre de archivo/ruta contuviera comillas u otros caracteres especiales.
- [ ] En Windows, el comportamiento de apertura de `.ppt`/`.pptx` (SPEC 02) y el pipeline de descarga (SPEC 05) no cambian respecto a hoy.
- [ ] En macOS, cualquier extensión que no sea `.key` (ej. `.pdf`, `.pptx` si llegara a darse) sigue abriéndose vía `shell.openPath` (fallback genérico), sin pasar por el mecanismo de Keynote.
- [ ] El pipeline de descarga/resolución de ruta local de SPEC 05 (manifest, descarga on-demand, carpetas por fecha/disertante) funciona igual en macOS que en Windows, sin cambios de esta spec.
- [ ] No se rompe ninguna funcionalidad existente de SPEC 01-08 (navegación, botón Go, indicador de descargas, reset, splash) salvo los cambios explícitamente documentados en esta spec.

## Decisions

- **Sí:** Keynote abre el `.key` directamente en modo presentación (slideshow autoarranca vía `start theDoc` en AppleScript), replicando el mismo criterio que SPEC 02 usa para PowerPoint (`/S`) — consistente con el flujo de kiosco sin intervención manual del disertante.
- **Sí:** detección de plataforma en runtime (`process.platform`) en la misma build/código, en vez de un deployment separado para Mac. Windows sigue usando el mecanismo de PowerPoint (SPEC 02/05) sin cambios; Mac agrega la rama de Keynote solo para `.key`.
- **No:** extender esta spec a `.ppt`/`.pptx` en macOS (vía Keynote o PowerPoint Mac). Se acota estrictamente a `.key`, que es lo pedido explícitamente por el usuario; cualquier otra extensión en Mac sigue con el fallback genérico `shell.openPath` que ya existe hoy.
- **Sí:** detección de Keynote instalado chequeando `/Applications/Keynote.app` con `fs.existsSync`, análogo a cómo SPEC 02 localiza `POWERPNT.EXE` probando rutas conocidas — simple y suficiente para un entorno de kiosco con instalación controlada.
- **No:** manejo especial del código de error -1743 (permiso de Automatización denegado) con un mensaje guiado. Se acepta el mensaje de error genérico de `osascript`; si en producción resulta confuso para el operador del kiosco, se puede refinar en una spec futura. El diálogo nativo de macOS pidiendo el permiso la primera vez no se intercepta ni se reemplaza — el usuario lo acepta como cualquier otro permiso del sistema.
- **Sí:** antes de abrir la nueva presentación, se cierran los documentos de Keynote actualmente abiertos (`close every document`). Evita acumulación de ventanas de Keynote tras usos repetidos del botón "Go" a lo largo de un evento — decisión explícita del usuario, distinta del criterio de SPEC 02 (que no cierra PowerPoint entre usos) porque en Mac es fácil automatizarlo desde el mismo script sin complejidad adicional.
- **No:** ninguna lógica para preservar cambios sin guardar en un documento de Keynote abierto antes de cerrarlo. Se asume que los documentos abiertos por Octopus en este flujo de kiosco no tienen ediciones pendientes del usuario (son archivos de solo apertura/presentación, descargados por SPEC 05).
- **Sí:** el pipeline de descarga y resolución de ruta local de SPEC 05 se reutiliza sin cambios — es agnóstico a plataforma y extensión, ya funciona igual para cualquier archivo descargado desde el FTP configurado.
- **No:** conversión de formato entre `.pptx` y `.key`. El usuario confirmó que el pedido es únicamente abrir archivos `.key` que ya existen tal cual en el servidor, no convertir entre formatos (lo que SPEC 05 había especulado como posible necesidad).
- **No:** empaquetado, firma o notarización de la app para Mac, ni configuración de `Info.plist` (`NSAppleEventsUsageDescription`) más allá de lo que Electron maneje en desarrollo. Queda fuera de esta spec, que se enfoca en el mecanismo de apertura en sí.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La primera vez que Octopus intenta automatizar Keynote vía `osascript`, macOS muestra un diálogo nativo de permiso de Automatización; si el operador del kiosco no está presente para aceptarlo (o lo deniega por error) en el momento exacto en que un disertante presiona "Go" por primera vez, esa apertura falla | Aceptado como riesgo operativo, no técnico (ver Decisions: no se intercepta el diálogo). Mitigación recomendada fuera del código: el operador del kiosco dispara manualmente un "Go" de prueba al arrancar el evento, antes de que lleguen los disertantes, para aceptar el permiso una única vez por instalación. |
| Sin firma/notarización de la app (fuera de scope), macOS Gatekeeper podría bloquear o advertir sobre la app Electron sin firmar al querer controlar Keynote vía Eventos de Apple, incluso después de aceptar el permiso de Automatización | Riesgo aceptado, heredado de no abordar empaquetado/firma en esta spec (ver Decisions). Si se observa en la Mac de destino, se resuelve en una spec futura de empaquetado/distribución para Mac. |
| `close every document` cierra **todos** los documentos de Keynote abiertos, no solo los que abrió Octopus — si el operador del kiosco tuviera Keynote abierto manualmente con otro archivo (fuera del flujo de Octopus) en el momento de un "Go", ese documento se cerraría también, con posible pérdida de cambios sin guardar | Riesgo aceptado: el entorno es un kiosco dedicado a Octopus (mismo supuesto que el resto del sistema), no se espera uso manual de Keynote en paralelo. Documentado para que el operador evite tener Keynote abierto manualmente durante el evento. |
| El script AppleScript asume una única ventana de aplicación Keynote; si Keynote quedara en un estado inesperado (ej. diálogo de recuperación de documento tras un crash previo) el `open`/`start` podría fallar o quedar bloqueado esperando interacción | Riesgo bajo, no específico de esta spec: mismo tipo de riesgo que ya existe con PowerPoint en Windows (SPEC 02) si quedara en un estado inconsistente. Se mitiga con el mensaje de error visible en Speaker (no bloquea la app), y el operador puede reiniciar Keynote manualmente si ocurre. |
| Cambios de versión de Keynote (ej. actualizaciones de macOS/Keynote) podrían modificar el comportamiento del diccionario AppleScript (`start`, `close every document`), rompiendo la automatización sin cambios en el código de Octopus | Riesgo aceptado, análogo al riesgo ya documentado en SPEC 02 sobre el flag `/S` entre versiones de Office. Se recomienda probar manualmente con la versión de Keynote instalada en la Mac de destino antes de dar por cerrada la spec. |
