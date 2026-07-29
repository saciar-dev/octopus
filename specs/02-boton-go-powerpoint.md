# SPEC 02 — Botón Go: abrir PowerPoint en modo presentación

> **Estado:** implementado
> **Depende de:** SPEC 01 (mvp-visual-pantallas)
> **Fecha:** 2026-07-28
> **Objetivo:** Implementar el botón "Go" de la pantalla Speaker para que abra el archivo PowerPoint (.pptx) de la sesión directamente en modo presentación (slideshow) usando PowerPoint instalado en Windows.

## Scope

**Incluye:**

- Nuevo campo `pptPath` en cada sesión de `src/data/mockData.js` (dentro de `speaker`), con la ruta absoluta al archivo `.pptx` de esa sesión (valor mock/placeholder, ya que la ingesta real de datos está fuera de scope).
- Handler IPC en `main.js` (canal ej. `open-presentation`) que recibe la ruta del `.pptx` y ejecuta `POWERPNT.EXE /S <ruta>` para abrirlo directamente en modo presentación.
- Localización del ejecutable `POWERPNT.EXE` probando rutas conocidas de instalación de Office en Windows (Program Files / Program Files (x86), distintas versiones de Office).
- Exposición de una función en `preload.js` (vía `contextBridge`) para que el renderer pueda invocar el handler IPC sin acceso directo a Node.
- Cableado del botón "Go" en `src/screens/speaker.js`: al clickear, invoca la apertura del `.pptx` de la sesión actual.
- Manejo de error visible en la UI de Octopus (dentro de la pantalla Speaker) cuando: el archivo `.pptx` no existe en la ruta configurada, o no se encuentra `POWERPNT.EXE` en el sistema.
- Alcance de sistema operativo: solo Windows. El mecanismo asume `POWERPNT.EXE` y el flag `/S`.

**Fuera de scope (para specs futuras):**

- Soporte multiplataforma (Mac/Linux, detección de plataforma y apps alternativas como Keynote).
- Ingesta real de archivos PowerPoint desde datos del congreso (hoy es un campo mock hardcodeado).
- Cualquier acción de Octopus al volver de la presentación (ej. detectar cierre de PowerPoint y traer la ventana de Octopus al frente).
- Minimizar/ocultar la ventana de Octopus al presionar Go (se decide no hacerlo, ver Decisiones).
- Selector de archivo (file picker) para elegir el `.pptx` manualmente desde la UI.
- Localización de PowerPoint vía registro de Windows (se usa el enfoque de rutas conocidas).

## Data model

Se extiende el objeto `speaker` de cada sesión en `src/data/mockData.js` con un nuevo campo `pptPath`:

```js
speaker: {
  name: "Roger McIntyre",
  country: "Canada",
  photo: "assets/speakers/roger-mcintyre.jpg",
  sessionTitle: "Infección por CMV en TCPH alogénico: prevención y tratamiento",
  bio: "...",
  social: { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" },
  sponsor: { name: "Roche", logo: "assets/sponsors/roche.png" },
  followMeQr: "assets/qr/roger-mcintyre.png",
  pptPath: "C:\\Octopus\\presentations\\roger-mcintyre.pptx", // ruta absoluta mock al .pptx
},
```

Convenciones:

- `pptPath` es una ruta absoluta (string) al archivo `.pptx` en el filesystem local. No hay valor `null` documentado: todas las sesiones mock incluyen un `pptPath`, aunque el archivo en esa ruta pueda no existir realmente (para poder probar también el caso de error).
- No se agregan nuevas estructuras de datos ni archivos nuevos — solo se extiende el objeto `speaker` ya existente en `mockData.js`.
- No hay persistencia adicional: `pptPath` se lee en cada click de Go, no se cachea ni se guarda estado.

## Implementation plan

1. Agregar el campo `pptPath` a cada sesión mock en `src/data/mockData.js` (ruta absoluta de ejemplo, incluyendo al menos una sesión con ruta inválida para poder probar el caso de error). Verificación manual: `node -e "require('./src/data/mockData.js')"` no tira error.
2. En `main.js`, implementar una función que localice `POWERPNT.EXE` probando rutas conocidas de instalación de Office (Program Files / Program Files (x86), distintas versiones de Office numeradas). Verificación manual: en la máquina de desarrollo (con PowerPoint instalado), la función devuelve una ruta existente; se puede probar con un script/log temporal.
3. En `main.js`, agregar un handler IPC (`ipcMain.handle('open-presentation', ...)`) que reciba `pptPath`, valide que el archivo existe (`fs.existsSync`), localice `POWERPNT.EXE` y lo ejecute con `child_process.execFile('POWERPNT.EXE', ['/S', pptPath])`. Si el archivo no existe o no se encuentra PowerPoint, el handler devuelve un resultado de error con un mensaje descriptivo en vez de lanzar una excepción no controlada. Verificación manual: invocar el handler manualmente (ej. desde DevTools del main process o un script de prueba) con una ruta válida e inválida, y confirmar que PowerPoint abre en modo presentación en el caso válido.
4. En `preload.js`, exponer una función (ej. `octopusBridge.openPresentation(pptPath)`) vía `contextBridge` que invoque el canal IPC `open-presentation` y devuelva el resultado (éxito o error) al renderer. Verificación manual: revisar que `window.octopusBridge.openPresentation` esté disponible en DevTools del renderer.
5. En `src/screens/speaker.js`, cablear el botón "Go" para que, al clickear, llame a `octopusBridge.openPresentation(session.speaker.pptPath)` de la sesión actualmente mostrada, reemplazando el placeholder `console.log` existente. Verificación manual: click en Go en una sesión con `pptPath` válido abre PowerPoint en modo presentación.
6. Implementar el mensaje de error visible en la UI de Speaker (ej. un texto/alert dentro de la pantalla, sin bloquear la navegación) que se muestra cuando `openPresentation` devuelve un error (archivo no encontrado o PowerPoint no localizado). Verificación manual: click en Go en una sesión con `pptPath` inválido muestra el mensaje de error en pantalla y no rompe la app.

