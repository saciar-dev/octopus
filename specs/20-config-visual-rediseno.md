# SPEC 20 — Rediseño visual de Configuración

> **Estado:** aprobado
> **Depende de:** SPEC 04 (configuracion-app), SPEC 18 (rediseno-speaker, precedente de proceso), SPEC 19 (retinte-colores-acento)
> **Fecha:** 2026-08-08
> **Objetivo:** Rediseñar visualmente la pantalla `config.js` (gate de contraseña, formulario de conexión y selectores de tema/acento) agrupando los campos en paneles del sistema de diseño y diferenciando jerárquicamente los botones "Buscar salas" (secundario) y "Guardar" (primario), sin cambiar ningún comportamiento funcional existente.

## Scope

**Incluye:**

- Restyle visual de `src/screens/config.js` y sus reglas asociadas en `src/styles/app.css` (bloque "Config screen", líneas 733–825 aprox.), manteniendo la misma estructura de flujo (gate de contraseña → formulario) y los mismos elementos funcionales (input de contraseña, campos de conexión, botón "Buscar salas", dropdown de salas, tabs de tema, swatches de acento, botón "Guardar").
- Gate de contraseña (`renderPasswordGate`): mejorar composición visual — centrado en la pantalla (hoy queda pegado arriba-izquierda dentro de `.config-body`), envuelto en un `Panel` del sistema de diseño, con más aire/jerarquía entre label, input y botón.
- Formulario (`renderForm`): agrupar los campos en dos `Panel` separados — uno para "Conexión" (`apiBaseUrl`, `codigoEvento`, botón "Buscar salas", dropdown de sala) y otro para "Apariencia" (tabs de tema, swatches de acento) — con encabezados de sección (`SectionLabel` o similar ya usado en otras pantallas) para cada panel.
- Nueva clase `.btn--outline` en `app.css`, portada desde la variante `outline` ya definida en `references/components/core/Button.jsx:24` (fondo transparente, borde y texto en `--color-accent`), aplicada al botón "Buscar salas" para diferenciarlo visualmente del botón "Guardar" (que se queda `btn--primary btn--lg`).
- Mejora visual de los swatches de acento (`.config-accent-swatch`): mayor tamaño y/o mejor indicación del estado seleccionado, manteniendo la paleta cerrada de 5 colores ya definida.
- Mejora visual de las tabs de tema (`.config-theme-tabs`) y de los inputs/`<select>` (`.config-input`) en línea con el resto del restyle (paddings, tamaños, consistente con los tokens ya usados en Speaker/Splash).
- Mensajes de error (`.config-gate-error`, `.config-form-error`) reforzados visualmente para que se destaquen más dentro de su panel, sin cambiar su lógica de aparición/desaparición.
- Reutilización exclusiva de tokens ya existentes en `src/styles/tokens.css` (colores, spacing, tipografía, radios, sombras) — sin valores nuevos hardcodeados, mismo criterio que specs 17/18/19.

**Fuera de scope (para specs futuras):**

- Cualquier cambio de comportamiento: verificación de contraseña (`verifySettingsPassword`), fetch de salas (`fetchSalas`), guardado (`saveSettings`), validaciones de campos vacíos, reintentos ilimitados del gate — solo restyle visual, comportamiento intacto.
- Cambiar la contraseña desde la app, o cualquier mecanismo de seguridad adicional (rate-limiting, hash) — ya descartado explícitamente en SPEC 04.
- Selector de color libre (input type="color") — la paleta sigue cerrada a 5 swatches.
- Animaciones/transiciones internas de la pantalla (entrada escalonada de paneles, hover/press custom más allá de lo que ya dan los componentes base) — anotado para spec futura, mismo criterio que SPEC 17/18 dejaron fuera de scope.
- Cambios a otras pantallas (Splash, Schedule, Session, Speaker) o al chrome compartido (`renderHeader`, `renderFooter`, `renderFloatingActions`) — acotado a `config.js` únicamente.
- Tema oscuro específico para Config más allá de que los tokens globales ya definidos en SPEC 04 sigan aplicándose correctamente — no se ajustan valores puntuales para dark en este spec.

## Data model

Este spec no introduce ni cambia ninguna estructura de datos. Es puramente visual sobre `config.js` y `app.css`:

- No se agregan campos a `config.json`, `state.settings` ni a los payloads de `verifySettingsPassword`/`fetchSalas`/`saveSettings`.
- La única adición "estructural" es de clases CSS/markup, no de datos: nueva clase `.btn--outline` en `app.css`, y wrappers `.panel`/`.panel-header` (o el nombre de clase que ya use el sistema de diseño para `Panel`, a confirmar en implementación si existe un precedente en otras pantallas) alrededor de los bloques del gate y del formulario en `config.js`.

