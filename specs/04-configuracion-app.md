# SPEC 04 — Configuración de la app (conexión, tema y color de acento)

> **Estado:** aprobado
> **Depende de:** SPEC 03 (datos-reales-api)
> **Fecha:** 2026-07-30
> **Objetivo:** Agregar una pantalla de configuración protegida por contraseña, accesible desde Splash, que permita editar apiBaseUrl/codigoEvento/idSala (con selección de sala vía dropdown) y elegir tema claro/oscuro y color de acento, persistiendo todo en config.json y aplicando los cambios sin reiniciar la app.

## Scope

**Incluye:**

- Botón visible (ícono engranaje) en la pantalla Splash que abre la nueva pantalla `config`.
- Pantalla `config` registrada en `OctopusApp` (`src/screens/config.js`), navegable con `show('config')` y botón back estándar (vuelve a Splash sin guardar cambios no confirmados).
- Gate de contraseña: al entrar a `config`, se muestra primero un input de contraseña; solo tras validarla correctamente contra `settingsPassword` (config.json) se muestra el formulario de configuración. Contraseña incorrecta muestra mensaje de error y permite reintentos ilimitados.
- Formulario de conexión con 3 campos editables (`apiBaseUrl`, `codigoEvento` como texto; `idSala` resuelto vía dropdown) y botón explícito "Buscar salas" que dispara `GET {apiBaseUrl}/api/{codigoEvento}/salas` y puebla el dropdown con los nombres de sala devueltos.
- Selector de tema: dos opciones (Claro / Oscuro).
- Selector de color de acento: paleta cerrada de 5 swatches (Azul default, Verde, Naranja, Rojo, Violeta).
- Botón "Guardar": persiste `apiBaseUrl`, `codigoEvento`, `idSala`, `theme` y `accentColor` en `config.json` (vía IPC, `main.js` hace `fs.writeFileSync`), y dispara un refetch inmediato completo (congreso + salas + charlas) con los nuevos valores, navegando a Splash igual que "reset" — sin `app.relaunch()`.
- Definición de una paleta de tema oscuro en `src/styles/tokens.css` (tokens `--color-*` análogos a los claros, respetando navy/blue/tipografía/radios ya establecidos) y aplicación de tema/acento en runtime vía `data-theme`/`data-accent` en `<html>`, con bloques CSS en `tokens.css` que sobreescriben las custom properties correspondientes.
- Al arrancar la app, `main.js` lee `theme`/`accentColor`/`settingsPassword` de `config.json` (con defaults si no existen: `theme: "light"`, `accentColor: "blue"`) y los expone al renderer junto al resto del `state` para que `app.js`/`index.html` seteen los atributos `data-theme`/`data-accent` antes de renderizar Splash.
- Validación básica de `config.json` al guardar: los 3 campos de conexión no pueden estar vacíos; si `GET /salas` falla, se muestra error en el formulario sin perder los valores ya tipeados.

**Fuera de scope (para specs futuras):**

- Cambiar la contraseña desde la propia app (se edita manualmente en `config.json`, como el resto de la config hasta ahora).
- Selector de color libre (input type="color") — la paleta es cerrada a 5 swatches.
- Bloqueo temporal o límite de intentos tras contraseñas incorrectas repetidas.
- Persistencia de tema/acento fuera de `config.json` (ej. por-usuario, por-dispositivo con múltiples perfiles).
- Edición de `settingsPassword` vacía/deshabilitando el gate (si falta en `config.json`, se define comportamiento en Decisions, pero no se agrega una UI para "desactivar" la protección).
- Sincronización de tema/acento entre instancias/salas distintas — cada instalación de kiosco tiene su propio `config.json` local, sin backend central para esta configuración.

## Data model

**`config.json`** (se extiende, mismo archivo de SPEC 03):

```json
{
  "apiBaseUrl": "https://octopusmanager.space",
  "codigoEvento": "sadi-ic",
  "idSala": 45,
  "settingsPassword": "octopus2026",
  "theme": "light",
  "accentColor": "blue"
}
```

Convenciones:

- `settingsPassword`: string en texto plano. Si falta en `config.json` al leerlo, se usa un default fijo documentado en código (ver Decisions) en vez de fallar o deshabilitar el gate.
- `theme`: `"light" | "dark"`. Default `"light"` si falta la clave.
- `accentColor`: `"blue" | "green" | "orange" | "red" | "violet"`. Default `"blue"` si falta la clave o el valor no es uno de los 5 válidos.
- Estos 3 campos nuevos son independientes del bloque de conexión (`apiBaseUrl`/`codigoEvento`/`idSala`) ya existente; se guardan todos juntos en el mismo `Guardar` pero se leen/exponen como grupos separados en el `state`.

