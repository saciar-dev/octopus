# SPEC 19 — Retinte de colores por acento (footer, headers, bordes)

> **Estado:** implementado
> **Depende de:** SPEC 04 (configuracion-app)
> **Fecha:** 2026-08-07
> **Objetivo:** Hacer que todo lo que hoy usa el navy fijo de marca (`--color-brand-primary`: línea del footer, títulos/headings, hover de links, ola decorativa del Splash) se retinte automáticamente a una variante oscura del color de acento elegido en Configuración, para que verde/naranja/rojo/violeta tengan la misma consistencia tonal que el azul tiene hoy con navy. También incluye retintar `--shadow-btn` (sombra de `.icon-btn` y botones equivalentes), hoy fijo en azul (`rgba(13, 110, 253, 0.35)`), para que la sombra de esos botones use el rgba del acento elegido en vez de quedar azul con cualquier otro acento.

## Scope

**Incluye:**

- Nuevo token `--color-brand-primary` por cada acento no-azul (verde, naranja, rojo, violeta) en `src/styles/tokens.css`, definido dentro de los bloques `:root[data-accent='...']` ya existentes (junto a `--color-accent`/`--color-accent-soft`), con un tono oscuro análogo a como `navy-700` se relaciona con `blue-500` hoy.
- `--color-text-heading` y `--color-link-hover` (hoy hardcodeados a `var(--navy-700)` en `tokens.css:48` y `:53`) pasan a referenciar `var(--color-brand-primary)`, para que headings y hover de links retinten junto con footer/bordes/títulos.
- `.splash-wave svg path` (hoy `fill: var(--navy-700)` fijo en `app.css:170`, la ola decorativa del Splash) pasa a usar `var(--color-brand-primary)`.
- Todo elemento que ya usa `var(--color-brand-primary)` en `app.css` (footer, títulos de sección/panel, bordes de foto del disertante, etc. — ~10 reglas) retinta automáticamente sin tocar `app.css`, porque solo cambia el valor del token según `data-accent`.
- Acento "Azul" (default, `data-accent` sin atributo o `="blue"`) sigue usando exactamente `--navy-700`/`--navy-900` como hoy, sin cambios.
- Los 4 tonos oscuros nuevos quedan a mi criterio de contraste durante la implementación (mismo criterio que `--color-accent-soft` en SPEC 04), verificando legibilidad de `--color-text-on-brand` sobre fondos que usan `--color-brand-primary`, y de `--color-brand-primary` como color de texto sobre los fondos existentes.
- Nuevo token `--shadow-btn` por cada acento no-azul (verde, naranja, rojo, violeta) en `src/styles/tokens.css`, definido dentro de los mismos bloques `:root[data-accent='...']`, usando el rgba equivalente al `--color-accent` de ese acento (mismo patrón que hoy usa `rgba(13, 110, 253, 0.35)`, que es `--blue-500` en rgba).
- Acento "Azul" sigue usando exactamente `--shadow-btn: 0 2px 6px rgba(13, 110, 253, 0.35)` como hoy, sin cambios.
- `.icon-btn` y el botón equivalente de `app.css:604` (ya usan `var(--shadow-btn)`) retintan automáticamente sin tocar `app.css`, porque solo cambia el valor del token según `data-accent`.

**Fuera de scope (para specs futuras):**

- Tema oscuro (`data-theme='dark'`): no se ajusta ningún token de acento ahí; dark theme sigue usando su paleta navy fija actual sin relación con el acento elegido.
- `--color-brand-primary-dark` (hoy `var(--navy-900)`, definido en `tokens.css:40` pero sin ningún uso actual en el código) — no se le agrega variante por acento porque no se usa en ningún lado; si en el futuro se usa, se revisita.
- Cambiar la paleta de `--color-accent`/`--color-accent-soft` ya definida en SPEC 04 — se mantiene igual, este spec solo agrega el token `--color-brand-primary` faltante por acento.
- Agregar colores de acento nuevos a la paleta cerrada de 5 swatches — sigue siendo azul/verde/naranja/rojo/violeta únicamente.
- Cambios a `config.js` o a la UI de selección de acento — el selector ya existe (SPEC 04) y no cambia; este spec solo agrega los tokens CSS que faltaban.

## Data model

Este spec no introduce estructuras de datos nuevas (no toca `config.json` ni `state`). Es una extensión del sistema de tokens CSS ya definido en SPEC 04.

**Extensión de `src/styles/tokens.css`** — se agrega `--color-brand-primary` a cada bloque `:root[data-accent='...']` ya existente:

