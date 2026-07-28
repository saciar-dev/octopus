# CLAUDE.md

Este archivo brinda guía a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

## Qué es esto

Un scaffold de app Electron (`main.js` es actualmente un `console.log` de relleno) para **Octopus**, un "Speaker Preview Manager" tipo kiosco/tablet usado en congresos médicos. Los disertantes lo usan para previsualizar el cronograma de su sesión, el abstract, su biografía, el logo del sponsor y un código QR de "seguime" antes de salir al escenario. Todavía no se construyó código de aplicación más allá del esqueleto de Electron — la mayor parte de este repo es un paquete de recursos de sistema de diseño (`resources/`) pensado para guiar esa construcción.

## Comandos

- `npm start` — inicia la app Electron (ejecuta `electron .`)
- No hay suite de tests configurada (`npm test` es un stub que termina con error)
- No hay scripts de lint/build definidos en `package.json`

## Arquitectura

### El sistema de diseño como fuente de verdad

`resources/` es un paquete de sistema de diseño autocontenido (namespace `OctopusDesignSystem_492d91`, ver `resources/_ds_manifest.json`). Leer primero `resources/readme.md` — documenta el producto, los fundamentos visuales y las reglas de contenido derivadas directamente de seis capturas de pantalla fuente (no existía Figma ni código previo). Puntos clave que tienen prioridad sobre suposiciones genéricas:

- **Fuente de verdad para UI/flujos:** `resources/ui_kits/speaker-preview-manager/` (pantallas `.jsx` Splash → Schedule → Session → Speaker + `index.html`) es la referencia autoritativa navegable de cómo debe verse y comportarse la app real.
- **Tokens:** `resources/tokens/{colors,typography,spacing,effects}.css`, agregados en `resources/styles.css`. Azul marino de marca `--navy-700 (#214080)`, azul de acento `--blue-500 (#0d6efd)`, fuente Nunito Sans. Los paneles/tablas usan **radio de esquina cero**; solo los botones tienen forma de píldora/círculo. Sin sombras excepto en botones y elementos flotantes.
- **Componentes:** `resources/components/{core,navigation,data,social}/` — Button, IconButton, SectionLabel, Panel, Tabs, ScheduleTable, SocialIcons. Cada uno tiene un `.jsx`, un `.d.ts`, un `.prompt.md` (justificación de diseño) y un `.card.html` (preview aislado).
- **Reglas de contenido:** el texto de la interfaz (chrome) está en inglés; el contenido de sesión/disertante es en español y viene de datos (provisto por el congreso) — no "corregir" el mismatch de idioma entre chrome y contenido. Tono utilitario/kiosco, sin voz de marketing, sin emojis.
- **Assets:** `resources/assets/` tiene el logo real (`logo_octopus.png`, `logo-mark.png`) y los glifos sociales recortados — tratarlos como definitivos, no redibujar. `resources/uploads/` contiene las capturas de pantalla originales a partir de las cuales se hizo ingeniería inversa de todo el sistema.
- **No inventar componentes/patrones** más allá de los que aparecen en las cuatro pantallas fuente — el readme aclara explícitamente que el set de componentes está acotado solo a lo visible en la fuente, no es una librería de propósito general.

### Skill

`resources/SKILL.md` define un skill invocable (`octopus-design`) para generar interfaces/assets de Octopus on-brand, ya sea prototipos HTML descartables o código de producción, usando la guía de arriba.

### Construyendo la app real

Al implementar lógica real de la app Electron en `main.js` (y cualquier código de renderer), tratar `resources/ui_kits/speaker-preview-manager/*.jsx` como las pantallas a portar, y conectarlas con los tokens/componentes de `resources/` en vez de re-derivar los estilos desde cero.
