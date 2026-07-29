# SPEC 03 — Datos reales desde API

> **Estado:** aprobado
> **Depende de:** SPEC 01 (mvp-visual-pantallas), SPEC 02 (boton-go-powerpoint)
> **Fecha:** 2026-07-29
> **Objetivo:** Reemplazar los datos mock de mockData.js por datos reales obtenidos de la API de octopusmanager.space (congreso, sala, fechas, charlas y disertantes), con refresh periódico y bajo demanda.

## Scope

**Incluye:**

- Archivo `config.json` en la raíz del proyecto con `apiBaseUrl`, `codigoEvento` e `idSala`, leído por `main.js` al arrancar. Editable manualmente por ahora (una UI para editarlo desde la app queda para una spec futura).
- Cliente de API en `main.js` (o módulo requerido por `main.js`) que consulta los 3 endpoints:
  - `GET {apiBaseUrl}/api/{codigoEvento}` → datos del congreso (código, nombre, logo).
  - `GET {apiBaseUrl}/api/{codigoEvento}/salas` → lista de salas; se usa para resolver el nombre de la sala configurada (`idSala`).
  - `GET {apiBaseUrl}/api/{codigoEvento}/charlas/{idSala}` → fechas, bloques y charlas (con disertante/moderador anidado) de la sala configurada.
- Fetch inicial de los 3 endpoints al arrancar la app, antes de mostrar Splash operativo (Splash muestra un estado de carga explícito mientras se espera la respuesta).
- Refresh periódico automático cada 1 minuto de `GET /charlas/{idSala}` únicamente (congreso y salas se piden una sola vez al arrancar).
- Refresh bajo demanda de `GET /charlas/{idSala}` disparado por el botón flotante "reset".
- Normalización de la respuesta de charlas a la forma de datos usada por las pantallas (aplanando bloques en una lista de sesiones por fecha, ignorando agrupamiento visual por bloque — eso queda para una spec futura de rediseño de tabla).
- Manejo de rol `MODERADOR`: se muestra el texto "(Moderador)" junto al nombre en Session y Speaker. `DISERTANTE` no lleva sufijo.
- Botón "Go" en Speaker oculto/deshabilitado cuando la charla no tiene `presentacion` (cambia el comportamiento por defecto de SPEC 02, que siempre lo mostraba).
- Manejo de error visible en Schedule (y en Splash, para el fetch inicial) cuando la API no responde: estado de error con reintento automático; si ya había datos cargados y un refresh falla, se mantienen los datos previos en pantalla sin mostrar error bloqueante.
- Comunicación main↔renderer vía IPC/`contextBridge` (`preload.js`) siguiendo el patrón de SPEC 02: `main.js` mantiene los datos en memoria, expone función(es) para leerlos y para forzar refresh, y notifica al renderer cuando hay datos nuevos (push desde `main.js`).
- Eliminación del uso de `src/data/mockData.js` como fuente de datos en las pantallas (el archivo puede quedar en el repo como referencia/fixture, pero deja de ser la fuente real).

**Fuera de scope (para specs futuras):**

- Descarga de archivos de presentación desde el FTP (campo `presentacion` se guarda como metadata — `id`, `nombreArchivo`, `extension`, `actualizado`, `esVirtual` — pero no se descarga ni se resuelve a una ruta local en esta spec). Eso es SPEC 04.
- Descarga o resolución de imágenes vía FTP (logo del congreso, foto del disertante, logo del sponsor, QR): se guardan los nombres de archivo tal cual vienen de la API, sin resolverlos a una URL o ruta local.
- Selección de sala en runtime: `idSala` es fijo por instalación vía `config.json`.
- UI para editar `config.json` desde la app.
- Agrupamiento visual de charlas por bloque en la tabla de Schedule (rediseño de tabla).
- Ícono de red social YouTube (el campo se ignora aunque venga en la respuesta).
- Indicador visual de "en vivo" (`enVivo`) en la UI (el dato se guarda en el modelo pero no se muestra).
- País del disertante en la UI (se elimina del render ya que la API no lo provee).
- Autenticación/API key (la API es abierta en la red del congreso).

## Data model

**`config.json`** (nuevo, raíz del proyecto):

```json
{
  "apiBaseUrl": "https://octopusmanager.space",
  "codigoEvento": "aaa-2026",
  "idSala": 54
}
```

