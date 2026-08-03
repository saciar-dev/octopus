# SPEC 12 — Remover atributo de cuarentena de las presentaciones descargadas en macOS

> **Estado:** aprobado
> **Depende de:** SPEC 05 (descarga-presentaciones), SPEC 09 (abrir-key-macos), SPEC 11 (diagnostico-permiso-archivos-macos)
> **Fecha:** 2026-08-02
> **Objetivo:** Que Octopus quite el atributo `com.apple.quarantine` de cada `.key` inmediatamente después de descargarlo (SPEC 05), en macOS, para que el primer intento de abrirlo vía AppleScript (SPEC 09) no falle con "operación no permitida" — implementando la Opción A de la recomendación de SPEC 11, que aisló ese atributo como causa raíz confirmada del error (no la firma/identidad del `.app`, no TCC de Automatización ni de "Archivos y carpetas").

## Contexto

SPEC 11 diagnosticó, con evidencia de Console.app y pruebas controladas en una Mac real, que el error "operación no permitida" al abrir un `.key` nunca antes tocado se debe a que Keynote (app sandboxed) no logra emitir una extensión de lectura del sandbox (`com.apple.app-sandbox.read`) para un archivo que tiene el atributo `com.apple.quarantine`, al recibir la orden de apertura vía AppleEvents (`open POSIX file` desde `osascript`). Quitar ese atributo con `xattr -d com.apple.quarantine <archivo>` resolvió el problema de forma directa y reproducible, sin necesitar el workaround manual de "abrirlo una vez desde Terminal" que se venía usando como mitigación informal desde SPEC 09/10. SPEC 11 concluyó explícitamente que la notarización real (cuenta de Apple Developer paga) no es necesaria, porque el problema es del archivo, no de la identidad de Octopus.

La prueba de SPEC 11 se hizo sobre un archivo copiado manualmente (`cp`) desde otro `.key` que ya tenía cuarentena de un uso anterior de Keynote — no sobre un archivo descargado por el flujo real de Octopus (`src/main/presentationDownloader.js`, que usa `fetch` + `fsPromises.writeFile` desde el proceso principal de Electron). Todavía no está confirmado empíricamente si ese flujo de descarga efectivamente estampa `com.apple.quarantine` en los archivos que genera — Node.js escribiendo un archivo con `fs.writeFile` no necesariamente dispara el mismo mecanismo que Safari/Mail al descargar. El primer paso de este spec es verificar eso antes de implementar la remoción.

## Scope

**Incluye:**

- Verificar en una Mac real si los `.key` descargados por el flujo actual de SPEC 05 (`downloadPresentacion` en `src/main/presentationDownloader.js`) tienen o no `com.apple.quarantine` inmediatamente después de la descarga, antes de cualquier apertura manual.
- Si se confirma que sí lo tienen (o como medida preventiva aunque el resultado sea ambiguo): agregar, solo en macOS, un paso que remueva `com.apple.quarantine` del archivo justo después de escribirlo en `downloadPresentacion`, antes de que el manifest lo marque como descargado.
- Manejar el caso en que el atributo no exista (no debe romper la descarga ni mostrar error al usuario — es una operación best-effort).
- Verificación manual end-to-end en una Mac real: descargar una presentación nunca antes vista por el flujo normal de la app (SPEC 02 → SPEC 05), y confirmar que el primer "Go" (SPEC 09) abre Keynote sin "operación no permitida" y sin pasos manuales previos.
- Confirmar que el comportamiento en Windows no cambia (la app también corre en Windows según SPEC 02/05).

**Fuera de scope:**

- Opción B de SPEC 11 (abrir el archivo una vez vía LaunchServices/`open -a Keynote` en lugar de `osascript open POSIX file`) — se descarta como enfoque principal a favor de la Opción A; si en la verificación de este spec la remoción de cuarentena no alcanza por algún motivo no anticipado, se evalúa la Opción B en una spec posterior.
- Notarización real (Apple Developer ID) — SPEC 11 ya concluyó que no es necesaria para este problema.
- Cambios al formato del manifest de descargas o a la lógica de reintentos/cola de SPEC 05 — este spec solo agrega un paso de limpieza de atributo extendido sobre el archivo ya escrito.
- Cualquier cambio a la lógica de apertura de Keynote en `src/main/keynoteOpener.js` (SPEC 09) — no hace falta tocarla si la causa raíz se resuelve en el momento de la descarga.

## Data model

Este spec no introduce estructuras de datos nuevas. No afecta `config.json` ni el `state` de la app. El manifest de descargas (`manifest.json`, gestionado por SPEC 05) no cambia de formato.

## Implementation plan

