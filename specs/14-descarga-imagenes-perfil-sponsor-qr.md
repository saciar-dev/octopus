# SPEC 14 — Descarga de imágenes (foto, sponsor, QR) desde la API

> **Estado:** implementado
> **Depende de:** SPEC 03 (datos-reales-api), SPEC 05 (descarga-presentaciones)
> **Fecha:** 2026-08-03
> **Objetivo:** Descargar la foto del disertante, el logo del sponsor y el QR de "seguime" desde `apiBaseUrl` (rutas `/img/{codigoEvento}/profile/{imagen}`, `/profile/{imagen}/qr/{qr}` y `/sponsor/{imagenSponsor}`), guardarlas en `userData/imagenes/` espejando esa estructura, y mostrarlas en Speaker mediante un protocolo custom registrado en `main.js`, reemplazando los placeholders actuales (iniciales, texto, div vacío).

## Scope

**Incluye:**

- Módulo de descarga de imágenes (`src/main/imageDownloader.js` o similar) que, dado un nombre de archivo y su tipo (`profile`, `qr`, `sponsor`), arma la URL correspondiente contra `apiBaseUrl` y descarga el binario a `userData/imagenes/` espejando la estructura de la URL:
  - Foto: `{apiBaseUrl}/img/{codigoEvento}/profile/{imagen}` → `userData/imagenes/profile/{imagen}`
  - QR: `{apiBaseUrl}/img/{codigoEvento}/qr/{qr}` → `userData/imagenes/qr/{qr}` (ruta plana, no anidada bajo `profile/{imagen}` — ver nota de corrección en Data model)
  - Sponsor: `{apiBaseUrl}/img/{codigoEvento}/sponsor/{imagenSponsor}` → `userData/imagenes/sponsor/{imagenSponsor}`
- Sin manifest propio: la decisión de descargar o no se basa únicamente en `fs.existsSync()` sobre la ruta local espejada. Si el archivo ya existe, no se vuelve a descargar (ver Decisions sobre el riesgo aceptado de contenido desactualizado con el mismo nombre).
- Precarga en background: se reutiliza el mismo disparador que SPEC 05 (fetch inicial, refresh periódico de 1 min, reset manual, guardado de config) — tras cada uno, se recorren todas las charlas del `state` normalizado, se recolectan los nombres de archivo únicos de `photo`, `sponsor.logo` y `followMeQr` (descartando `null`), y se encolan para descarga secuencial (una por una, mismo patrón de cola que SPEC 05) las que todavía no existen localmente.
- Si una descarga individual falla (red, 404, etc.), se loguea el error y se continúa con la siguiente; no hay reintento inmediato ni fallback on-demand — el archivo sigue faltando hasta el próximo escaneo en background.
- Protocolo custom registrado en `main.js` (ej. `octopus-img://`) vía `protocol.registerFileProtocol` (o `protocol.handle`, según versión de Electron), que resuelve `octopus-img://profile/{imagen}`, `octopus-img://qr/{qr}` y `octopus-img://sponsor/{imagenSponsor}` a los archivos correspondientes dentro de `userData/imagenes/`, sin exponer el resto del filesystem.
- Actualización del CSP en `index.html` para permitir `img-src` desde el esquema custom.
- En `src/screens/speaker.js`: reemplazo de los tres placeholders actuales por `<img>` apuntando al esquema custom cuando el campo correspondiente no es `null`:
  - `speaker-photo` (hoy iniciales) → foto real si `speaker.photo !== null`.
  - `speaker-sponsor-badge` (hoy solo texto) → agrega el logo del sponsor si `speaker.sponsor.logo !== null` (se mantiene el nombre del sponsor como texto).
  - `speaker-followme-qr` (hoy div vacío) → imagen del QR si `speaker.followMeQr !== null`.
- Si el campo es `null`, o el archivo todavía no fue descargado (no completó el escaneo en background), se mantiene el placeholder actual — sin lógica de descarga on-demand ni estado de carga en Speaker.

**Fuera de scope:**

- Logo del congreso (`congress.logo`) — excluido explícitamente por el usuario; sigue usando el logo-mark genérico actual (`chrome.js`).
- Manifest de versionado (`actualizado`) para estas imágenes — a diferencia de `presentacion` (SPEC 05), no hay timestamp en la API para estos campos; solo se chequea existencia del archivo local por nombre.
- Detección de reemplazo de imagen con el mismo nombre de archivo en el servidor — riesgo aceptado, documentado en Decisions/Risks.
- Descarga on-demand desde Speaker si la imagen no llegó todavía por el escaneo en background.
- Límite de espacio en disco, limpieza de archivos huérfanos, o límite de concurrencia — mismo alcance que SPEC 05.
- Cache-busting (`?v=`) tipo SPEC 05 — no aplica porque no hay versionado de estas imágenes en esta spec.

