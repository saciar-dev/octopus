# SPEC 17 — Transiciones y animaciones entre pantallas

> **Estado:** Implementado
> **Depende de:** SPEC 01 (mvp-visual-pantallas)
> **Fecha:** 2026-08-07
> **Objetivo:** Agregar un fade cruzado de 200ms entre pantallas (Splash/Schedule/Session/Speaker) en las transiciones de navegación (`show`, `goBack`, `reset` de `src/app.js`), reutilizando los tokens de motion ya definidos en el sistema de diseño, sin bloquear el foco por teclado ni la interactividad durante la animación.

## Scope

**Incluye:**

- Fade cruzado (crossfade real, ambas pantallas coexisten en el DOM durante la transición) de 200ms al navegar entre pantallas completas vía `show()`, `goBack()` y `reset()` en `src/app.js`.
- Duración `200ms` (token `--dur-normal`) y curva `--ease-standard`, ya definidos en `references/tokens/effects.css`.
- Nuevas clases CSS (`@keyframes`/transición) en `src/styles/app.css` para animar la entrada (fade-in) y salida (fade-out) de una pantalla.
- Manejo de interrupción: si se dispara una navegación nueva mientras una transición está en curso, se corta la transición vieja (se remueve del DOM el nodo saliente y se cancelan sus timers) y arranca la nueva de inmediato.
- El foco por teclado (`window.OctopusKeyboard.setFocusGroup`) se setea inmediatamente al montar la pantalla nueva en el DOM, sin esperar a que termine la animación — la transición es puramente visual y no bloquea la interactividad.
- `updateDownloadFooters()` sigue actualizando todos los `.screen-footer` presentes en el DOM (incluido el de la pantalla saliente mientras hace fade-out, si la hubiera).

**Fuera de scope (para futuras specs):**

- Animaciones de componentes internos de una pantalla (cambio de tabs en Session, apertura/cierre del overlay de config, etc.) — esta spec cubre únicamente la transición entre pantallas completas en `app.js`.
- Transiciones direccionales tipo slide (forward/back) — se descartó slide horizontal a favor de fade cruzado, que no requiere trackear dirección.
- Cualquier cambio a la lógica de navegación en sí (qué pantalla sigue a cuál, historial) — esta spec es puramente visual, no toca el árbol de navegación de SPEC 01.
- Animaciones específicas del splash (el pulso/beat ya existente en `src/styles/app.css`) — quedan como están, no se tocan.

## Data model

Este feature no introduce estructuras de datos persistentes ni cambia `state.js`. Agrega un estado interno efímero en `src/app.js`, en memoria, para poder cancelar una transición en curso:

```js
// src/app.js — estado interno de transición (no persiste, no se expone fuera del módulo)
let transitionToken = 0   // se incrementa en cada show()/goBack()/reset(); una transición
                           // vieja detecta que quedó obsoleta comparando su token capturado
                           // contra transitionToken y aborta su cleanup (remover nodo saliente)
```

Convenciones:

- `transitionToken` vive solo en el closure de `OctopusApp`, igual que `current`/`history` ya existentes — no se persiste ni se comparte con otros módulos.
- Las clases CSS nuevas (`screen-enter`, `screen-exit`, o nombres equivalentes) son solo de presentación, no estado de aplicación.

## Implementation plan

1. En `src/styles/app.css`, agregar las clases `.screen-enter` (fade-in) y `.screen-exit` (fade-out) junto a un `@keyframes` si hace falta, usando `transition: opacity var(--dur-normal) var(--ease-standard)` (o `animation` equivalente). Verificación manual: no hay cambio visible todavía (clases sin usar), `npm start` sigue funcionando igual.
2. En `src/app.js`, modificar `renderCurrent()` para que, en vez de `root.innerHTML = ''` seguido de `appendChild`, monte el nodo nuevo con la clase `screen-enter` sin remover el nodo viejo de inmediato: al nodo viejo (si existe) se le agrega `screen-exit` y se remueve del DOM tras `--dur-normal` (200ms) vía `setTimeout` o `transitionend`. Verificación manual: `npm start`, navegar Splash → Schedule, se ve un fade cruzado en vez de un corte instantáneo.
3. Agregar `transitionToken` (incrementado en cada llamada a `renderCurrent()`) y capturarlo en el closure del cleanup del nodo saliente; si al cumplirse el timeout el token capturado ya no coincide con `transitionToken` actual, el cleanup igual remueve su propio nodo (evita nodos zombie) pero no interfiere con una transición más nueva en curso. Verificación manual: tocar dos pantallas distintas rápido (doble tap) y confirmar que no quedan pantallas viejas superpuestas ni la navegación se traba.
4. Confirmar que `window.OctopusKeyboard.setFocusGroup([])` y el `setFocusGroup(...)` propio de cada pantalla (llamado dentro de cada `renderFn`) siguen ejecutándose de forma síncrona al montar el nodo nuevo, sin esperar el fin de la animación. Verificación manual: navegar con teclado (flechas + Enter) inmediatamente después de un `show()` y confirmar que el foco ya está activo en la pantalla nueva aunque el fade siga corriendo.
5. Confirmar que `updateDownloadFooters()` sigue actualizando correctamente los `.screen-footer` de ambas pantallas (saliente y entrante) mientras coexisten en el DOM durante la transición. Verificación manual: iniciar una descarga (SPEC 06) y navegar entre pantallas mientras está en curso, confirmar que el overlay de progreso no parpadea ni desaparece de forma incorrecta.
6. Verificación manual completa del flujo: `npm start`, recorrer Splash → Schedule → Session → Speaker → `goBack()` (Esc) hasta Splash, y `reset()` (SPEC 07) desde distintas pantallas — confirmar fade cruzado consistente de 200ms en los tres triggers, sin pantallazos vacíos ni saltos.

