# SPEC 07 — Reset sin forzar navegación a Splash

> **Estado:** aprobado
> **Depende de:** SPEC 01 (mvp-visual-pantallas), SPEC 03 (datos-reales-api)
> **Fecha:** 2026-07-31
> **Objetivo:** El ícono de reset en Schedule y Session deja de forzar la navegación a Splash — sigue limpiando el historial y disparando el refresh de datos existente (`refreshCharlas`), pero el usuario permanece en la pantalla donde estaba, con Session actualizándose en vivo ante el nuevo estado y cayendo automáticamente a Schedule si la charla que se estaba viendo ya no existe.

## Scope

**Incluye:**

- Nueva función en `src/app.js` (ej. `refreshInPlace()`), separada de la `reset()` existente, que: limpia `history` (`history.length = 0`), dispara `window.octopusBridge.refreshCharlas()` (fire-and-forget, igual que hoy), y **no** modifica `current` ni llama a `renderCurrent()` — la pantalla visible no cambia.
- `src/screens/chrome.js`: el handler por defecto del ícono de reset (`resetBtn` en `renderFloatingActions`) pasa a llamar `window.OctopusApp.refreshInPlace()` en vez de `window.OctopusApp.reset()`, cuando no se pasa un `onReset` explícito.
- `src/screens/schedule.js`: sin cambios de comportamiento — ya está suscripta a `window.OctopusState.subscribe` (SPEC 03) y se re-renderiza sola con el nuevo `state.data` cuando llega el refresh.
- `src/screens/session.js`: se agrega suscripción a `window.OctopusState.subscribe` (mismo patrón que `schedule.js`: subscribe al entrar, unsubscribe al re-render). Ante un nuevo `state.data` con `status === 'ready'`, busca el `bloque` actual (`congress`, `fecha`, `bloque.id`) en el `sessionsByDate` nuevo:
  - Si lo encuentra, actualiza `charlas` en pantalla (misma tabla, filas nuevas) sin perder el scroll/foco de forma abrupta.
  - Si ya no existe (bloque eliminado, o cambió el `codigoEvento`/sala vía otra vía), navega automáticamente a `window.OctopusApp.show('schedule')` — no a Splash.
- El ícono de reset sigue existiendo únicamente en Schedule y Session (no se agrega a Speaker ni Config — hoy están ocultos con `showReset: false` y esta spec no cambia eso).
- `reset()` (la función existente en `app.js`) **no se toca** — sigue limpiando historial, navegando a Splash y refrescando datos. La sigue usando exclusivamente `saveSettings` en `config.js`.

**Fuera de scope (para specs futuras):**

- Cualquier cambio en `speaker.js` (no tiene ícono de reset hoy; no se le agrega suscripción a `OctopusState` en esta spec).
- Cambiar el comportamiento de `saveSettings` en Config — sigue navegando a Splash tras guardar, sin cambios.
- Agregar el ícono de reset a Speaker o Config (pantallas donde hoy está oculto).
- Preservar scroll/estado de foco exacto en Session al refrescar en vivo la tabla — alcanza con que la tabla se actualice correctamente, sin animaciones ni preservación fina de posición.
- Cualquier indicador visual nuevo de "se actualizó la data" en Session/Schedule — el refresh es silencioso, igual que el refresh periódico de 1 min ya existente (SPEC 03).

## Data model

Esta spec no introduce ninguna estructura de datos nueva ni cambios en `config.json`/`manifest.json`/el `state` normalizado. Solo reorganiza funciones ya existentes en memoria (`history`, `current` en `app.js`).

## Implementation plan

1. En `src/app.js`, agregar `refreshInPlace()`: `history.length = 0; window.octopusBridge.refreshCharlas()`, sin tocar `current` ni llamar a `renderCurrent()`. Exportarla en el `return` del módulo (`{ register, show, goBack, reset, refreshInPlace }`). Verificación manual: desde DevTools del renderer, con la app parada en Schedule, `window.OctopusApp.refreshInPlace()` y confirmar que la pantalla no cambia y que en logs del main process se ve el refresh (`refreshCharlas`) disparándose.
2. En `src/screens/chrome.js`, cambiar el handler por defecto del botón de reset: `if (onReset) onReset(); else window.OctopusApp.refreshInPlace()` (antes llamaba a `reset()`). Verificación manual: click en el ícono de reset en Schedule, confirmar que la pantalla no salta a Splash y que se dispara el refresh (visible en logs/Network).
3. En `src/screens/session.js`, replicar el patrón de suscripción de `schedule.js`: variable de módulo `unsubscribeFromPrevious`, al inicio de `render()` desuscribir la anterior si existe, y al final suscribirse con `window.OctopusState.subscribe((state) => { if (state.status === 'ready') applyData(state.data) })`. Extraer la lógica de armado de tabla actual a una función `applyData(data)` que: busca `data.sessionsByDate[fecha]`, dentro de ese array busca el bloque por `bloque.id`; si lo encuentra, re-renderiza `tableWrap` con `renderTable(bloqueEncontrado.charlas)` y re-cablea los listeners de fila (mismo patrón que `selectDate` en `schedule.js`); si no lo encuentra, llama `window.OctopusApp.show('schedule')` y no sigue actualizando esta instancia. Verificación manual: con la app en Session, en DevTools simular `window.OctopusState.subscribe` disparando un `state.data` de prueba con una charla modificada en el mismo bloque, confirmar que la tabla se actualiza sin navegar.
4. Verificación end-to-end del fallback: con datos reales, entrar a Session, y mientras se está parado ahí, forzar que el bloque deje de existir en el próximo fetch (ej. editar temporalmente la config del congreso/sala para que la API devuelva otro cronograma, o remover el bloque de los datos de prueba si se usa mock), disparar `refreshInPlace()` (ícono de reset) y confirmar que la app cae automáticamente a Schedule, no a Splash.
5. Verificación end-to-end general: con `npm start`, probar el ícono de reset en Schedule (queda en Schedule, tabla se actualiza) y en Session (queda en Session si el bloque sigue existiendo, tabla se actualiza en vivo), confirmar que `saveSettings` en Config sigue navegando a Splash sin cambios, y que el indicador de descargas (SPEC 06) sigue funcionando igual tras el refresh sin navegación.