**Extensión del `state` en memoria (`main.js`/`appState.js`)**, agrega un bloque `settings` (no reemplaza nada de SPEC 03):

```js
const state = {
  // ...congress, dates, sessionsByDate (sin cambios, SPEC 03)
  settings: {
    apiBaseUrl: "https://octopusmanager.space",
    codigoEvento: "sadi-ic",
    idSala: 45,
    theme: "light",
    accentColor: "blue",
    // settingsPassword NO se expone al renderer vía state (se valida por IPC, ver plan)
  },
};
```

**Nuevos tokens de tema oscuro en `src/styles/tokens.css`** (se agregan junto a los existentes, no los reemplazan):

```css
:root[data-theme='dark'] {
  --color-bg-page: var(--navy-900);
  --color-bg-surface: var(--navy-800);
  --color-bg-sunken: var(--navy-700);
  --color-border: var(--navy-600);
  --color-border-strong: var(--navy-500);
  --color-text-heading: var(--neutral-white);
  --color-text-body: var(--neutral-100);
  --color-text-muted: var(--neutral-300);
  --color-text-on-brand: var(--neutral-white);
}
```

**Overrides de acento** (se aplican sobre `--color-accent`/`--color-accent-soft`/`--shadow-btn`, independientes del tema):

```css
:root[data-accent='green'] { --color-accent: var(--green-500); --color-accent-soft: #6bc796; }
:root[data-accent='orange'] { --color-accent: var(--color-accent-warm); --color-accent-soft: #dda57e; }
:root[data-accent='red'] { --color-accent: var(--red-500); --color-accent-soft: #ea8a78; }
:root[data-accent='violet'] { --color-accent: #7c4fd1; --color-accent-soft: #b39aec; }
```

(`data-accent="blue"` no necesita bloque propio: es el default ya definido en `:root`.)

Convenciones:

- `data-theme` y `data-accent` se setean en `<html>` (no en `#app`) antes del primer render, leyendo `state.settings` expuesto por `preload.js`.
- Los valores concretos de `--color-accent-soft` por swatch quedan a mi criterio de contraste durante la implementación (no bloquean el spec); pueden ajustarse en la fase de implementación si algún combo no pasa contraste mínimo con el texto sobre botones.

## Implementation plan