```css
:root[data-accent='green']  { --color-accent: var(--green-500); --color-accent-soft: #6bc796; --color-brand-primary: /* verde oscuro, TBD en implementación */; --shadow-btn: 0 2px 6px rgba(46, 158, 91, 0.35); }
:root[data-accent='orange'] { --color-accent: var(--color-accent-warm); --color-accent-soft: #dda57e; --color-brand-primary: /* naranja oscuro, TBD */; --shadow-btn: 0 2px 6px rgba(200, 112, 62, 0.35); }
:root[data-accent='red']    { --color-accent: var(--red-500); --color-accent-soft: #ea8a78; --color-brand-primary: /* rojo oscuro, TBD */; --shadow-btn: 0 2px 6px rgba(224, 73, 47, 0.35); }
:root[data-accent='violet'] { --color-accent: #7c4fd1; --color-accent-soft: #b39aec; --color-brand-primary: /* violeta oscuro, TBD */; --shadow-btn: 0 2px 6px rgba(124, 79, 209, 0.35); }
```

Los valores rgba de `--shadow-btn` usan el mismo rgb que `--color-accent` de cada acento, con la misma opacidad (0.35) y offset/blur que el `--shadow-btn` azul actual.

(`data-accent="blue"` sigue sin bloque propio: `--color-brand-primary: var(--navy-700)` ya está definido en `:root` como default, sin cambios.)

**Cambios en `:root` de `tokens.css`** (bloque base, no en overrides de acento):

```css
--color-text-heading: var(--color-brand-primary); /* antes: var(--navy-700) */
--color-link-hover: var(--color-brand-primary);    /* antes: var(--navy-700) */
```

**Cambio en `src/styles/app.css:170`:**

```css
.splash-wave svg path {
  fill: var(--color-brand-primary); /* antes: var(--navy-700) */
}
```

Convenciones:

- Los 4 valores hex nuevos de `--color-brand-primary` por acento se eligen durante la implementación siguiendo el mismo criterio de contraste que `--color-accent-soft` (SPEC 04): deben mantener legibilidad de `--color-text-on-brand` (blanco) sobre fondos que usan `--color-brand-primary` (ej. `.screen-footer`, badges), y de `--color-brand-primary` como color de texto sobre `--color-bg-page`/`--color-bg-surface`.
- No se toca `--color-brand-primary-dark` (queda `var(--navy-900)` fijo, sin uso — fuera de scope).

## Implementation plan

1. En `src/styles/tokens.css`, definir los 4 tonos oscuros nuevos (verde, naranja, rojo, violeta) para `--color-brand-primary`, siguiendo el criterio de contraste descrito en Data model, y agregarlos a cada bloque `:root[data-accent='...']` existente (líneas 122–125), junto con `--shadow-btn` por acento usando el rgba de su `--color-accent` (ver Data model). Verificación manual: en DevTools, setear `data-accent="green"` en `<html>` y confirmar en el inspector que `--color-brand-primary` resuelve al nuevo verde oscuro y `--shadow-btn` al rgba verde.
2. En `src/styles/tokens.css`, cambiar `--color-text-heading` y `--color-link-hover` (líneas 48 y 53) de `var(--navy-700)` a `var(--color-brand-primary)`. Verificación manual: con `data-accent="blue"` (default) la app se ve idéntica a hoy (mismo navy); no debe haber ninguna diferencia visual en este paso para el acento azul.
3. En `src/styles/app.css:170`, cambiar `.splash-wave svg path { fill: var(--navy-700); }` a `fill: var(--color-brand-primary);`. Verificación manual: con acento azul, la ola del Splash se ve igual que hoy.
4. Verificación visual completa por cada uno de los 5 acentos: desde Configuración (SPEC 04), elegir cada color (azul, verde, naranja, rojo, violeta) y Guardar; recorrer Splash → Schedule → Session → Speaker → Config confirmando que footer, títulos/headings, hover de links, la ola del Splash y la sombra de `.icon-btn`/botones equivalentes cambian de tono junto con los botones de acento, y que el contraste de texto sigue siendo legible en todas las pantallas. Verificación manual: `npm start`, repetir el recorrido con los 5 acentos.
5. Confirmar que no se rompe nada de SPEC 01–18: navegación, fetch de datos, descarga de presentaciones/imágenes, gate de contraseña de config, transiciones de SPEC 17, y el rediseño de Speaker de SPEC 18 (que usa tokens de `--color-brand-primary` para bordes/texto). Verificación manual: recorrido funcional completo con acento no-azul activo (ej. verde) para confirmar que ninguna pantalla se rompe visualmente.

## Acceptance criteria