## Acceptance criteria

- [ ] Al hacer click en el ícono de reset en Schedule, el historial de navegación se limpia, se dispara `refreshCharlas` (mismo comportamiento de datos que hoy), y la pantalla permanece en Schedule (no navega a Splash).
- [ ] Al hacer click en el ícono de reset en Session, el historial se limpia, se dispara `refreshCharlas`, y la pantalla permanece en Session si el bloque que se estaba viendo sigue existiendo en los datos nuevos.
- [ ] En Session, si tras el refresh llega un nuevo `state.data` mientras el usuario sigue parado ahí (por el reset o por el refresh periódico de 1 min ya existente), la tabla de charlas se actualiza en vivo con los datos nuevos, sin que el usuario tenga que navegar manualmente.
- [ ] Si tras un reset (o cualquier refresh) el bloque actualmente visto en Session ya no existe en los datos nuevos, la app navega automáticamente a Schedule (no a Splash, no se queda mostrando datos fantasma).
- [ ] El ícono de reset sigue sin aparecer en Speaker ni en Config (sin cambios respecto a hoy).
- [ ] `saveSettings` en Config mantiene su comportamiento actual sin cambios: al guardar exitosamente, navega a Splash.
- [ ] El botón "Go" (SPEC 05) y el indicador de descargas en el footer (SPEC 06) siguen funcionando igual, sin verse afectados por este cambio.
- [ ] No se rompe ninguna funcionalidad existente de SPEC 01-06 (navegación, botón back, botón Go, refresh periódico, config, indicador de descargas) salvo el cambio explícitamente documentado en esta spec.

## Decisions

- **Sí:** el cambio de comportamiento aplica únicamente al ícono de reset (`floating-reset`), vía una función nueva (`refreshInPlace()`), separada de `reset()`. `reset()` no se modifica y sigue siendo usada por `saveSettings` en Config, que mantiene su navegación a Splash — decisión explícita del usuario tras notar la contradicción inicial en el pedido (Fase 2).
- **No:** agregar el ícono de reset a Speaker o Config. El pedido original lo mencionaba en las 4 pantallas, pero el código actual solo lo muestra en Schedule y Session (`showReset: false` en las otras dos); se prioriza no expandir el alcance más allá del comportamiento pedido.
- **Sí:** Session pasa a suscribirse a `window.OctopusState.subscribe`, igual que Schedule, para reflejar el refresh en vivo sin necesitar renavegar. Sin esto, quedarse en Session tras el reset mostraría datos desactualizados hasta que el usuario navegara manualmente.
- **No:** agregar la misma suscripción a Speaker. No tiene ícono de reset hoy, así que no hay caso de uso directo para esta spec; decisión explícita del usuario para no expandir el alcance por las dudas.
- **Sí:** si el bloque visto en Session deja de existir tras un refresh, fallback automático a Schedule (no a Splash). Evita dejar al usuario viendo una pantalla con datos fantasma (charla/bloque eliminado, cambio de evento), sin ser tan disruptivo como reiniciar todo el flujo desde Splash.
- **No:** preservar scroll o foco exacto al actualizar la tabla de Session en vivo. Se prioriza simplicidad (re-render completo de la tabla, mismo patrón que `schedule.js`) sobre una transición más fina, consistente con el tono utilitario del kiosco.
- **No:** ningún indicador visual de "se actualizaron los datos" en Session/Schedule tras el refresh en vivo. Es un cambio silencioso, mismo criterio que el refresh periódico de 1 min ya existente (SPEC 03), que tampoco lo tiene.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Si `applyData` en `session.js` re-renderiza la tabla mientras el usuario tiene el foco puesto en una fila (navegación por teclado, `OctopusKeyboard`), el foco se pierde al reconstruir el DOM | Aceptado como comportamiento esperado (ver Decisions: no se preserva foco fino); el `setFocusGroup` se vuelve a llamar con los botones nuevos tras cada `applyData`, igual que hace `schedule.js` en `selectDate`, así que el teclado sigue funcionando aunque el foco puntual se resetee. |
| El fallback automático a Schedule podría sorprender al usuario si está parado en Session leyendo el cronograma de un bloque y, por una condición de carrera o dato transitorio de la API, el bloque no aparece momentáneamente en un refresh puntual (falso "no existe") | Riesgo bajo: el mismo patrón de comparación (`sessionsByDate[fecha]` + `bloque.id`) ya se usa hoy sin problemas en `schedule.js`/`speaker.js` sobre datos de la misma API; no se ha observado inconsistencia transitoria en los refreshes existentes (SPEC 03/05). |
| Si en el futuro se agrega el ícono de reset a Speaker (fuera de esta spec) sin agregarle también la suscripción a `OctopusState`, quedaría con el mismo problema que Session tenía antes de esta spec (refresca datos pero no actualiza la pantalla) | Documentado explícitamente en Decisions como fuera de scope; queda como nota para cuando se aborde esa expansión en una spec futura. |
