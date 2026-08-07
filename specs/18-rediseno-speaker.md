# SPEC 18 — Rediseño visual de Speaker

> **Estado:** aprobado
> **Depende de:** SPEC 01 (mvp-visual-pantallas), SPEC 08 (splash-redesign, precedente de proceso)
> **Fecha:** 2026-08-07
> **Objetivo:** Rediseñar visualmente `src/screens/speaker.js` para mejorar la jerarquía visual (nombre/bio vs. botón Go), dar más "aire" al layout, agrandar la foto/placeholder del disertante, rebalancear el bloque sponsor+QR y hacer más visible el botón Go, manteniendo el mismo layout de tres columnas (foto, texto principal, sidebar) y sin cambiar ningún comportamiento funcional existente.

## Scope

**Incluye:**

- Restyle visual de `src/screens/speaker.js` y sus reglas asociadas en `src/styles/app.css` (líneas 612–722 aprox., bloque "Speaker screen"), manteniendo el mismo layout de 3 columnas: foto circular a la izquierda, bloque principal (section-label + nombre + social + bio) al centro, sidebar (sponsor + QR) a la derecha.
- Foto/placeholder del disertante (`.speaker-photo`) agrandado respecto al tamaño actual (96px), con más presencia visual.
- Rebalanceo del sidebar (`.speaker-side`, `.speaker-sponsor-badge`, `.speaker-followme`, `.speaker-followme-qr`) para que el sponsor y el QR se vean equilibrados entre sí (tamaños/espaciados consistentes), no descompensados como hoy.
- Mejora de jerarquía visual: mayor diferenciación tipográfica/espaciado entre `.speaker-name` (lo más prominente después del section-label), `.speaker-bio` (secundario) y el resto, usando los tokens tipográficos ya existentes (`--fs-h3`, `--fs-body`, pesos de `--fw-*`).
- Más "aire": aumento de paddings/gaps en `.speaker-body` y entre bloques internos, usando los tokens de spacing existentes (`--sp-*`).
- Botón "Go" (`goBtn`, ya vive dentro de `renderFloatingActions` como `extra`) con tratamiento visual más prominente (tamaño, sombra/elevación, color) para que destaque más dentro del cluster de acciones flotantes, sin cambiar su posición (bottom-right, junto a back/reset) ni su comportamiento (`btn--primary btn--lg`, estados loading/disabled).
- Reutilización exclusiva de tokens ya existentes en `references/tokens/*.css` — sin colores, tamaños de fuente ni radios nuevos hardcodeados.

**Fuera de scope (para specs futuras):**

- Cualquier cambio de comportamiento del botón Go: lógica de `openPresentation`, mensaje/estilo de `.speaker-go-error` más allá de que siga siendo legible, estado de loading/disabled — solo restyle visual, comportamiento intacto.
- Reestructurar el layout general (cambiar de 3 columnas a otra disposición) — descartado explícitamente por el usuario a favor de un restyle sobre el layout actual.
- Tema oscuro: Speaker sigue usando los tokens globales de dark theme ya existentes (`navy-900`), sin ajustes específicos como los que SPEC 08 hizo para Splash.
- Animaciones/transiciones internas a la pantalla (entrada escalonada de foto/texto/sidebar, hover/press custom más allá de lo que ya definen los componentes base) — anotado para una spec futura, consistente con lo que SPEC 17 dejó fuera de scope para transiciones internas de pantalla.
- Cambios a otras pantallas (Splash, Schedule, Session, Config) o al chrome compartido (`renderHeader`, `renderFooter`, `renderFloatingActions` en sí) — acotado a Speaker únicamente.
- Cambios a `speaker.js` más allá de clases/estructura HTML necesaria para el restyle (no se toca `findCurrentPresentacion`, el fetch de estado, ni la lógica de `openPresentation`).

## Data model

Este spec no introduce ni cambia ninguna estructura de datos. Es puramente visual sobre `speaker.js` y `app.css`:

- Sigue consumiendo exactamente los mismos campos de `session.speaker` (`name`, `role`, `sessionTitle`, `social`, `bio`, `photo`, `sponsor`, `followMeQr`, `presentacion`) ya normalizados por specs previas (01/03/14).
- No se persiste ninguna preferencia nueva ni se agregan campos a `config.json`/`manifest.json`/`state.js`.

## Implementation plan