1. Extender `config.json` en la raíz con `settingsPassword`, `theme` e `accentColor` (valores default: password de ejemplo, `"light"`, `"blue"`). Verificación manual: `node -e "console.log(require('./config.json'))"` muestra las 6 claves.
2. En `src/main/appState.js`, al leer `config.json` (o al recibir el objeto `config` ya cargado por `main.js`), aplicar defaults para `theme`/`accentColor`/`settingsPassword` si faltan, y agregar un bloque `settings` (`apiBaseUrl`, `codigoEvento`, `idSala`, `theme`, `accentColor` — sin `settingsPassword`) al `state` en memoria que ya expone `congress`/`dates`/`sessionsByDate`. Verificación manual: log de `getState()` muestra `settings` con los 5 campos.
3. En `main.js`, agregar handlers IPC nuevos: `ipcMain.handle('verify-settings-password', (_e, password) => password === config.settingsPassword)`, `ipcMain.handle('fetch-salas', (_e, {apiBaseUrl, codigoEvento}) => apiClient.fetchSalas(...))` (reutilizando el cliente de SPEC 03 con valores no persistidos aún), y `ipcMain.handle('save-settings', (_e, newSettings) => {...})` que valida campos no vacíos, escribe el `config.json` actualizado (`fs.writeFileSync`), actualiza el `config` en memoria de `main.js`, y dispara el mismo flujo de `fetchInitialData(config)` usado al arrancar. Verificación manual: invocar cada handler desde DevTools del proceso main con datos de prueba.
4. En `preload.js`, exponer `verifySettingsPassword(password)`, `fetchSalas({apiBaseUrl, codigoEvento})` y `saveSettings(settings)` vía `contextBridge`. Verificación manual: las 3 funciones están disponibles en `window.octopusBridge` desde DevTools del renderer.
5. En `src/styles/tokens.css`, agregar el bloque `:root[data-theme='dark'] {...}` y los bloques `:root[data-accent='green'|'orange'|'red'|'violet'] {...}` definidos en el modelo de datos. Verificación manual: setear manualmente `data-theme="dark"` en el inspector del navegador sobre `<html>` y confirmar que los fondos/textos cambian sin romper contraste ni layout.
6. En `index.html`/`app.js`, antes del primer `renderCurrent()`, esperar `octopusBridge.getState()` y setear `document.documentElement.dataset.theme` / `.dataset.accent` según `state.settings.theme`/`.accentColor`; suscribir también a `onStateUpdated` para re-setear los atributos si `settings` cambia (tras Guardar). Verificación manual: cambiar `theme`/`accentColor` en `config.json` manualmente, reiniciar `npm start`, confirmar que la app arranca con esos valores aplicados.
7. En `src/screens/splash.js`, agregar el botón/ícono de engranaje (usando `IconButton` del sistema de diseño) que navega con `window.OctopusApp.show('config')`. Verificación manual: click en el ícono desde Splash navega a la nueva pantalla.
8. Crear `src/screens/config.js`, registrar `'config'` en `app.js`. Implementar el gate de contraseña: input + botón, llama a `verifySettingsPassword`; si es incorrecta muestra mensaje de error y permite reintentar; si es correcta, renderiza el formulario completo. Verificación manual: contraseña incorrecta muestra error y no avanza; contraseña correcta muestra el formulario.
9. En el formulario de `config.js`, implementar los campos `apiBaseUrl`/`codigoEvento` (precargados con los valores actuales de `state.settings`), el botón "Buscar salas" (llama a `fetchSalas`, puebla un `<select>` con los resultados o muestra error sin perder lo tipeado), el selector de tema (Claro/Oscuro) y los 5 swatches de color de acento, todos precargados con los valores actuales. Verificación manual: cambiar `codigoEvento` y click en "Buscar salas" puebla el dropdown con salas reales de ese evento; un `codigoEvento` inválido muestra error sin borrar el campo.
10. Implementar el botón "Guardar": valida que los 3 campos de conexión no estén vacíos y que se haya seleccionado una sala del dropdown; si es válido, llama a `saveSettings` con los 5 valores, y al resolver navega a Splash (`window.OctopusApp.show('splash')`, sin agregar a historial vía `reset()`-like) mostrando el mismo estado de carga de Splash mientras se re-hace el fetch inicial completo. Verificación manual: cambiar `idSala` a otra sala del mismo evento, Guardar, confirmar que Schedule muestra datos de la sala nueva sin reiniciar la app (`npm start` sigue siendo el mismo proceso).
11. Aplicar tema/acento en vivo inmediatamente al guardar (paso 6 ya cubre la reactividad vía `onStateUpdated`, dado que `settings` es parte del `state` push). Verificación manual: cambiar de Claro a Oscuro y Guardar, confirmar que toda la UI (Splash, header, botones) cambia de paleta sin recargar la ventana.

## Acceptance criteria

- [ ] `config.json` incluye `settingsPassword`, `theme` y `accentColor`, con defaults aplicados en `main.js` si alguna de las 3 claves falta.
- [ ] Splash muestra un ícono de engranaje que navega a la pantalla `config`.
- [ ] La pantalla `config` muestra primero un gate de contraseña; el formulario de configuración no es visible hasta ingresar la contraseña correcta.
- [ ] Contraseña incorrecta muestra un mensaje de error visible y permite reintentar sin límite de intentos.
- [ ] El formulario precarga los valores actuales de `apiBaseUrl`, `codigoEvento`, sala seleccionada, tema y color de acento.
- [ ] El botón "Buscar salas" consulta `GET /api/{codigoEvento}/salas` con los valores tipeados (no persistidos) y puebla el dropdown de salas con los resultados reales.
- [ ] Si "Buscar salas" falla (URL/código inválido), se muestra un error en el formulario y los valores tipeados no se pierden.
- [ ] El selector de tema ofrece Claro y Oscuro; el selector de acento ofrece 5 swatches (Azul, Verde, Naranja, Rojo, Violeta), con Azul como default cuando no hay valor guardado.
- [ ] Al presionar "Guardar" con datos válidos, `config.json` se reescribe con los nuevos valores de conexión, tema y acento.
- [ ] Tras Guardar, la app dispara un refetch inmediato completo (congreso + salas + charlas) con los nuevos valores de conexión, sin reiniciar el proceso Electron, y navega a Splash mostrando el estado de carga hasta tener datos.
- [ ] Tras Guardar, el tema y color de acento elegidos se aplican inmediatamente en toda la UI, sin recargar la ventana.
- [ ] Al reiniciar `npm start`, la app arranca ya con el tema y color de acento guardados en `config.json` (sin parpadeo visible al tema/acento anterior).
- [ ] Guardar con algún campo de conexión vacío o sin sala seleccionada muestra un error de validación y no escribe `config.json`.
- [ ] No se rompe ninguna funcionalidad existente de SPEC 01/02/03 (navegación, botón Go condicional, sufijo de rol, refresh periódico, botón reset) salvo los cambios explícitamente documentados en esta spec.

## Decisions