1. En una Mac real, descargar manualmente una presentación nunca antes vista a través del flujo normal de la app (no copiando archivos a mano) y correr `xattr -l` sobre el `.key` resultante inmediatamente después de la descarga, antes de abrirlo con nada. Documentar en Decisions si aparece o no `com.apple.quarantine`.
2. En `src/main/presentationDownloader.js`, dentro de `downloadPresentacion`, después de `await fsPromises.writeFile(localPath, buffer)` y antes de actualizar el manifest, agregar una función `stripQuarantine(localPath)` que solo actúe cuando `process.platform === 'darwin'`, ejecutando el equivalente a `xattr -d com.apple.quarantine <localPath>` (vía `child_process.execFile`, sin `shell: true`, pasando la ruta como argumento para evitar inyección de comandos).
3. Envolver la remoción en un `try/catch` (o inspeccionar el código de salida) que ignore silenciosamente el caso en que el atributo no exista, y solo loguee a consola (sin interrumpir la descarga) si falla por otro motivo.
4. Verificación manual en Mac real: repetir la descarga de una presentación nunca antes vista con el cambio aplicado, confirmar con `xattr -l` que el `.key` resultante no tiene `com.apple.quarantine`, y probar el flujo completo de "Go" (SPEC 09) sobre ese archivo confirmando que abre Keynote en el primer intento sin "operación no permitida".
5. Verificación en Windows: confirmar que la descarga de una presentación sigue funcionando igual que antes (SPEC 02/05), sin ningún intento de ejecutar `xattr` ni errores relacionados en consola.

## Acceptance criteria

- [ ] Queda documentado en Decisions si los archivos descargados por el flujo real de Octopus (sin intervención manual) traían `com.apple.quarantine` antes de este cambio.
- [ ] En macOS, después de `downloadPresentacion`, el `.key` resultante no tiene el atributo `com.apple.quarantine` (verificado con `xattr -l` en una Mac real).
- [ ] El primer intento de "Go" (SPEC 09) sobre una presentación recién descargada por el flujo real de Octopus abre Keynote sin "operación no permitida", sin necesitar abrirla antes manualmente desde Terminal/Finder.
- [ ] Si el archivo no tiene `com.apple.quarantine` (por ejemplo, en descargas repetidas de un mismo archivo ya limpiado), la descarga no falla ni muestra error al usuario.
- [ ] El flujo de descarga en Windows no se ve afectado por este cambio (mismo comportamiento que antes de este spec).

## Decisions

### Paso 1 — Verificación de cuarentena en descarga real

Se descargó `713.key` a través del flujo normal de la app (`.app` empaquetado, `Octopus.app`) sin ninguna intervención manual, y se corrió inmediatamente:

```
xattr -l ~/Library/Application\ Support/Octopus/presentaciones/*/*/713.key
```

**Resultado: sin salida — el archivo no tiene ningún atributo extendido, incluyendo `com.apple.quarantine`.**

Esto confirma el riesgo anticipado en la tabla de Risks: el flujo actual de descarga (`fetch` + `fsPromises.writeFile` desde el proceso principal de Electron) **no estampa `com.apple.quarantine`**, a diferencia del archivo de prueba de SPEC 11 (copiado manualmente con `cp` desde un `.key` que sí traía cuarentena de un uso previo de Keynote/Safari/Mail).

**Decisión:** siguiendo lo indicado en el Scope ("como medida preventiva aunque el resultado sea ambiguo"), se implementa igual `stripQuarantine` en el paso 2 — es una operación best-effort que no rompe nada si el atributo no está presente, y cubre el caso en que sí aparezca en otros entornos/versiones de macOS. En el paso 4 (verificación end-to-end) se prueba explícitamente si el "Go" sobre este mismo `713.key` (sin cuarentena) reproduce o no el error "operación no permitida", para determinar si además hace falta reabrir la investigación de SPEC 11.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El flujo de descarga actual (`fetch` + `fsPromises.writeFile` desde el proceso principal de Electron) podría no estampar `com.apple.quarantine` en absoluto, haciendo este spec innecesario para el problema real | Paso 1 del plan verifica esto empíricamente antes de implementar nada; si no aparece cuarentena en descargas reales, hay que re-abrir la investigación de SPEC 11 (ej. revisar si el archivo de prueba usado ahí no era representativo del flujo real) antes de cerrar este spec. |
| Ejecutar `xattr` vía `child_process` agrega una dependencia del binario del sistema; si Apple cambia o remueve `xattr` en una versión futura de macOS, el mecanismo dejaría de funcionar silenciosamente | Aceptado: `xattr` es una herramienta estable de macOS desde hace más de una década; el fallo se loguea sin romper la descarga, por lo que el peor caso es volver al comportamiento actual (bloqueo en el primer intento), no una regresión peor. |
| Remover cuarentena de forma automática y silenciosa reduce una capa de protección de Gatekeeper pensada para archivos de origen no confiable | Aceptado como parte del diseño: los `.key` vienen de la API propia del congreso (SPEC 03), no de descargas arbitrarias de internet por el usuario; el riesgo de seguridad que la cuarentena mitiga no aplica a este flujo controlado. |