**Respuestas crudas de la API** (formas ya confirmadas, no se modifican en el fetch):

```js
// GET {apiBaseUrl}/api/{codigoEvento}
{ "codigo": "aaa-2026", "nombre": "XVIII Congreso Internacional AAA 2026", "logo": "logo-aaa-2026.png" }

// GET {apiBaseUrl}/api/{codigoEvento}/salas
[{ "id": 54, "nombre": "PACÍFICO" }]

// GET {apiBaseUrl}/api/{codigoEvento}/charlas/{idSala}
{
  "54": {
    "2026-09-23": {
      "109": [
        {
          "id": 713,
          "hora_ini": "08:15:00",
          "hora_fin": "08:30:00",
          "bloque": { "id": 109, "nombre": "BLOQUE INICIAL 1", "simposio": false, "sponsorLogo": null },
          "titulo": "Charla bloque inicial 2",
          "disertante": "Dr. Felipe Ruíz",
          "rol": "DISERTANTE", // o "MODERADOR"
          "imagen": null,
          "bio": null,
          "facebook": "", "instagram": null, "twitter": null, "linkedIn": null, "youtube": null,
          "nombreSponsor": null,
          "imagenSponsor": null,
          "presentacion": { "id": 702, "nombreArchivo": "713.pdf", "actualizado": "2026-07-28T20:07:07+00:00", "esVirtual": false, "extension": ".pdf" }, // o [] si no hay presentación
          "qr": null,
          "enVivo": true
        }
      ]
    }
  }
}
```

**Modelo normalizado en memoria** (mantenido por `main.js`, reemplaza a `mockData.js` como fuente para el renderer):

```js
const state = {
  congress: {
    name: "XVIII Congreso Internacional AAA 2026",
    room: "PACÍFICO",          // resuelto desde /salas usando idSala de config.json
    logo: "logo-aaa-2026.png", // nombre de archivo tal cual viene de la API, sin resolver
  },

  dates: ["2026-09-23", /* ...resto de fechas, = Object.keys(charlas[idSala]) */],

  sessionsByDate: {
    "2026-09-23": [
      {
        id: 713,                          // = id de la charla
        enter: "08:15",                   // hora_ini truncada a HH:MM
        end: "08:30",                     // hora_fin truncada a HH:MM
        title: "Charla bloque inicial 2", // = titulo
        speaker: {
          name: "Dr. Felipe Ruíz",        // = disertante
          role: "DISERTANTE",             // "DISERTANTE" | "MODERADOR" — controla el sufijo "(Moderador)" en UI
          photo: null,                    // = imagen (nombre de archivo o null)
          sessionTitle: "Charla bloque inicial 2", // = titulo (mismo valor que title)
          bio: null,
          social: { facebook: "", instagram: null, linkedIn: null, twitter: null }, // youtube se descarta
          sponsor: null,                  // { name: nombreSponsor, logo: imagenSponsor } si ambos no-null, si no null
          followMeQr: null,               // = qr (nombre de archivo o null)
          presentacion: {                 // null si el array vino vacío []; si no, objeto normalizado
            id: 702,
            nombreArchivo: "713.pdf",
            extension: ".pdf",
            actualizado: "2026-07-28T20:07:07+00:00",
            esVirtual: false,
          },
          enVivo: true, // guardado, no usado en UI todavía
        },
      },
      // ...resto de charlas de esa fecha, aplanadas de todos los bloques, ordenadas por hora_ini
    ],
  },
};
```

Convenciones:

- `country` se elimina del modelo (la API no lo provee).
- `pptPath` (SPEC 02) se reemplaza por `presentacion` (objeto o `null`). El botón "Go" se muestra solo si `presentacion !== null`; la resolución de `presentacion` a un archivo local descargado es responsabilidad de SPEC 04.
- El campo `bloque` de la respuesta cruda no se guarda en el modelo normalizado (se usa solo transitoriamente para aplanar la lista); `simposio` y `sponsorLogo` del bloque se descartan en esta spec.
- `role` en el disertante controla únicamente el sufijo "(Moderador)" mostrado junto al nombre en Session y Speaker; no cambia ningún otro comportamiento salvo la visibilidad del botón Go (que depende de `presentacion`, no de `role`).
- El estado vive en memoria en el proceso principal (`main.js`), no se persiste a disco entre reinicios — cada arranque de la app vuelve a hacer el fetch inicial completo.

