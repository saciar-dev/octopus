# SPEC 15 — config.json accesible/modificable en la app distribuida

> **Estado:** implementado
> **Depende de:** SPEC 03 (datos-reales-api), SPEC 04 (configuracion-app), SPEC 10 (empaquetado-firma-macos)
> **Fecha:** 2026-08-06
> **Objetivo:** Mover la lectura/escritura de `config.json` de la carpeta de la app (`__dirname`, dentro del bundle empaquetado y de solo lectura) a `app.getPath('userData')`, copiando la plantilla versionada del repo la primera vez que no exista ahí, para que el botón "Guardar" de SPEC 04 funcione igual en `npm start` y en la app distribuida (Windows y Mac).

## Scope

**Incluye:**

- Cambiar `CONFIG_PATH` en `main.js` de `path.join(__dirname, 'config.json')` a `path.join(app.getPath('userData'), 'config.json')`.
- Al arrancar (`npm start` o app empaquetada), si `CONFIG_PATH` no existe todavía en `userData`, copiar ahí el `config.json` versionado en la raíz del repo (plantilla de defaults) antes de leerlo.
- Si `CONFIG_PATH` ya existe en `userData`, usarlo tal cual (no se vuelve a tocar la plantilla del repo).
- El handler IPC `save-settings` (SPEC 04) sigue escribiendo con `fs.writeFileSync`, ahora contra la nueva `CONFIG_PATH` en `userData` — sin cambios de lógica, solo de ruta.
- Mismo comportamiento en desarrollo y en producción: un solo code path, sin diferenciar por `app.isPackaged`.
- `config.json` de la raíz del repo sigue versionado en git, documentado como "plantilla de defaults" (no se renombra a `config.example.json`, no se agrega a `.gitignore`).

**Fuera de scope:**

- Migración automática desde una instalación previa que ya tenía `config.json` junto al ejecutable (build anterior de SPEC 10) — se asume que no hay instalaciones reales corriendo todavía con ese esquema.
- Sanitizar o neutralizar los valores reales (`codigoEvento: "aaa-2026"`, `settingsPassword`, etc.) que hoy tiene el `config.json` versionado — sigue siendo la misma plantilla, con los mismos valores.
- Cualquier cambio al formato/campos de `config.json` — esta spec es puramente de ubicación del archivo, no de contenido (eso ya lo cubren SPEC 03/04/05).
- Empaquetado para Windows (`electron-builder` target `win`) — no existe todavía (SPEC 10 solo cubrió Mac); esta spec deja el código listo para ambos SO vía `app.getPath('userData')` (multiplataforma por diseño de Electron), pero no agrega scripts de build de Windows.

## Data model

No se introducen campos nuevos en `config.json` — mismo esquema ya definido en SPEC 03/04/05 (`apiBaseUrl`, `ftpBaseUrl`, `codigoEvento`, `idSala`, `settingsPassword`, `theme`, `accentColor`). Esta spec solo cambia **dónde vive el archivo**, análogo a lo ya hecho para imágenes/presentaciones (SPEC 05/14, que usan `app.getPath('userData')`).

**Rutas involucradas (`main.js`):**

```js
// Antes
const CONFIG_PATH = path.join(__dirname, 'config.json')

// Después
const CONFIG_TEMPLATE_PATH = path.join(__dirname, 'config.json')   // plantilla versionada, solo lectura
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json') // archivo real, lectura/escritura
```

Convenciones:

- `CONFIG_TEMPLATE_PATH` nunca se escribe en runtime — solo se lee una vez, si `CONFIG_PATH` no existe todavía, para inicializar `userData/config.json` con una copia byte a byte.
- Tras la copia inicial (o si `CONFIG_PATH` ya existía), toda lectura/escritura posterior (arranque, `save-settings`) usa exclusivamente `CONFIG_PATH`.
- `app.getPath('userData')` resuelve a la carpeta estándar de Electron por SO (ej. `%APPDATA%/Octopus` en Windows, `~/Library/Application Support/Octopus` en Mac) — misma carpeta base donde SPEC 05/14 ya guardan `imagenes/` y presentaciones descargadas.