## Implementation plan

1. En `src/styles/app.css`, agregar la clase `.btn--outline` (fondo transparente, `border: 1.5px solid var(--color-accent)`, `color: var(--color-accent)`), portada de la variante `outline` de `references/components/core/Button.jsx:24`. Verificación manual: en DevTools, aplicar la clase a cualquier botón de prueba y confirmar que se ve como botón secundario (sin fondo sólido).
2. En `src/styles/app.css`, agregar una clase `.panel` genérica (fondo `--color-bg-surface`, borde `--color-border-strong`, `border-radius: var(--radius-sm)` — ver `references/components/core/Panel.jsx`) reutilizable para agrupar el gate y las dos secciones del formulario. Verificación manual: aplicar `.panel` a un `<div>` de prueba en DevTools y confirmar fondo/borde/radio correctos en tema claro y oscuro.
3. En `src/screens/config.js`, envolver `renderPasswordGate` en `.panel`, centrar el gate dentro de `.config-body` (flex centrado vertical/horizontal), y mejorar el espaciado interno (label/input/botón/error). Verificación manual: `npm start`, entrar a Config, confirmar que el gate aparece centrado en la pantalla dentro de un panel con bordes visibles.
4. En `src/screens/config.js`, dividir `renderForm` en dos bloques envueltos en `.panel` separados: "Conexión" (`apiBaseUrl`, `codigoEvento`, botón "Buscar salas", dropdown de sala) y "Apariencia" (tabs de tema, swatches de acento), cada uno con un encabezado de sección visible (reutilizando el patrón `section-label` ya usado en el título "Settings" de la misma pantalla). Verificación manual: confirmar visualmente que ambos paneles se distinguen del fondo y entre sí, con sus campos agrupados correctamente.
5. En `src/screens/config.js`, cambiar la clase del botón "Buscar salas" de `btn btn--primary btn--lg` a `btn btn--outline` (manteniendo tamaño acorde, ej. sin `--lg` o con un tamaño intermedio a definir en implementación), dejando "Guardar" como `btn btn--primary btn--lg`. Verificación manual: confirmar que "Buscar salas" se ve claramente secundario respecto a "Guardar".
6. En `src/styles/app.css`, agrandar `.config-accent-swatch` (de 36px a un tamaño mayor, ej. 44–48px) y reforzar el indicador de selección (`.config-accent-swatch--selected`, hoy solo borde de 3px) con un tratamiento más visible (ej. anillo/offset), manteniendo los 5 colores ya definidos vía `ACCENT_SWATCH_COLORS`. Verificación manual: probar los 5 acentos, confirmar que el seleccionado se distingue claramente de los demás.
7. En `src/styles/app.css`, mejorar `.config-input`, `.config-theme-tabs` y `.config-field-label` (paddings, tamaños, espaciado entre campos) usando tokens ya existentes (`--sp-*`, `--fs-*`), consistente con el restyle de Speaker (SPEC 18). Verificación manual: comparar antes/después, confirmar que los campos se ven más espaciados y legibles sin desbordar el panel.
8. Reforzar visualmente `.config-gate-error` y `.config-form-error` (ej. fondo sutil o ícono, manteniendo `color: var(--color-danger)`) para que se destaquen más dentro de su panel. Verificación manual: forzar un error de contraseña incorrecta y un error de "Buscar salas" fallido, confirmar que ambos se notan claramente sin romper el layout del panel.
9. Verificación end-to-end con los 5 acentos y ambos temas (claro/oscuro): `npm start`, entrar a Config, probar contraseña incorrecta y correcta, cambiar `codigoEvento` y "Buscar salas" (éxito y error), cambiar tema/acento, "Guardar" con éxito y con validación fallida (campo vacío), confirmar que todo el flujo funciona igual que antes y se ve coherente con el restyle de Speaker/retinte de acentos (SPEC 18/19).

## Acceptance criteria