## Implementation plan

1. Crear `config.json` en la raíz del proyecto con `apiBaseUrl`, `codigoEvento` e `idSala` (valores reales de AAA 2026: `https://octopusmanager.space`, `aaa-2026`, `54`). Verificación manual: `node -e "require('./config.json')"` no tira error.
2. En `main.js`, crear un módulo cliente de API que implemente `fetchCongress()`, `fetchSalas()` y `fetchCharlas()`, cada uno haciendo `fetch` a su endpoint correspondiente usando los valores de `config.json`. Verificación manual: script/log temporal que llame a las 3 funciones contra la API real y loguee el JSON crudo recibido.
3. Implementar la función de normalización que transforma las 3 respuestas crudas en el modelo `state` (congress/dates/sessionsByDate) descrito en el modelo de datos: resolver `room` desde `salas` con `idSala`, aplanar bloques en lista de charlas por fecha ordenadas por `hora_ini`, truncar horas a `HH:MM`, mapear `presentacion` (array vacío → `null`), armar `sponsor` (null si ambos campos son null), y descartar `youtube`/`country`. Verificación manual: con datos de ejemplo fijos (fixture), la función devuelve la forma esperada — se puede probar con un script Node temporal o un test simple.
4. En `main.js`, al arrancar la app: ejecutar el fetch inicial de los 3 endpoints + normalización, guardando el resultado en `state` en memoria. Si el fetch inicial falla, guardar un estado de error y reintentar automáticamente (ej. cada 5 segundos hasta tener éxito). Verificación manual: arrancar con la API accesible carga `state` correctamente; simular caída de red (ej. apagar wifi o apuntar a URL inválida) muestra reintentos en consola y luego éxito al restaurar la conexión.
5. Implementar el timer de refresh periódico (cada 1 minuto) que vuelve a llamar `fetchCharlas()` + normalización, actualizando solo `dates`/`sessionsByDate` en `state` (no `congress`). Si el refresh falla, mantener el `state` anterior sin marcarlo como error. Verificación manual: dejar la app corriendo >1 minuto y confirmar (vía log) que se re-consulta el endpoint periódicamente.
6. En `preload.js`, exponer vía `contextBridge` las funciones que el renderer necesita: obtener el `state` actual (o su parte relevante), forzar un refresh bajo demanda, y suscribirse a un evento de "datos actualizados" push desde `main.js` (`webContents.send` en `main.js` + `ipcRenderer.on` en `preload.js`). Verificación manual: revisar en DevTools del renderer que las funciones/eventos estén disponibles.
7. Cablear el botón flotante "reset" (Schedule/Session) para que, además de navegar a Splash, dispare el refresh bajo demanda de charlas vía la función expuesta en el paso 6. Verificación manual: click en reset dispara una nueva consulta a `/charlas` (visible en logs/Network).
8. Reemplazar en `src/screens/splash.js`, `schedule.js`, `session.js` y `speaker.js` toda lectura de `src/data/mockData.js` por lectura del `state` expuesto vía `octopusBridge`. Splash muestra un estado de carga explícito mientras `state` no tiene datos todavía (fetch inicial en curso), y deshabilita/oculta Play hasta tenerlos. Verificación manual: `npm start` contra la API real muestra el estado de carga en Splash y luego navega con datos reales en las 4 pantallas.
9. Suscribir Schedule al evento de "datos actualizados" (paso 6) para re-renderizar la tabla automáticamente cuando el timer de 1 minuto o el reset traen datos nuevos, sin que el usuario tenga que re-navegar. Verificación manual: modificar datos en la API (o simular) y confirmar que Schedule se actualiza solo dentro del minuto, sin recargar la app.
10. En Session y Speaker, mostrar el sufijo "(Moderador)" junto al nombre cuando `speaker.role === "MODERADOR"`, y quitar toda referencia a `country` de la UI. Verificación manual: navegar a una charla con disertante y a una con moderador, confirmar el sufijo solo en la segunda; confirmar que no se muestra país en ninguna.
11. En Speaker, ocultar/deshabilitar el botón "Go" cuando `speaker.presentacion === null`. Verificación manual: navegar a una charla sin presentación confirma que Go no está visible/clickeable; una charla con presentación (aunque el archivo físico no exista localmente aún — eso es SPEC 04) mantiene Go visible y sigue mostrando el error de SPEC 02 si corresponde.
12. Implementar el estado de error visible en Schedule para el caso en que el fetch inicial nunca tuvo éxito (sin datos para mostrar): pantalla de error con reintento automático en curso. Verificación manual: apuntar `config.json` a una URL inválida y confirmar que Schedule (o Splash, según corresponda) muestra el error sin romper la app.