## Acceptance criteria

- [x] Cada sesión mock en `src/data/mockData.js` tiene un campo `speaker.pptPath` con una ruta absoluta a un archivo `.pptx`.
- [x] Al menos una sesión mock tiene un `pptPath` que apunta a un archivo inexistente, para poder probar el caso de error.
- [x] En la pantalla Speaker, click en el botón "Go" con la sesión activa teniendo un `pptPath` válido (archivo existente y PowerPoint instalado) abre PowerPoint directamente en modo presentación (slideshow), sin pasar por el modo edición.
- [x] Click en "Go" con un `pptPath` que apunta a un archivo inexistente muestra un mensaje de error visible en la pantalla Speaker, sin cerrar ni romper la app Octopus.
- [x] Si `POWERPNT.EXE` no se encuentra en ninguna de las rutas conocidas del sistema, click en "Go" muestra un mensaje de error visible en la pantalla Speaker, sin cerrar ni romper la app Octopus.
- [x] Después de abrir PowerPoint (caso exitoso), la ventana de Octopus permanece como está (no se minimiza ni se oculta explícitamente).
- [x] La lógica de acceso al filesystem y de ejecución de `POWERPNT.EXE` vive en `main.js` (proceso principal), no en el renderer, y se expone al renderer únicamente a través de `preload.js`/`contextBridge`.
- [x] No se rompe ninguna funcionalidad existente de la SPEC 01 (navegación entre pantallas, botones back, teclado, etc.).

## Decisions

- **Sí:** ejecutar `POWERPNT.EXE /S <ruta>` para forzar modo presentación directo. Es el mecanismo estándar de PowerPoint en Windows para abrir en slideshow sin pasar por modo edición.
- **No:** abrir el `.pptx` con la app por defecto (`shell.openPath`) sin flag. Abriría en modo edición y requeriría que el usuario presione F5 manualmente, lo cual no cumple con el objetivo de un flujo de kiosco sin intervención manual extra.
- **Sí:** localizar `POWERPNT.EXE` probando rutas conocidas de Program Files / Program Files (x86) con distintas versiones de Office. Es más simple que leer el registro de Windows y suficiente para un entorno de kiosco con instalación controlada.
- **No:** leer la ruta de PowerPoint desde el registro de Windows. Añade complejidad (lectura de registro desde Node/Electron) no justificada para este alcance; se puede reconsiderar si las rutas conocidas resultan insuficientes en producción.
- **Sí:** alcance limitado a Windows. El entorno de desarrollo y el uso previsto (kiosco fijo) son Windows; soporte multiplataforma queda para una spec futura que agregue detección de plataforma.
- **No:** soporte Mac/Linux en esta spec. Aumentaría el alcance en más de un dominio de decisión (detección de plataforma, apps alternativas como Keynote) sin necesidad inmediata.
- **Sí:** campo `pptPath` como ruta absoluta hardcodeada en `mockData.js`. Consistente con el resto de la SPEC 01 (datos mock sin ingesta real); la ingesta real de archivos PowerPoint queda para otra spec.
- **No:** minimizar/ocultar la ventana de Octopus al presionar Go. PowerPoint en modo presentación ya toma el foco y ocupa toda la pantalla; agregar lógica de minimizado es complejidad extra sin beneficio claro, y el usuario puede volver a Octopus manualmente cuando termine la presentación.
- **No:** file picker para elegir el `.pptx` desde la UI. La ruta viene de los datos de la sesión (mock hoy, real en el futuro), no de una selección manual del usuario en cada uso.
- **Sí:** manejo de error visible en pantalla (no solo log en consola) porque Octopus se usa en un kiosco sin acceso a consola/DevTools por parte del disertante.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `POWERPNT.EXE` no se encuentra porque Office está instalado como aplicación de Microsoft Store (ruta distinta a Program Files clásico) o en una ruta no contemplada | Documentar en el código las rutas probadas; si en producción falla, se agrega esa ruta específica a la lista. El error se muestra en pantalla en vez de fallar silenciosamente. |
| El flag `/S` deja de funcionar o cambia de comportamiento entre versiones de Office (ej. Office 365 vs. versiones perpetuas) | Probar manualmente con la versión de PowerPoint instalada en la máquina de destino (kiosco) antes de dar por cerrada la spec; si `/S` no está disponible en esa versión, se documenta como riesgo abierto para ajustar el mecanismo. |
| CSP estricta en `index.html` (`script-src 'self'`) podría bloquear la comunicación si no se usa correctamente el patrón `contextBridge`/IPC | Seguir el mismo patrón ya usado para `octopusData` en `preload.js` (exposeInMainWorld), sin scripts inline ni `require` directo desde el renderer. |
| Ruta de `pptPath` con backslashes de Windows mal escapada en el JS mock genera errores de parseo o rutas incorrectas | Usar rutas con backslashes escapados correctamente (`\\`) o forward slashes, y verificar con `fs.existsSync` antes de intentar ejecutar PowerPoint. |
