# SPEC 08 — Rediseño visual de Splash

> **Estado:** implementado
> **Depende de:** SPEC 01 (mvp-visual-pantallas), SPEC 04 (configuracion-app, tema oscuro)
> **Fecha:** 2026-08-01
> **Objetivo:** Rediseñar visualmente la pantalla Splash con una banda superior en forma de onda, la mascota de Octopus (`logo-mark.png`) como ícono central junto a un wordmark tipográfico real, y un indicador de estado tipo "monitor de pulso" (línea plana/pulso) que reemplaza el texto plano actual de loading/error, sin cambiar la lógica de navegación ni el comportamiento funcional existente de la pantalla.

## Scope

**Incluye:**

- Rediseño visual de `src/screens/splash.js`: la banda superior lisa (`.splash-topbar`) pasa a ser una banda con forma de onda (curva SVG suave de un solo trazo descendente, sin calcar la imagen de referencia — "mismo espíritu").
- El `<img class="splash-logo" src="references/assets/logo_octopus.png">` actual (logo horizontal completo) se reemplaza por:
  - La mascota sola (`references/assets/logo-mark.png`), agrandada y centrada debajo de la banda.
  - El wordmark **"Octopus"** y el subtítulo **"Speaker Preview Manager"** (mayúsculas, tracking amplio) armados como texto HTML real con los tokens tipográficos existentes (`--font-display`/`--font-body`, Nunito Sans), no como parte de una imagen rasterizada.
- El bloque de estado actual (`.splash-loading`, texto plano "Cargando datos..." / "No se pudo conectar...") se reemplaza por un indicador tipo "monitor de pulso": un trazo SVG con línea plana + pulso, más una leyenda de texto debajo, con tres variantes visuales:
  - **Ready:** trazo con un pulso suave y sutil (animado, en loop lento) + texto "Ready to preview".
  - **Loading:** trazo dibujándose de forma continua (animación de progreso) + texto "Cargando datos...".
  - **Error:** trazo con una caída (en vez de pulso) + texto "No se pudo conectar. Reintentando...".
  - Este indicador reemplaza únicamente al `.splash-loading` actual — no cambia la lógica de `applyState()` en `splash.js` (los mismos tres estados de `window.OctopusState`), solo su representación visual.
- El botón de reset/gear (settings) y el botón play mantienen su posición relativa (gear arriba a la derecha sobre la banda, play abajo) y su comportamiento actual (`show('config')`, `show('schedule')` cuando no está `disabled`), solo se restylean visualmente (tamaño, sombra, color) para integrarse con el nuevo diseño.
- **Tema oscuro, acotado a Splash:**
  - Se agrega una regla específica en `src/styles/app.css` (no en `tokens.css`, no toca `--color-bg-page` global) que, bajo `:root[data-theme='dark']`, hace que el fondo del cuerpo de `.screen-splash` use `--neutral-900` en vez de heredar el `--color-bg-page` global (que sigue siendo `--navy-900` para el resto de pantallas).
  - La banda superior en onda **(revisado durante Fase 4)** pasa a `--neutral-700` en dark theme (gris más claro que el fondo `--neutral-900` de Splash), en vez de mantenerse navy como en la versión original de este punto.
  - El wordmark, el subtítulo y la leyenda de texto del indicador de pulso pasan a usar los tokens de texto claro ya definidos para dark theme (`--color-text-heading`, `--color-text-body`/`--color-text-muted` con sus valores en `:root[data-theme='dark']`).
  - La mascota (`logo-mark.png`) **(revisado durante Fase 4)** conserva su color navy original también en dark theme — se descartó el filtro CSS de inversión a blanco de la versión original de este punto.
- El indicador de pulso respeta `prefers-reduced-motion: reduce`: si está activo, el trazo se muestra estático (sin animación de dibujo/pulso continuo), aunque el resto del estado (texto, color) se sigue actualizando normalmente.
- El footer compartido (`.screen-footer`, indicador de descargas de SPEC 06) no cambia — sigue en su posición actual debajo del cuerpo, sin ajustes de este spec.

**Fuera de scope (para specs futuras):**