## Acceptance criteria

- [ ] `config.json` existe en la raíz del proyecto con `apiBaseUrl`, `codigoEvento` e `idSala`, y `main.js` lo lee al arrancar.
- [ ] Al arrancar `npm start` con la API accesible, la app consulta los 3 endpoints (congreso, salas, charlas) antes de habilitar la navegación normal desde Splash.
- [ ] Splash muestra un estado de carga explícito mientras el fetch inicial está en curso, y el botón Play queda deshabilitado/oculto hasta que haya datos.
- [ ] Schedule muestra el nombre del congreso y el nombre de la sala resueltos desde la API (no hardcodeados), y la tabla de sesiones se puebla con las charlas reales de la fecha seleccionada.
- [ ] Las charlas de todos los bloques de una fecha aparecen aplanadas como filas individuales en la tabla de Schedule, ordenadas por `hora_ini`, sin agrupamiento visual por bloque.
- [ ] En Session y Speaker, el nombre del disertante/moderador muestra el sufijo "(Moderador)" cuando `rol === "MODERADOR"`, y no lo muestra cuando `rol === "DISERTANTE"`.
- [ ] No se muestra país del disertante en ninguna pantalla.
- [ ] En Speaker, el botón "Go" no se muestra (o está deshabilitado) cuando la charla no tiene `presentacion` (array vacío en la API → `null` en el modelo).
- [ ] En Speaker, el botón "Go" se muestra cuando la charla tiene `presentacion`, y el flujo de apertura/error de SPEC 02 sigue funcionando igual que antes.
- [ ] Cada 1 minuto, la app vuelve a consultar `GET /charlas/{idSala}` en background y actualiza `dates`/`sessionsByDate` sin recargar la app ni perder la pantalla/navegación actual del usuario.
- [ ] Si el refresh periódico o el de reset falla (red caída, error del servidor), los datos previamente cargados se mantienen visibles y no se muestra un error bloqueante.
- [ ] El botón flotante "reset" en Schedule/Session dispara un refresh inmediato de `/charlas/{idSala}` además de navegar a Splash.
- [ ] Si el fetch inicial (al arrancar la app) falla y nunca hay datos cargados, se muestra un estado de error visible con reintento automático, sin romper la app.
- [ ] `src/data/mockData.js` deja de ser la fuente de datos usada por las pantallas (puede seguir existiendo en el repo como fixture/referencia).
- [ ] Toda la lógica de fetch a la API, timers de refresh y lectura de `config.json` vive en `main.js`, expuesta al renderer únicamente vía `preload.js`/`contextBridge`.
- [ ] No se rompe ninguna funcionalidad existente de SPEC 01/SPEC 02 (navegación entre pantallas, teclado, botones back, apertura de PowerPoint) salvo los cambios explícitamente documentados en esta spec (país eliminado, sufijo Moderador, Go condicional).

## Decisions