1. En `src/styles/app.css`, aumentar `.speaker-body` padding y gap (de `28px 32px` / gap `28px` a valores mayores usando tokens `--sp-*` existentes, ej. `--sp-8`/`--sp-6`) para dar más aire general al layout. Verificación manual: `npm start`, navegar a Speaker, confirmar más espacio entre foto/texto/sidebar sin que el contenido desborde.
2. Agrandar `.speaker-photo` (de 96px a un tamaño mayor, ej. 140–160px) ajustando proporcionalmente `border-width` y `font-size` del placeholder de iniciales para que se mantenga legible y centrado. Verificación manual: probar con foto real (`speaker.photo`) y con placeholder de iniciales (`speaker.photo === null`), confirmar que ambos casos se ven bien al nuevo tamaño.
3. Reforzar jerarquía tipográfica en `.speaker-main`: aumentar el peso/tamaño de `.speaker-name` respecto al resto (revisar si sube de `--fs-h3` a `--fs-h2`), aumentar el `margin-top` de `.speaker-bio` para separarlo más claramente del nombre/social, sin cambiar `max-width: 640px` (evita líneas demasiado largas). Verificación manual: comparar antes/después con una bio larga y una corta (datos reales o de prueba), confirmar que el nombre domina visualmente y la bio queda claramente secundaria.
4. Rebalancear `.speaker-side`: unificar el ancho de `.speaker-sponsor-badge` y `.speaker-followme-qr` (hoy 140px vs 120px) a una medida común, y ajustar `gap` entre sponsor y QR en `.speaker-side` para que ambos bloques se vean como un conjunto equilibrado en vez de descompensado. Verificación manual: probar los 3 casos reales — con sponsor y QR, solo sponsor, solo QR (ninguno de los dos es obligatorio, ver `speaker.js:89` y `:109`) — confirmar que el sidebar se ve balanceado en cada combinación.
5. Dar más presencia visual al botón "Go" dentro de `.floating-actions`: aumentar tamaño/padding respecto a `.btn--lg` actual (dentro de límites razonables del cluster flotante) y reforzar `box-shadow`/color usando tokens ya existentes (`--shadow-*`, `--color-accent`), sin mover su posición (sigue como `extra` en `renderFloatingActions`, junto a back/reset) ni tocar su lógica en `speaker.js`. Verificación manual: confirmar que el Go se distingue claramente de los íconos back/reset a su lado, en los tres estados (normal, `disabled`/"Abriendo...", con `.speaker-go-error` visible).
6. Verificación end-to-end: `npm start`, navegar Schedule → Session → Speaker con datos reales (varias combinaciones: bio larga/corta, con/sin sponsor, con/sin QR, con/sin foto), confirmar que el fade cruzado de SPEC 17 sigue funcionando sin cambios, que el botón Go abre la presentación correctamente (éxito y error), y que no se rompe ninguna funcionalidad de SPEC 01–17.

## Acceptance criteria

- [ ] `.speaker-body` tiene más padding/gap que la versión actual, sin que el contenido desborde ni se corte con datos reales.
- [ ] `.speaker-photo` (foto real o placeholder de iniciales) es visiblemente más grande que el tamaño actual (96px), y el placeholder de iniciales sigue centrado y legible al nuevo tamaño.
- [ ] `.speaker-name` domina visualmente sobre `.speaker-bio` y el resto del bloque principal (mayor jerarquía tipográfica que hoy).
- [ ] `.speaker-bio` queda claramente separado del nombre/social (más espacio), sin cambiar el `max-width` de 640px.
- [ ] El sidebar de sponsor + QR (`.speaker-side`) se ve balanceado en las tres combinaciones posibles: solo sponsor, solo QR, ambos.
- [ ] El botón "Go" se distingue claramente de los íconos back/reset dentro de `.floating-actions`, en sus tres estados (normal, cargando/disabled, con error visible).
- [ ] El botón "Go" mantiene su posición actual (cluster flotante bottom-right) y su comportamiento exacto: abre la presentación (`openPresentation`), respeta `MIN_LOADING_MS`, muestra `.speaker-go-error` en caso de fallo — sin ningún cambio de lógica.
- [ ] El fade cruzado de 200ms entre pantallas (SPEC 17) sigue funcionando sin cambios al entrar/salir de Speaker.
- [ ] Speaker sigue viéndose correctamente en tema oscuro con los tokens globales existentes (sin regresión, aunque no se ajustó específicamente).
- [ ] Todos los cambios de color/tipografía/espaciado usan tokens ya existentes en `references/tokens/*.css` — no hay valores hardcodeados nuevos.
- [ ] No se rompe ninguna funcionalidad existente de SPEC 01–17 (navegación, fetch de datos, descarga de presentaciones/imágenes, config, transiciones).

## Decisions

- **Sí:** restyle sobre el layout actual de 3 columnas (foto/texto/sidebar), no una reestructuración. Decisión explícita del usuario — menor riesgo, consistente con cómo SPEC 08 abordó el redesign de Splash sin tocar su lógica de estados.
- **Sí:** foco puntual en tres problemas identificados por el usuario — jerarquía visual pobre, falta de "aire"/espaciado, y botón Go poco visible — más los dos hallazgos adicionales (foto/placeholder chico, sponsor+QR desbalanceados). El plan de implementación aborda los cinco explícitamente.
- **No:** tema oscuro específico para Speaker (como sí se hizo para Splash en SPEC 08). El usuario confirmó que Speaker ya funciona bien en dark con los tokens globales existentes — fuera de scope.
- **No:** animaciones/transiciones internas a la pantalla (entrada escalonada, motion custom). El usuario pidió dejarlo anotado para una spec futura, no incluirlo acá — consistente con lo que SPEC 17 ya dejó fuera de scope para transiciones internas de componentes.
- **Sí:** el botón Go se refuerza visualmente sin cambiar de posición (se queda dentro de `renderFloatingActions` junto a back/reset) ni de lógica. Se descartó moverlo a otro lugar del layout por ser un cambio de comportamiento/interacción, no puramente visual, y el usuario confirmó "solo restyle" para Go.
- **Sí:** todos los valores nuevos (tamaños, espaciados, sombras) salen de tokens ya definidos en `references/tokens/*.css`, sin introducir constantes nuevas — mismo criterio que SPEC 08 y SPEC 17.