- **Sí:** botón visible (engranaje) en Splash protegido por contraseña, en vez de gesto oculto o atajo de teclado. Es visible y descubrible por el staff del congreso que administra el kiosco, sin depender de un teclado físico conectado; la contraseña cubre la protección contra disertantes/público.
- **Sí:** `config.json` es el único archivo de configuración persistente, extendido con `settingsPassword`/`theme`/`accentColor`. Evita introducir una segunda fuente de verdad de configuración (ya se usa así desde SPEC 03).
- **No:** archivo `settings.json` separado. Duplicaría el concepto de "configuración del kiosco" sin necesidad.
- **Sí:** refetch inmediato sin `app.relaunch()` al guardar. Mismo patrón ya usado por el botón "reset" de SPEC 03; evita cerrar/reabrir la ventana visible frente al usuario que está configurando el kiosco.
- **Sí:** dropdown de salas poblado desde `/salas` en vez de campo numérico manual para `idSala`. Elimina errores de tipeo y hace explícito qué sala real se está seleccionando (se ve el nombre, no un ID arbitrario).
- **Sí:** contraseña fija en `config.json` en texto plano, sin UI para cambiarla ni hash. Consistente con el nivel de protección ya existente para el resto de `config.json` (editable manualmente por quien instala el kiosco); no se apunta a un modelo de seguridad fuerte, solo a evitar que el público general entre a la config por error o curiosidad.
- **No:** hashing/salting de la contraseña ni almacenamiento seguro (keychain, etc.). Fuera de alcance para un secreto de bajo riesgo en un archivo local de instalación; se puede reconsiderar si en el futuro se maneja información más sensible.
- **Sí:** reintentos ilimitados en el gate de contraseña, sin bloqueo temporal. Es una pantalla de configuración de staff, no un sistema de autenticación de cara al público; agregar rate-limiting es complejidad no justificada por el riesgo real.
- **Sí:** paleta cerrada de 5 swatches de acento en vez de selector de color libre. Consistente con el sistema de diseño documentado en CLAUDE.md, que no prevé colores arbitrarios; evita combinaciones de bajo contraste sobre navy/blanco.
- **Sí:** tema/acento aplicados vía atributos `data-theme`/`data-accent` en `<html>` + overrides CSS en `tokens.css`, en vez de inyección de `<style>` generado en JS. Sin scripts inline, respeta la CSP estricta del renderer y mantiene toda la definición visual versionada en CSS como el resto del sistema de diseño.
- **Sí:** paleta de tema oscuro definida por mí durante la implementación, siguiendo los mismos tokens navy/blue/neutral ya usados en el tema claro, ante la ausencia de capturas fuente de un tema oscuro. Se prioriza consistencia con la identidad visual existente sobre esperar referencia adicional.
- **Sí:** pantalla `config` registrada como pantalla nueva en `OctopusApp` (no modal/overlay). Reutiliza el mismo patrón de navegación/back ya usado por las otras 4 pantallas, sin introducir un mecanismo de overlay nuevo fuera del sistema de diseño.
- **No:** cambiar la contraseña desde dentro de la app. Se edita manualmente en `config.json` igual que el resto de los campos de conexión; agregar UI para esto es una ampliación de alcance no pedida.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `settingsPassword` en texto plano en `config.json` es legible por cualquiera con acceso al filesystem del kiosco | Aceptado como riesgo de bajo impacto (Decisions): el objetivo es evitar acceso casual del público, no proteger contra un atacante con acceso al disco. |
| Guardar una configuración de conexión inválida (URL/código correctos en `/salas` pero rotos en `/charlas`) deja a la app sin datos tras el refetch | El refetch reutiliza el mismo mecanismo de error con reintento automático de SPEC 03 (Splash/Schedule muestran error si el fetch inicial nunca tuvo éxito), no se agrega manejo nuevo. |
| Cambiar `idSala` a una sala de un evento completamente distinto sin cambiar `codigoEvento` (o viceversa) puede combinar datos inconsistentes | El dropdown de salas siempre se puebla en conjunto con el `codigoEvento` tipeado en ese momento (vía "Buscar salas"), reduciendo la chance de combinar sala e evento no relacionados. |
| Los overrides de acento (`--color-accent-soft` por swatch) definidos ad-hoc en el modelo de datos podrían no pasar contraste mínimo sobre `--shadow-btn`/texto en botones | Ajuste de valores durante la implementación (ya contemplado en Decisions de Data model); no bloquea el spec. |
| Perder la contraseña (`settingsPassword` desconocida u olvidada) deja sin acceso a la config desde la UI | Sigue siendo editable manualmente en `config.json` desde el filesystem del kiosco, igual que hoy con el resto de los campos. |