## Data model

**Archivos descargados**, espejando la estructura de la URL de origen dentro de `userData/imagenes/`:

```
userData/imagenes/profile/{imagen}                  // foto del disertante
userData/imagenes/qr/{qr}                            // QR "seguime" (carpeta plana, no anidada bajo profile/{imagen})
userData/imagenes/sponsor/{imagenSponsor}            // logo del sponsor
```

> **Corrección durante implementación (Paso 3):** la redacción original de esta spec proponía `userData/imagenes/profile/{imagen}/qr/{qr}` para el QR, usando `{imagen}` como nombre de carpeta. Eso genera un conflicto real de filesystem: `profile/{imagen}` ya existe como **archivo** (la foto), por lo que no puede además ser **carpeta** (contenedora de `qr/{qr}`) cuando el mismo disertante tiene foto y QR — el caso normal de uso. Se corrigió a una carpeta plana `userData/imagenes/qr/{qr}`, análoga a `sponsor/`. Decisión del usuario.
>
> **Corrección adicional durante implementación (Paso 7, validación contra la API real):** la URL de descarga del QR (`{apiBaseUrl}/img/{codigoEvento}/profile/{imagen}/qr/{qr}`) también resultó incorrecta — probada contra la API real (`https://octopusmanager.space`), esa ruta devuelve **404** de forma consistente. La ruta que sí responde `200` es la plana: `{apiBaseUrl}/img/{codigoEvento}/qr/{qr}`, sin el prefijo `profile/{imagen}`. Se corrigió `buildDownloadUrl` para usar esta ruta. Como consecuencia, el QR deja de depender de `speaker.photo` en absoluto — ni para la URL de descarga, ni para la ruta local, ni para el esquema `octopus-img://` (ver más abajo) — y en `speaker.js` la imagen del QR se muestra siempre que `speaker.followMeQr !== null`, sin requerir que `speaker.photo` también sea no nulo. Decisión del usuario.

Convenciones:

- `{imagen}`, `{qr}`, `{imagenSponsor}` son los nombres de archivo tal cual vienen de la API (`speaker.photo`, `speaker.followMeQr`, `speaker.sponsor.logo` en el modelo normalizado de SPEC 03), sin sanear — se asume que la API ya entrega nombres válidos para el filesystem (a diferencia de `disertante` en SPEC 05, que sí se sanea por ser un nombre libre).
- `{qr}` es independiente de `{imagen}` (la foto): no hay relación de anidamiento entre ambos, ni en la URL de descarga ni en la ruta local ni en el protocolo custom (corregido durante la implementación, ver nota arriba).
- No hay manifest en disco: el chequeo de "ya descargado" es `fs.existsSync(rutaLocal)` directo, sin comparar versión/timestamp.
- No se introduce ningún campo nuevo en el modelo normalizado de `state` (SPEC 03) — `photo`, `sponsor.logo` y `followMeQr` ya existen como nombres de archivo; esta spec solo agrega la resolución a descarga + ruta local, expuesta al renderer vía el protocolo custom (no como una ruta de string en `state`).

**Estado en memoria (`main.js`/nuevo módulo), no persistido**, análogo a SPEC 05:

```js
let imageDownloadQueue = [] // array de { tipo: 'profile' | 'qr' | 'sponsor', imagen, qr? }
```

**Protocolo custom** (`main.js`):

```js
// octopus-img://profile/{imagen}              → userData/imagenes/profile/{imagen}
// octopus-img://qr/{qr}                        → userData/imagenes/qr/{qr}  (esquema plano, ver nota de corrección en Data model)
// octopus-img://sponsor/{imagenSponsor}        → userData/imagenes/sponsor/{imagenSponsor}
```

No agrega campos a `config.json` — usa `apiBaseUrl` y `codigoEvento` ya existentes (SPEC 03), no `ftpBaseUrl` (SPEC 05).

## Implementation plan