- Cambiar `--color-bg-page` (u otro token) globalmente para tema oscuro — el resto de pantallas (Schedule, Session, Speaker, Config) siguen con `navy-900` de fondo en dark, sin cambios.
- Generar un asset PNG blanco nuevo para la mascota — se resuelve con filtro CSS, no con un archivo nuevo en `references/assets/`.
- Cualquier cambio a la lógica de `applyState()`, a los tres estados de `window.OctopusState`, o a la navegación (`show('config')`, `show('schedule')`) — este spec es puramente de presentación.
- Rediseño de cualquier otra pantalla (Schedule, Session, Speaker, Config) o del footer compartido — acotado a Splash únicamente.
- Reproducir con fidelidad pixel-perfect la curva de onda de la imagen de referencia adjunta por el usuario — alcanza con una onda de espíritu similar.

## Data model

Este spec no introduce ninguna estructura de datos nueva ni cambios en `config.json`/`manifest.json`/el `state` normalizado. Es un cambio puramente visual sobre `splash.js` y `app.css`:

- Sigue consumiendo los mismos tres estados ya existentes de `window.OctopusState.getState()` / `subscribe()` (`ready`, `error`, cualquier otro estado no-ready tratado como loading), sin agregar campos nuevos.
- No se persiste ninguna preferencia nueva (el tema oscuro y `prefers-reduced-motion` ya se leen de fuentes existentes: `data-theme` en `:root` por SPEC 04, y la media query nativa del sistema operativo respectivamente).

## Implementation plan

1. En `src/screens/splash.js`, reemplazar el `innerHTML` del template: quitar `.splash-topbar` lisa y `<img class="splash-logo">`, agregar la banda en onda (`<div class="splash-wave">` con un `<svg>` inline de un solo `<path>` de curva descendente, `fill="var(--navy-700)"` o equivalente), la mascota (`<img class="splash-mascot" src="references/assets/logo-mark.png">`), el wordmark (`<h1 class="splash-word">Octopus</h1>`) y el subtítulo (`<p class="splash-sub">Speaker Preview Manager</p>`) como texto real. Verificación manual: `npm start`, confirmar que la banda, la mascota y el texto se ven en la posición esperada (aunque sin estilos finos todavía).
2. En el mismo archivo, reemplazar el bloque `.splash-loading` por el indicador de pulso: un contenedor (`.splash-pulse`) con un `<svg>` con `<path>` (trazo) más un `<span class="splash-pulse-label">` para el texto. Actualizar `applyState(state)` para que, en vez de tocar `loadingEl.hidden`/`textContent`, aplique una clase de estado al contenedor (`is-ready` / `is-loading` / `is-error`) que controla vía CSS qué variante del trazo y qué texto se muestra (el texto de cada estado puede vivir directamente en el JS, seteando `label.textContent` según el estado, igual que hoy). Verificación manual: en DevTools, forzar cada uno de los tres estados (ready/loading/error) manipulando el estado global o esperando los eventos reales, confirmar que el trazo y el texto cambian correctamente.
3. En `src/styles/app.css`, reemplazar los estilos existentes de `.splash-topbar`, `.splash-logo` por los nuevos: `.splash-wave` (altura, el `svg` a `width:100%;height:100%`), `.splash-mascot` (tamaño, `filter: drop-shadow(...)` sutil), `.splash-word`/`.splash-sub` (usando `--fs-display`/`--fs-h3`, `--fw-black`/`--fw-bold`, `letter-spacing` para el subtítulo), y `.splash-pulse`/`.splash-pulse-label` con las tres variantes de trazo (`is-ready` pulso suave vía `@keyframes`, `is-loading` trazo dibujándose vía `stroke-dasharray`/`stroke-dashoffset` animado, `is-error` trazo con caída estática). Envolver las animaciones en `@media (prefers-reduced-motion: no-preference)` para que por defecto (reduced motion activo) el trazo quede estático. Reestilar `.splash-gear`/`.splash-play` para integrarse al nuevo layout (tamaño, sombra, colores) sin cambiar su comportamiento. Verificación manual: inspección visual en `npm start`, comparar contra el mockup de dirección A elegido.
4. En `src/styles/app.css`, agregar la regla de tema oscuro acotada a Splash: `:root[data-theme='dark'] .screen-splash { background: var(--neutral-900); }`, más los ajustes de color de `.splash-word`/`.splash-sub`/`.splash-pulse-label` para heredar los tokens de texto claro ya definidos en `:root[data-theme='dark']`, y el filtro `:root[data-theme='dark'] .screen-splash .splash-mascot { filter: brightness(0) invert(1); }`. Verificación manual: desde Config, togglear tema oscuro (SPEC 04), volver a Splash y confirmar fondo `neutral-900`, mascota blanca, texto legible, banda superior sigue navy.
5. Verificación end-to-end: `npm start` con tema claro y oscuro, recorrer los tres estados (loading al arrancar, ready cuando conecta, error si se corta la conexión — ej. apagando el servidor de datos momentáneamente), confirmar que el gear navega a Config y el play a Schedule solo cuando no está `disabled`, confirmar que el footer de descargas (SPEC 06) se sigue viendo sin superponerse al nuevo diseño, y confirmar con las DevTools de accesibilidad (`prefers-reduced-motion: reduce` emulado) que el trazo queda estático.