## Acceptance criteria

- [x] Navegar de una pantalla a otra vía `show()` (ej. Schedule → Session) produce un fade cruzado visible de ~200ms, sin corte instantáneo ni pantalla vacía intermedia.
- [x] `goBack()` (tecla Esc o botón back) produce el mismo fade cruzado de 200ms al volver a la pantalla anterior.
- [x] `reset()` (SPEC 07) produce el mismo fade cruzado de 200ms al volver a Splash.
- [x] Tocar/disparar una navegación nueva mientras una transición está en curso corta la transición vieja de inmediato y arranca la nueva, sin dejar nodos de pantallas viejas visibles ni acumulados en el DOM.
- [x] El foco por teclado (flechas/Enter/Esc, `src/keyboard.js`) funciona en la pantalla nueva inmediatamente después de `show()`/`goBack()`/`reset()`, sin esperar a que termine la animación.
- [x] El overlay de progreso de descargas (`.screen-footer`, SPEC 06) se sigue mostrando correctamente durante una transición si hay una descarga en curso.
- [x] La duración y curva de la animación usan los tokens `--dur-normal` y `--ease-standard` de `references/tokens/effects.css`, no valores hardcodeados nuevos.
- [x] Las animaciones existentes del splash (pulso/beat) siguen funcionando sin cambios.
- [x] No se rompe ninguna funcionalidad existente de SPEC 01–16 (navegación, fetch inicial, refresh, reset, descarga de presentaciones/imágenes, config).

## Decisions

- **Sí:** fade cruzado (crossfade real) en vez de fade-out→fade-in secuencial. Evita el pantallazo vacío intermedio; encaja con el tono utilitario/sin floritura del sistema de diseño.
- **No:** slide horizontal direccional (forward/back). Descartado por el usuario a favor de fade — evita tener que trackear dirección de navegación en `app.js`.
- **No:** fade + desplazamiento vertical sutil. Descartado a favor del fade puro, más simple y neutral.
- **Sí:** alcance limitado a transiciones entre pantallas completas (`show`/`goBack`/`reset` en `app.js`). Animaciones de componentes internos (tabs, overlays) quedan fuera, spec futura si hace falta.
- **Sí:** duración 200ms usando el token `--dur-normal` ya existente en `references/tokens/effects.css`, en vez de un valor nuevo — reutiliza el sistema de diseño en vez de inventar timing.
- **Sí:** ante interrupción (navegación nueva durante una transición en curso), cortar la vieja y arrancar la nueva de inmediato. Decisión explícita del usuario — prioriza responsividad en un kiosco táctil sobre completar animaciones a medias.
- **No:** bloquear inputs durante la transición (~200ms) hasta que termine. Descartado por el usuario por sentirse poco responsive.
- **Sí:** el foco por teclado se setea de inmediato al montar la pantalla nueva, sin esperar el fin del fade. Decisión explícita del usuario — la animación es puramente visual y no debe agregar latencia percibida a la navegación por teclado.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Depender solo de `transitionend` para remover el nodo saliente puede fallar si el evento no dispara (ej. `display:none` prematuro, tab en background) y dejar un nodo zombie en el DOM | Usar `setTimeout(--dur-normal)` como mecanismo principal de cleanup (no `transitionend`), consistente con lo ya decidido en el paso 2 del plan. |
| Con dos pantallas coexistiendo brevemente en el DOM, `document.querySelectorAll('.screen-footer')` en `updateDownloadFooters()` actualiza ambos footers (saliente y entrante) — si difieren visualmente durante el fade podría verse un parpadeo doble del overlay de descarga | Riesgo menor aceptado; se valida visualmente en el paso 5 del plan. Si el resultado no es aceptable, se puede ajustar en una spec futura (ej. no actualizar el footer del nodo saliente). |
| Navegación muy rápida y repetida (varios `show()` en menos de 200ms) podría, en teoría, disparar múltiples cleanups en cadena | Mitigado por `transitionToken`: cada cleanup remueve únicamente su propio nodo capturado, sin depender de cuál es "el actual" — no hay condición de carrera sobre qué nodo borrar. |

## Qué NO está en este spec

- Animaciones de componentes internos de una pantalla (tabs, overlay de config, etc.).
- Transiciones direccionales tipo slide (forward/back).
- Cambios a la lógica de navegación (historial, qué pantalla sigue a cuál).
- Cambios a las animaciones ya existentes del splash (pulso/beat).

Cada uno de estos, si se necesita, va en su propia spec.