1. Crear `src/main/imageDownloader.js` con `downloadImage({ tipo, imagen, qr })`: arma la URL correspondiente (`profile`, `qr` o `sponsor`) usando `apiBaseUrl`/`codigoEvento` de `config.json`, hace `fetch`, y escribe el binario en la ruta local espejada (creando carpetas intermedias si no existen). Verificación manual: script/log temporal que llame la función con un nombre de archivo real de cada tipo y confirme que aparece en `userData/imagenes/`.
2. En el mismo módulo, agregar `isImageDownloaded({ tipo, imagen, qr })`: devuelve `true` si `fs.existsSync()` sobre la ruta local espejada da `true`, sin comparar versión. Verificación manual: con un archivo ya descargado, confirmar que devuelve `true`; borrarlo y confirmar que devuelve `false`.
3. Agregar `enqueueImageDownloads(charlas)`: recorre todas las charlas del `state` normalizado, recolecta los pares únicos `{ tipo, imagen, qr }` a partir de `speaker.photo`, `speaker.followMeQr` (independiente de `speaker.photo`) y `speaker.sponsor.logo` (descartando `null`), filtra los que `!isImageDownloaded(...)`, y los agrega a una cola procesada secuencialmente (mismo patrón de cola de SPEC 05: una descarga a la vez, errores individuales logueados con `console.error` sin detener la cola). Verificación manual: con charlas de prueba (algunas con imágenes ya descargadas, otras no), confirmar en logs que solo se descargan las faltantes, una por vez.
4. En `src/main/appState.js`, invocar `enqueueImageDownloads(state.sessionsByDate)` junto al `enqueueDownloads` existente de SPEC 05, en los mismos puntos: al final de `fetchInitialData`, `refreshCharlas` y el flujo de `save-settings` (fire-and-forget, sin bloquear). Verificación manual: `npm start` y confirmar en logs que arranca la cola de imágenes después del fetch inicial, junto a la de presentaciones.
5. En `main.js`, registrar el protocolo custom `octopus-img://` (`protocol.registerFileProtocol` o `protocol.handle` según la versión de Electron en uso) que resuelve `profile/{imagen}`, `qr/{qr}` y `sponsor/{imagenSponsor}` a la ruta absoluta dentro de `userData/imagenes/`, devolviendo 404/error si el archivo no existe. Verificación manual: con la app corriendo, pegar una URL `octopus-img://...` en DevTools y confirmar que la imagen carga (o falla limpio si no existe).
6. Actualizar el CSP de `index.html` (`img-src`) para permitir el esquema `octopus-img:` además de `'self'`. Verificación manual: confirmar en DevTools que no aparecen errores de CSP al cargar una imagen `octopus-img://`.
7. En `src/screens/speaker.js`, reemplazar los tres placeholders por `<img>` apuntando a `octopus-img://...` cuando el campo correspondiente no sea `null`, manteniendo el placeholder actual (iniciales/texto/div vacío) en el caso `null`: `speaker-photo`, `speaker-sponsor-badge` (agrega el logo, conserva el texto del nombre), `speaker-followme-qr`. Verificación manual: navegar a una charla con `photo`/`sponsor.logo`/`followMeQr` no nulos y confirmar que se ven las imágenes reales; navegar a una con esos campos `null` y confirmar que se mantienen los placeholders de siempre.

## Acceptance criteria

- [x] Al arrancar `npm start` con la API accesible, tras el fetch inicial se descargan en background y de forma secuencial la foto, el logo de sponsor y el QR de todas las charlas cuyos archivos no existan ya en `userData/imagenes/`.
- [x] Los archivos descargados quedan en `userData/imagenes/profile/{imagen}`, `userData/imagenes/qr/{qr}` y `userData/imagenes/sponsor/{imagenSponsor}`.
- [x] Si un archivo ya existe localmente (mismo nombre), no se vuelve a descargar en un nuevo escaneo.
- [x] Cada refresh periódico (1 min), el botón "reset" y el guardado de configuración disparan un nuevo escaneo de imágenes pendientes, igual que con las presentaciones (SPEC 05).
- [x] Si falla la descarga de una imagen durante el escaneo, el resto de la cola continúa sin interrupción, y esa imagen queda pendiente para el próximo escaneo.
- [x] En Speaker, cuando `speaker.photo` no es `null` y el archivo ya fue descargado, se muestra la foto real en vez de las iniciales.
- [x] En Speaker, cuando `speaker.sponsor.logo` no es `null` y el archivo ya fue descargado, se muestra el logo del sponsor junto al nombre (que se sigue mostrando como texto).
- [x] En Speaker, cuando `speaker.followMeQr` no es `null` y el archivo ya fue descargado, se muestra la imagen del QR.
- [x] En Speaker, si el campo correspondiente es `null`, o no es `null` pero el archivo todavía no fue descargado, se mantiene el placeholder actual (iniciales, texto sin logo, div vacío) sin errores visibles ni estado de carga.
- [x] El logo del congreso (`congress.logo`) sigue mostrando el logo-mark genérico actual, sin cambios.
- [x] Las imágenes cargan en el renderer vía el esquema `octopus-img://` sin violar el CSP de `index.html`.
- [x] No se rompe ninguna funcionalidad existente de SPEC 01–13 (navegación, botón Go, descarga de presentaciones, apertura de `.key`/PowerPoint, refresh, reset, config) salvo los cambios explícitamente documentados en esta spec.