- [ ] El gate de contraseña se muestra centrado en la pantalla (no pegado arriba-izquierda), envuelto en un panel con fondo/borde propios (`.panel`).
- [ ] El formulario de configuración muestra dos paneles visualmente diferenciados: "Conexión" (URL/evento/botón buscar salas/dropdown de sala) y "Apariencia" (tema/acento), cada uno con encabezado de sección visible.
- [ ] El botón "Buscar salas" usa un estilo visualmente secundario (`.btn--outline`), distinto del botón "Guardar" (`btn--primary btn--lg`), de forma que "Guardar" se percibe como la acción principal.
- [ ] Los swatches de color de acento son más grandes que el tamaño actual (36px) y el swatch seleccionado se distingue claramente de los no seleccionados.
- [ ] Los inputs de texto, el dropdown de sala y las tabs de tema tienen paddings/espaciados consistentes con el resto del restyle (SPEC 18), sin desbordar los paneles que los contienen.
- [ ] Los mensajes de error del gate y del formulario (`.config-gate-error`, `.config-form-error`) se destacan visualmente más que hoy, sin romper el layout del panel que los contiene.
- [ ] `verifySettingsPassword`, `fetchSalas` y `saveSettings` siguen funcionando exactamente igual que antes: contraseña incorrecta muestra error y permite reintentar; "Buscar salas" puebla el dropdown o muestra error sin perder lo tipeado; "Guardar" persiste `config.json`, dispara refetch y navega a Splash.
- [ ] La validación de campos vacíos/sala no seleccionada al Guardar sigue mostrando el mismo error sin escribir `config.json`.
- [ ] La pantalla Config se ve correctamente en los 5 acentos (azul, verde, naranja, rojo, violeta) y en ambos temas (claro/oscuro), sin problemas de contraste.
- [ ] Todos los cambios de color/tipografía/espaciado usan tokens ya existentes en `src/styles/tokens.css` — no hay valores hardcodeados nuevos.
- [ ] No se rompe ninguna funcionalidad existente de SPEC 01–19 (navegación, gate de contraseña, fetch de datos, guardado de settings, retinte de acentos, tema oscuro).

## Decisions

- **Sí:** rediseño abarca las 3 partes de la pantalla (gate, formulario de conexión, selectores de tema/acento) en un mismo spec, en vez de dividirlo. Decisión explícita del usuario — es una sola pantalla y el objetivo es coherencia visual de punta a punta.
- **Sí:** campos agrupados en `Panel`s por sección ("Conexión" / "Apariencia"), en vez de mantener todo en una columna continua sin separación. Decisión explícita del usuario, y consistente con que `Panel` ya es un componente definido en el sistema de diseño (`references/components/core/Panel.jsx`) que hoy no se usa en ningún lado del código — este spec lo introduce por primera vez.
- **Sí:** diferenciar "Buscar salas" (secundario, `.btn--outline`) de "Guardar" (primario, `.btn--primary btn--lg`). Decisión explícita del usuario — hoy ambos comparten el mismo estilo y eso no comunica cuál es la acción principal del formulario.
- **Sí:** se porta la variante `outline` ya documentada en `Button.jsx` del sistema de diseño en vez de inventar un estilo de botón secundario nuevo. Mantiene consistencia con la referencia de componentes ya existente.
- **No:** cambios de comportamiento en ninguno de los tres flujos (verificación de contraseña, fetch de salas, guardado). Confirmado por el usuario — mismo criterio que specs 18/19, solo restyle visual.
- **No:** animaciones/transiciones internas de la pantalla (entrada escalonada de paneles, etc.). Se deja anotado para spec futura, mismo criterio que SPEC 17/18 ya aplicaron.
- **No:** selector de color libre ni cambios a la paleta cerrada de 5 acentos — ya decidido en SPEC 04, no se reabre acá.
- **No:** ajustes específicos de tema oscuro más allá de que los tokens globales ya definidos en SPEC 04 sigan aplicándose — no hay capturas fuente ni pedido puntual del usuario para un tratamiento dark específico de Config, a diferencia de Splash (SPEC 08).
- **Sí:** todos los valores nuevos (tamaños, espaciados, bordes) salen de tokens ya definidos en `tokens.css`, sin introducir constantes hardcodeadas nuevas — mismo criterio que SPEC 08/17/18/19.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Al introducir `.panel` como clase genérica reutilizable, podría entrar en conflicto de nombre con estilos existentes o futuros de otras pantallas | Se acota el nombre y su definición a lo necesario para Config en este spec; si otra pantalla necesita paneles en el futuro, se revisa consistencia en esa spec. |
| Centrar el gate de contraseña dentro de `.config-body` (hoy con `overflow-y: auto`) podría comportarse distinto en ventanas muy chicas o con contenido de error visible | Verificación manual en el paso 9 del plan incluye el caso de error visible; se ajusta el centrado (ej. `margin: auto` vs `justify-content: center`) si el layout se rompe con el mensaje de error. |
| Separar el formulario en dos paneles podría hacer que el contenido total exceda la altura visible sin scroll, especialmente en la resolución de kiosco objetivo | `.config-body` ya tiene `overflow-y: auto`; se verifica en el paso 9 que ambos paneles caben o scrollean correctamente sin cortar contenido. |
| El nuevo `.btn--outline` con `color: var(--color-accent)` podría no dar suficiente contraste sobre el fondo del panel en algún acento/tema | Verificación visual con los 5 acentos y ambos temas (paso 9 del plan); se ajusta el borde/color si algún combo falla contraste. |