## Implementation plan

1. En `main.js`, renombrar el `require('./config.json')` actual a una constante `CONFIG_TEMPLATE_PATH` (ruta de plantilla) y definir `CONFIG_PATH` como `path.join(app.getPath('userData'), 'config.json')`. Verificación manual: no rompe la carga del módulo (`node -e` no aplica porque depende de Electron; se valida en el paso 3).
2. Extraer la carga de `config` (hoy `let config = applyConfigDefaults(require('./config.json'))` en el top-level del módulo) a una función `loadOrInitConfig()` que: (a) si `fs.existsSync(CONFIG_PATH)` es falso, copia `CONFIG_TEMPLATE_PATH` a `CONFIG_PATH` con `fs.copyFileSync` (creando la carpeta `userData` si no existe, aunque Electron ya la crea); (b) lee y parsea `CONFIG_PATH` con `fs.readFileSync`/`JSON.parse`; (c) aplica `applyConfigDefaults` como ya se hace hoy. Verificación manual: función aislada, probada en el paso 4.
3. Mover la llamada a `loadOrInitConfig()` (y la asignación a `let config`) de top-level del módulo a dentro de `app.whenReady().then(() => { ... })`, antes de `createWindow()` y `fetchInitialData(config)`, ya que `app.getPath('userData')` requiere que la app esté lista. Verificación manual: `npm start` arranca sin errores y la app muestra datos (mismo comportamiento que hoy).
4. Confirmar que el handler `save-settings` (ya usa `CONFIG_PATH` como constante, sin cambios de lógica) ahora escribe en `userData/config.json`. Verificación manual: borrar cualquier `config.json` de `userData` si existiera de pruebas previas, correr `npm start`, confirmar que aparece un `config.json` nuevo en `userData` (mismo contenido que la plantilla del repo) vía `console.log(app.getPath('userData'))` o inspección manual de la carpeta.
5. Verificación manual del flujo completo: con la app corriendo (`npm start`), entrar a `config`, cambiar un valor (ej. `idSala`) y Guardar; confirmar que `userData/config.json` se actualiza (no el `config.json` de la raíz del repo, que debe quedar intacto) y que la app refleja el cambio sin reiniciar.
6. Verificación manual empaquetada: generar el build (`npm run build:mac`, SPEC 10), correr el `.app` resultante (no `npm start`), confirmar que arranca con los valores de la plantilla, entrar a `config`, cambiar un valor y Guardar sin errores (a diferencia del comportamiento actual, donde escribir dentro del bundle fallaría). Confirmar también que el `config.json` de la raíz del repo/bundle no se modifica.
7. Actualizar el comentario/README si existiera alguna mención de "editar `config.json` en la raíz del proyecto" como forma de configurar el kiosco en producción, aclarando que en la app distribuida se edita el `config.json` de `userData` (la raíz del repo es solo la plantilla de defaults para desarrolladores).

## Acceptance criteria

- [x] `main.js` ya no lee ni escribe `config.json` desde `__dirname` (carpeta de la app) en runtime — usa `app.getPath('userData')`.
- [x] Al arrancar por primera vez (sin `config.json` previo en `userData`), la app copia automáticamente la plantilla del repo a `userData/config.json` y arranca con esos valores.
- [x] En arranques posteriores, si `userData/config.json` ya existe, la app lo usa tal cual — no se sobreescribe con la plantilla del repo.
- [x] Desde la pantalla `config` (SPEC 04), "Guardar" escribe en `userData/config.json`, no en el `config.json` de la raíz del repo/bundle.
- [x] El `config.json` de la raíz del repo permanece sin cambios después de usar "Guardar" en la app (dev o empaquetada).
- [x] Corriendo la app empaquetada (`.app` generado por `npm run build:mac`, no `npm start`), "Guardar" en la pantalla `config` funciona sin errores de escritura (a diferencia del comportamiento actual, donde el bundle es de solo lectura).
- [x] El comportamiento de lectura/escritura de `config.json` es idéntico entre `npm start` y la app empaquetada (mismo code path, sin ramas por `app.isPackaged`).
- [x] No se rompe ninguna funcionalidad existente de SPEC 01–14 (navegación, fetch inicial, refresh, reset, descarga de presentaciones/imágenes, apertura de `.key`/PowerPoint) salvo los cambios explícitamente documentados en esta spec.