## Acceptance criteria

- [x] La banda superior de Splash tiene forma de onda (curva SVG descendente), no una franja lisa como antes.
- [x] La mascota (`logo-mark.png`) se muestra centrada, agrandada, sin el resto del logo horizontal (`logo_octopus.png`) ya no se usa en esta pantalla.
- [x] El wordmark "Octopus" y el subtítulo "Speaker Preview Manager" se renderizan como texto HTML real (seleccionable, con la tipografía Nunito Sans del sistema), no como parte de una imagen.
- [x] El bloque de estado ya no muestra el texto plano anterior ("Cargando datos...", "No se pudo conectar...") sin tratamiento visual — en su lugar se ve el indicador de trazo tipo monitor de pulso, con una variante visual distinta para cada uno de los tres estados (ready, loading, error) y su texto correspondiente.
- [x] El estado `ready` muestra un pulso suave en loop; el estado `loading` muestra el trazo dibujándose de forma continua; el estado `error` muestra el trazo con una caída, sin animación de pulso ni de dibujo.
- [x] Con `prefers-reduced-motion: reduce` activo en el sistema, el trazo se muestra estático en los tres estados, sin perder el cambio de texto/color correspondiente a cada uno.
- [x] El botón gear sigue navegando a Config y el botón play sigue navegando a Schedule (solo si no está `disabled`), sin cambios de comportamiento respecto a hoy.
- [x] En tema claro, la pantalla se ve consistente con la dirección visual A acordada (banda navy, fondo claro, mascota/texto en navy).
- [x] En tema oscuro, el fondo del cuerpo de Splash usa `neutral-900` (no `navy-900`), la mascota conserva su color navy original (sin filtro), el wordmark/subtítulo/texto del indicador son legibles con los tokens de texto claro de dark theme, y la banda superior se ve en `neutral-700` (gris más claro que el fondo).
- [x] El fondo dark de las demás pantallas (Schedule, Session, Speaker, Config) no cambia — siguen usando `navy-900` como hoy, sin verse afectadas por el cambio de Splash.
- [x] El footer compartido con el indicador de descargas (SPEC 06) se sigue viendo correctamente en Splash, sin superposición ni corte visual con el nuevo diseño.
- [x] No se rompe ninguna funcionalidad existente de SPEC 01-07 (navegación, estados de conexión, indicador de descargas, reset) salvo los cambios visuales explícitamente documentados en esta spec.

## Decisions