- [x] `tokens.css` define `--color-brand-primary` dentro de cada bloque `:root[data-accent='green'|'orange'|'red'|'violet']`, con un tono oscuro propio para cada uno.
- [x] Con `data-accent="blue"` (o sin atributo), `--color-brand-primary` sigue resolviendo a `var(--navy-700)`, sin ningún cambio visual respecto a hoy.
- [x] `--color-text-heading` y `--color-link-hover` referencian `var(--color-brand-primary)` en vez de `var(--navy-700)` directo.
- [x] `.splash-wave svg path` usa `var(--color-brand-primary)` en vez de `var(--navy-700)` directo.
- [x] Al elegir un acento distinto de azul en Configuración y Guardar, la línea del footer (`.screen-footer`), los headings/títulos de sección, el hover de links y la ola del Splash cambian todos al mismo tono oscuro del acento elegido (misma tónica que `--color-accent`/`--color-accent-soft`).
- [x] `tokens.css` define `--shadow-btn` dentro de cada bloque `:root[data-accent='green'|'orange'|'red'|'violet']`, con el rgba del `--color-accent` correspondiente. Con `data-accent="blue"` (o sin atributo), `--shadow-btn` sigue resolviendo a `0 2px 6px rgba(13, 110, 253, 0.35)` sin cambios.
- [x] Al elegir un acento distinto de azul, la sombra de `.icon-btn` y del botón equivalente de `app.css:604` cambia de azul al rgba del acento elegido.
- [x] Los 5 acentos (azul, verde, naranja, rojo, violeta) mantienen contraste legible de texto sobre `--color-brand-primary` y de `--color-brand-primary` como texto sobre los fondos existentes, en las 5 pantallas (Splash, Schedule, Session, Speaker, Config).
- [x] Tema oscuro (`data-theme='dark'`) no sufre ningún cambio de comportamiento por este spec.
- [x] No se rompe ninguna funcionalidad existente de SPEC 01–18 (navegación, fetch de datos, descargas, gate de contraseña, transiciones, rediseño de Speaker).

## Decisions

- **Sí:** retinte aplicado a todo lo que usa `--color-brand-primary` (footer, headings, hover de links, ola del Splash), no solo al footer. Decisión explícita del usuario — "todos los colores alrededor deben tener la misma tónica", el footer era solo el ejemplo dado.
- **Sí:** los 4 tonos oscuros nuevos (verde, naranja, rojo, violeta) se definen a criterio de implementación, priorizando contraste. Mismo patrón ya usado y aceptado en SPEC 04 para `--color-accent-soft`.
- **No:** cambios en tema oscuro (`data-theme='dark'`). El usuario confirmó que el acento no necesita retinte ahí — dark theme ya no usa navy para headings/texto (usa blancos/neutrales), no hay "línea navy" equivalente que retintar de la misma forma.
- **No:** el acento "Azul" no cambia — sigue usando exactamente los tokens navy actuales. Evita cualquier regresión visual para el acento default, que es el más usado.
- **No:** no se le agrega variante por acento a `--color-brand-primary-dark`. No tiene ningún uso actual en el código; agregar overrides para un token sin consumidores es trabajo no justificado (se puede revisitar si en el futuro se usa).
- **Sí:** `--color-text-heading` y `--color-link-hover` pasan de referenciar `var(--navy-700)` directo a `var(--color-brand-primary)`. Es el cambio técnico necesario para que headings/links retinten junto con el resto — sin esto, "todos los colores alrededor" quedaría incompleto pese a que ambos ya valen lo mismo que `--color-brand-primary` hoy.
- **Sí:** se amplía el scope (agregado durante la implementación, tras los pasos 1–3) para incluir `--shadow-btn`, hoy hardcodeado a `rgba(13, 110, 253, 0.35)` (azul) e independiente del acento. El usuario detectó visualmente que el botón de play seguía con sombra azul con otros acentos y pidió corregirlo en este mismo spec en vez de dejarlo para uno futuro. Se agrega `--shadow-btn` por acento usando el rgba de `--color-accent` de cada uno.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Los 4 tonos oscuros definidos ad-hoc (verde/naranja/rojo/violeta) podrían no pasar contraste mínimo como texto sobre `--color-bg-page`/`--color-bg-surface`, o como fondo con `--color-text-on-brand` encima | Ajuste de valores durante la implementación (ya contemplado en Decisions); no bloquea el spec. |
| Al reusar `--color-brand-primary` en `--color-text-heading`/`--color-link-hover`, algún combo de acento + tema podría verse menos legible que el navy actual, que fue el color originalmente pensado para esos usos | Verificación visual completa por acento (paso 4 del plan) antes de dar por cerrado el spec; si algún tono falla, se ajusta el hex antes de mergear. |