## Decisions

- **Sí:** `config.json` real vive en `app.getPath('userData')`, igual que `imagenes/` (SPEC 14) y las presentaciones descargadas (SPEC 05). Reutiliza el mismo patrón ya establecido en el proyecto para archivos grabables en runtime, en vez de inventar una ubicación nueva.
- **No:** carpeta junto al ejecutable/`.app` instalado. Descartado porque en macOS el bundle firmado (SPEC 10) es de solo lectura por diseño, y en Windows requeriría permisos de administrador en `Program Files` — `userData` no tiene ninguna de esas restricciones.
- **Sí:** mismo code path en desarrollo y producción (sin diferenciar por `app.isPackaged`). Evita mantener dos comportamientos distintos y hace que lo que se prueba con `npm start` sea representativo de lo que corre en el kiosco real.
- **Sí:** el `config.json` de la raíz del repo se mantiene versionado tal cual, como plantilla de defaults que se copia al primer arranque. No se renombra a `config.example.json` ni se neutralizan sus valores — cambiarlo es un problema de higiene de secretos separado, fuera del alcance de esta spec.
- **No:** lógica de migración desde una instalación previa con `config.json` junto al ejecutable. Se asume que no hay kioscos reales corriendo todavía sobre el build de SPEC 10; si apareciera un caso real, se resuelve manualmente (copiar el archivo a `userData`) o en una spec futura.
- **Sí:** la copia inicial es una copia simple (`fs.copyFileSync`) de la plantilla completa, sin merge de campos ni versionado de esquema. Consistente con la simplicidad ya aceptada en SPEC 04/05/14 para otros archivos de configuración/estado.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `app.getPath('userData')` requiere que la app esté "ready" — llamarlo en el top-level del módulo (como está hoy `require('./config.json')`) rompería el arranque | Se mueve explícitamente la carga de `config` a dentro de `app.whenReady().then(...)` (paso 3 del plan), antes de `createWindow()`. |
| Si el usuario/operador del kiosco busca "el `config.json` de la app" en la carpeta de instalación (hábito actual, documentado en SPEC 04 como editable a mano), no lo va a encontrar ahí después de este cambio | Se documenta en el paso 7 del plan la nueva ubicación (`userData`); alternativamente, quien administra el kiosco ya tiene la pantalla `config` de SPEC 04 para editar sin tocar el filesystem directamente. |
| Actualizar la app (nuevo build) no actualiza los valores ya guardados en `userData/config.json` si cambia la plantilla del repo (ej. se agrega un campo nuevo en una spec futura) | Mismo riesgo ya aceptado implícitamente por `applyConfigDefaults`, que rellena campos faltantes con defaults en código — no requiere que `userData/config.json` esté sincronizado con la plantilla campo por campo. |
| En Windows, `userData` normalmente resuelve a una carpeta con espacios y bajo el perfil del usuario (`%APPDATA%\Octopus`) — cualquier código que asuma rutas sin espacios o acceso sin sesión de usuario podría fallar | No aplica ningún supuesto de ese tipo en el código actual (ya se usa `app.getPath('userData')` para imágenes/presentaciones sin problemas reportados); se valida igualmente en la verificación manual del plan si se prueba en Windows. |