- **Sí:** dirección visual **A · Marea** (banda en onda, mascota grande, wordmark tipográfico) elegida sobre las alternativas **B · Profundidad** (pantalla completa oscura) y **C · Panel clínico** (minimal, sin banda), tras exploración con `/frontend-design`. Es la más cercana a la imagen de referencia que aportó el usuario y la de menor riesgo por encajar directo con el sistema de diseño existente.
- **Sí:** se toma prestado el indicador de estado tipo "monitor de pulso" del mockup **C**, en vez del chip con ícono de **A**, para reemplazar el texto plano de loading/error — decisión explícita del usuario mezclando elementos de ambas direcciones.
- **Sí:** el wordmark y el subtítulo se escriben como texto HTML real (no como parte de una imagen rasterizada), para heredar la tipografía Nunito Sans del sistema y quedar editable/nítido en cualquier resolución, en vez de seguir usando `logo_octopus.png` completo.
- **No (revisado durante Fase 4):** la mascota **no** cambia de color en tema oscuro — se descartó el filtro CSS (`brightness(0) invert(1)`) durante la implementación; `logo-mark.png` conserva su color navy original también en dark theme.
- **Revisado durante Fase 4:** la banda en onda deja de ser navy en ambos temas — en tema oscuro pasa a `--neutral-700` (gris más claro que el fondo `--neutral-900` de Splash en dark), en vez de mantenerse navy como decía la versión original de esta sección.
- **Sí (revisado durante Fase 2):** el cambio de fondo dark (`neutral-900` en vez de `navy-900`) se acota únicamente a Splash mediante una regla local en `app.css`, sin tocar el token global `--color-bg-page`. El pedido original del usuario implicaba un cambio global que afectaría todas las pantallas ya implementadas (SPEC 01-07); se señaló el riesgo y el usuario confirmó acotarlo solo a Splash.
- **Sí:** la curva de la banda en onda es libre en su forma exacta ("mismo espíritu" que la imagen de referencia), no una reproducción pixel-perfect — decisión explícita del usuario para no sobre-especificar algo que se resuelve mejor con criterio visual al implementar.
- **Sí:** el indicador de pulso respeta `prefers-reduced-motion: reduce`, quedando estático cuando esa preferencia del sistema operativo está activa — buena práctica de accesibilidad aceptada por el usuario, de bajo costo de implementación en un kiosco.
- **No:** cambiar la lógica de `applyState()` / los estados de `window.OctopusState`, ni la navegación de gear/play — este spec es exclusivamente de presentación visual sobre una pantalla cuyo comportamiento funcional ya está resuelto (SPEC 01/03).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El filtro CSS `brightness(0) invert(1)` sobre `logo-mark.png` asume que el PNG es un color sólido (navy) sobre fondo transparente; si el asset tuviera antialiasing con tonos intermedios o sombras internas, el resultado en dark theme podría verse con bordes duros o artefactos | Riesgo bajo: el asset ya es un ícono plano de un solo color sobre transparencia (confirmado al inspeccionarlo en la exploración visual). Si al implementar se ven artefactos, hay margen para ajustar el filtro (ej. `grayscale(1) brightness(0) invert(1)`) sin cambiar de mecanismo. |
| La animación de "trazo dibujándose" del estado `loading` (`stroke-dasharray`/`stroke-dashoffset` en loop) podría verse entrecortada o con saltos si el SVG del path no tiene una longitud (`pathLength`) bien calibrada | Mitigación en el plan (Paso 3): usar `pathLength` fijo en el `<path>` en vez de depender de la longitud real calculada por el navegador, para que la animación sea predecible independientemente del path final elegido. |
| Al mover el wordmark de imagen rasterizada a texto real, el resultado tipográfico final depende de que la fuente Nunito Sans esté cargada a tiempo (mismo riesgo que ya existe hoy en el resto de la app vía `@font-face` en `tokens.css`) — un FOUT breve podría notarse más en Splash por ser la primera pantalla que ve el usuario | Riesgo aceptado, no es un riesgo nuevo introducido por este spec: la fuente ya se carga igual en toda la app (SPEC 01) vía `@font-face` local (`NunitoSans-Variable.woff2`), sin depender de red: el tiempo de carga es el mismo que hoy. |
| El nuevo layout (banda en onda + mascota agrandada + rail) ocupa más alto que el diseño anterior; en resoluciones de kiosco muy bajas (pantallas pequeñas verticales, si las hubiera) podría quedar apretado contra el footer | Riesgo bajo: la app está pensada para tablets/kioscos en horizontal (confirmado por el contexto de CLAUDE.md); no se contempla soporte de resoluciones verticales muy chicas en esta spec. Si aparece, se ajustan tamaños relativos (`vw`/`%`) en una iteración posterior. |