- **Sí:** fetch y timers de refresh viven en `main.js` (proceso principal), expuestos al renderer vía `preload.js`/`contextBridge`, notificando al renderer con eventos push cuando hay datos nuevos. Sigue el mismo patrón ya establecido en SPEC 02 para `open-presentation`, y evita problemas con la CSP estricta (`script-src 'self'`) del renderer.
- **No:** hacer el fetch directamente desde el renderer con `fetch()`. Rompería el patrón de aislamiento ya usado en el proyecto y expondría la red directamente al contexto del renderer sin necesidad.
- **Sí:** `config.json` en la raíz del proyecto, editable manualmente por ahora. Es la forma más simple de fijar `codigoEvento`/`idSala`/`apiBaseUrl` por instalación de kiosco sin tocar código; una UI de edición queda para una spec futura (ya identificada explícitamente por el usuario).
- **No:** variables de entorno para la config. `config.json` es más fácil de editar sin conocimientos técnicos para quien instala el kiosco en cada sala, y es más simple de extender a una UI de edición futura.
- **Sí:** solo se refresca `GET /charlas/{idSala}` en el timer de 1 minuto y en el reset; `congreso` y `salas` se piden una única vez al arrancar. Es donde cambian los datos relevantes durante el evento (nuevas presentaciones, cambios de horario); nombre de congreso/sala no cambian en caliente.
- **Sí:** refresh silencioso — si un refresh (timer o reset) falla, se mantienen los datos previos sin mostrar error bloqueante. Evita que una caída de red momentánea interrumpa a un disertante en medio del flujo del kiosco.
- **No:** error bloqueante en cada refresh fallido. Rompería la experiencia de kiosco por fallos de red transitorios que no afectan a los datos ya cargados.
- **Sí:** error visible con reintento automático únicamente cuando nunca hubo un fetch inicial exitoso (sin datos para mostrar). Es el único caso donde no hay nada útil que mostrar.
- **Sí:** se elimina `country` del modelo y de la UI. La API real no lo provee; mantenerlo como campo mock hubiera sido inconsistente con datos reales.
- **Sí:** `role` (DISERTANTE/MODERADOR) se refleja solo como sufijo textual "(Moderador)" junto al nombre, sin otro cambio de layout. Cumple el requisito con el mínimo cambio de UI posible.
- **Sí:** botón "Go" condicionado a la presencia de `presentacion`. Evita que el disertante llegue al flujo de error de SPEC 02 en el caso, ahora frecuente con datos reales, de charlas sin presentación cargada.
- **No:** agrupamiento visual por bloque en la tabla de Schedule en esta spec. Es un cambio de layout más grande (posible colapsado, estilos por simposio) que excede el alcance de "traer datos reales" y merece su propia spec de rediseño.
- **No:** ícono de YouTube ni indicador de "en vivo" en esta spec. Ambos son elementos de UI nuevos no contemplados en el sistema de diseño original (`resources/`), que documenta explícitamente no inventar componentes fuera de las 4 pantallas fuente.
- **No:** resolución de imágenes (logo, foto, sponsor, QR) a rutas locales vía FTP en esta spec. Se guardan como nombres de archivo crudos; la resolución completa (igual que las presentaciones) queda para specs futuras, manteniendo SPEC 04 acotada a presentaciones.
- **No:** persistencia del `state` normalizado a disco. Cada arranque de la app repite el fetch inicial completo; no hay necesidad de cache entre reinicios para un kiosco que corre continuamente.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La API cae o hay mala conectividad de red en el venue durante el congreso, justo cuando un disertante necesita navegar | Refresh silencioso (no bloqueante) sobre datos ya cargados; solo se muestra error si nunca hubo fetch inicial exitoso. Reintento automático en ese caso. |
| El endpoint `/charlas/{idSala}` anida la respuesta bajo el propio `idSala` como clave (`{"54": {...}}`), lo cual es redundante con el path pero podría cambiar de forma sin aviso | Acceder a los datos vía `response[String(idSala)]` de forma explícita y loguear/mostrar error claro si la clave no existe en la respuesta, en vez de asumir ciegamente la forma. |
| El campo `presentacion` es inconsistente en tipo entre "sin presentación" (`[]`, array vacío) y "con presentación" (objeto) | La normalización debe chequear explícitamente `Array.isArray(presentacion)` para mapear a `null`, en vez de asumir siempre objeto o siempre array. |
| El timer de refresh de 1 minuto podría solaparse si una request tarda más de 1 minuto en responder (ej. API lenta) | Usar un flag de "refresh en curso" para que el timer no dispare una nueva request si la anterior todavía no resolvió. |
| `config.json` mal formado o con `idSala`/`codigoEvento` incorrectos deja a la app sin poder traer datos desde el primer arranque | Validar al leer `config.json` que existan las 3 claves esperadas; si falta alguna, mostrar error claro en vez de fallar silenciosamente o crashear. |
| Cambios futuros en la API (nuevos campos, roles distintos a DISERTANTE/MODERADOR) rompen la normalización sin que se note en el kiosco | La normalización ignora campos desconocidos por diseño (no falla si aparecen campos nuevos); un `rol` no contemplado se trata igual que "DISERTANTE" (sin sufijo) en vez de romper el render, y se documenta como comportamiento a revisar si aparece en producción. |