## Decisions

- **Sí:** el scope de esta spec incluye foto del disertante, logo del sponsor y QR de "seguime". Decisión explícita del usuario.
- **No:** logo del congreso (`congress.logo`). Excluido explícitamente por el usuario; queda para una spec futura si hace falta.
- **Sí:** URLs de descarga: `{apiBaseUrl}/img/{codigoEvento}/profile/{imagen}` (foto), `{apiBaseUrl}/img/{codigoEvento}/qr/{qr}` (QR, ruta plana — corregida durante la implementación tras validar contra la API real que la variante anidada bajo `profile/{imagen}` da 404) y `{apiBaseUrl}/img/{codigoEvento}/sponsor/{imagenSponsor}` (sponsor). Usan `apiBaseUrl`, no `ftpBaseUrl` (SPEC 05) — no se agrega ningún campo nuevo a `config.json`.
- **Sí:** sin manifest de versionado — la detección de "hay que descargar" es solo `fs.existsSync()` por nombre de archivo, no comparación de `actualizado` como en SPEC 05. A diferencia de `presentacion`, los campos `imagen`/`imagenSponsor`/`qr` de la API no traen timestamp (ver SPEC 03), así que no hay forma de detectar un reemplazo con el mismo nombre; se acepta ese riesgo por simplicidad, priorizando lo más simple sobre la posible detección de cambios sin timestamp real (decisión explícita del usuario).
- **Sí:** almacenamiento local en carpetas planas por tipo (`userData/imagenes/profile/`, `userData/imagenes/qr/`, `userData/imagenes/sponsor/`), en vez de duplicar por `{fecha}/{disertante}` como SPEC 05. Foto/sponsor/QR son atributos del disertante/sponsor que se repiten entre charlas — un mismo archivo se descarga una sola vez sin importar en cuántas charlas aparezca. La ruta del QR se corrigió a carpeta plana durante la implementación (ver nota en Data model) porque anidarla bajo `profile/{imagen}/` colisiona con el archivo de la foto.
- **Sí:** mismo mecanismo de precarga en background que SPEC 05 (fetch inicial, refresh de 1 min, reset, guardado de config), reutilizando el patrón de cola secuencial ya existente, en vez de inventar un disparador nuevo.
- **No:** descarga on-demand desde Speaker si la imagen no llegó todavía. Se prioriza la simplicidad: sin estado de carga en Speaker, sin lógica de descarga en el flujo de navegación — la precarga en background ya cubre el caso normal, y el placeholder actual cubre el caso de falta temporal.
- **Sí:** protocolo custom (`octopus-img://`) registrado en `main.js` para servir las imágenes al renderer, en vez de `file://` + ajuste de CSP a `file:`. Decisión explícita del usuario: acota la exposición al filesystem local solo a la carpeta de imágenes de la app, en vez de habilitar acceso genérico a `file://` en el CSP.
- **No:** cache-busting (`?v=`) tipo SPEC 05. No aplica porque no hay campo de versión para estas imágenes en esta spec.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Sin manifest de versión, si el servidor reemplaza una foto/logo/QR manteniendo el mismo nombre de archivo, el kiosco sigue mostrando la versión vieja indefinidamente (el chequeo es solo `fs.existsSync()`) | Aceptado explícitamente por el usuario por simplicidad. Si se vuelve un problema real, una spec futura podría agregar un manifest de versión análogo al de SPEC 05 (requeriría que la API empiece a exponer un timestamp para estos campos). |
| Si `{qr}` tiene caracteres problemáticos para el filesystem (ya que no se sanea, ver Data model), la ruta local `qr/{qr}` podría fallar al crearse | Se asume que la API entrega nombres válidos para filesystem (mismo supuesto que SPEC 03/05 para estos campos); si aparece un caso real con caracteres inválidos, revisar si hace falta sanear como se hace con `disertante` en SPEC 05. |
| El protocolo custom `octopus-img://` mal configurado (path traversal, ej. `imagen` con `../`) podría exponer archivos fuera de `userData/imagenes/` | El handler del protocolo debe normalizar y validar que la ruta resuelta quede dentro de `userData/imagenes/` antes de servir el archivo, rechazando cualquier resolución que escape de esa carpeta. |
| Igual que en SPEC 05, la precarga secuencial de imágenes compite por el mismo ancho de banda que la cola de presentaciones, pudiendo demorar ambas colas si hay muchos archivos nuevos en el primer arranque | Aceptado, mismo riesgo ya documentado en SPEC 05; no hay UI de progreso ni priorización entre colas en esta spec. |
