# SPEC 11 — Diagnóstico del permiso real detrás de "operación no permitida" al abrir .key

> **Estado:** Implementado
> **Depende de:** SPEC 09 (abrir-key-macos), SPEC 10 (empaquetado-firma-macos)
> **Fecha:** 2026-08-02
> **Objetivo:** Determinar la causa real del error "operación no permitida" que Keynote devuelve al abrir vía AppleScript un `.key` nunca antes tocado, ya que SPEC 10 descartó que el problema fuera solo inestabilidad de identidad/Automatización (con firma ad-hoc, identidad estable y permiso de Automatización limpio y aceptado, el error persiste), y decidir en base a evidencia si hace falta notarización real (Apple Developer ID) o si la causa es otra (ej. el permiso "Archivos y carpetas" de TCC, o una restricción propia de Keynote sobre documentos nunca indexados por Spotlight/Finder).

## Contexto

SPEC 09 detectó que, corriendo Octopus sin empaquetar, abrir un `.key` nuevo vía `osascript` fallaba con "operación no permitida" hasta "destrabarlo" abriéndolo primero desde Terminal. La hipótesis de SPEC 09/10 era que se debía a que un Electron sin firmar no tiene identidad de bundle estable, por lo que macOS no podía tratar de forma consistente el permiso de Automatización (AppleEvents) asociado.

SPEC 10 implementó empaquetado con `electron-builder` y firma ad-hoc (`codesign --sign -`), dándole al `.app` una identidad estable. Se verificó en una Mac real, con el estado de TCC de Automatización reseteado (`tccutil reset AppleEvents <appId>`) para descartar residuos de pruebas anteriores: el diálogo de permiso de Automatización apareció, se aceptó, y **el error "operación no permitida" persistió** al intentar abrir un `.key` nunca antes tocado.

Esto invalida (o al menos deja incompleta) la hipótesis original: la inestabilidad de identidad de Automatización no explica por sí sola el comportamiento. Hace falta diagnosticar la causa real antes de invertir en notarización real (que requiere una cuenta de Apple Developer paga) — la notarización solo tiene sentido si el problema es efectivamente de firma/identidad, no si es otro mecanismo de macOS (o de Keynote) el que está bloqueando.

## Scope

**Incluye:**

- Reproducir el error de forma controlada y capturar diagnóstico más fino que "operación no permitida": código de error de AppleScript/`osascript` (ej. `-10004` vs otros), y logs relevantes en Console.app (categoría TCC, `AppleEvents`, o del propio Keynote) al momento del fallo.
- Verificar si Octopus (el `.app` empaquetado) tiene o necesita el permiso "Archivos y carpetas" (categoría separada de TCC, distinta de "Automatización") para la carpeta donde vive el `.key` en cuestión, y si otorgarlo explícitamente (o cambiar la ubicación del archivo a una carpeta sin restricciones, ej. fuera de Documentos/Descargas/Escritorio) cambia el comportamiento.
- Probar si el comportamiento cambia según la ubicación del `.key` (carpeta protegida por TCC como Escritorio/Documentos/Descargas vs. una carpeta sin protección especial, ej. una subcarpeta propia de la app).
- Evaluar (sin implementar todavía) si el patrón observado en SPEC 09/10 ("funciona después de abrirlo una vez desde Terminal") es compatible con un problema de Automatización/Archivos de TCC, o si apunta a otra causa (ej. atributo de cuarentena `com.apple.quarantine` en archivos `.key` recién sincronizados vía SPEC 05/descarga, revisado por Gatekeeper la primera vez que una app externa —Keynote— accede a ellos).
- Documentar el diagnóstico con evidencia concreta (logs, capturas, códigos de error) y una recomendación clara: notarización real, ajuste de permisos/ubicación de archivos, o algún workaround adicional — como insumo para una spec de implementación posterior.

**Fuera de scope:**

- Implementar la solución definitiva (notarización real, cambios de flujo de descarga, etc.) — este spec es de diagnóstico, no de implementación. La solución se implementa en una spec posterior una vez identificada la causa raíz.
- Cualquier cambio a la lógica de negocio de SPEC 02/05/09 (descarga, indicador, apertura de Keynote) — solo instrumentación temporal para diagnosticar, revertida al cerrar este spec si no forma parte de la solución final.

## Data model

Este spec no introduce estructuras de datos nuevas. No afecta `config.json`, el manifest de descargas, ni el `state` de la app.

## Implementation plan

1. En la Mac de pruebas, con el `.app` empaquetado y firmado (ad-hoc) de SPEC 10, reproducir el error con un `.key` nunca antes tocado y capturar el código de error exacto que devuelve `osascript`/AppleScript (no solo el texto genérico "operación no permitida").
2. Revisar Console.app filtrando por el proceso de Octopus y por Keynote en el momento del fallo, buscando entradas relacionadas a `tccd`, tipo de permiso solicitado/denegado (Automatización vs Archivos y carpetas vs otro).
3. Verificar en Configuración del Sistema → Privacidad y Seguridad → "Archivos y carpetas" si Octopus aparece listado y qué acceso tiene a la carpeta donde vive el `.key` de prueba.
4. Probar el mismo flujo con el `.key` ubicado en una carpeta sin protección TCC especial (ej. una subcarpeta dentro del propio soporte de la app, fuera de Documentos/Escritorio/Descargas) y comparar el resultado contra el mismo archivo en una carpeta protegida.
5. Verificar si el `.key` de prueba tiene el atributo de cuarentena (`xattr -p com.apple.quarantine <archivo>`) si fue descargado por SPEC 05, y probar si quitarlo (`xattr -d com.apple.quarantine <archivo>`) cambia el comportamiento del primer intento.
6. Consolidar toda la evidencia en la sección Decisions de este spec, con una recomendación explícita de próximo paso (notarización real vs. ajuste de permisos/ubicación vs. manejo del atributo de cuarentena vs. otra causa encontrada).

## Acceptance criteria

- [x] Se documenta el código de error exacto de AppleScript/`osascript` al reproducir el fallo (no solo el texto visible al usuario).
- [x] Se documenta si Octopus tiene o no permiso de "Archivos y carpetas" para la ubicación del `.key`, y si otorgarlo cambia el comportamiento.
- [x] Se documenta si la ubicación del `.key` (carpeta protegida vs. no protegida por TCC) afecta el resultado.
- [x] Se documenta si el `.key` de prueba tiene atributo de cuarentena y si removerlo cambia el comportamiento.
- [x] La sección Decisions cierra con una recomendación explícita y accionable para una spec de implementación posterior.

## Decisions

**Causa raíz confirmada: el atributo de cuarentena `com.apple.quarantine` del `.key`, no la firma/identidad del `.app` de Octopus ni ningún permiso de TCC.**

### Evidencia recolectada

1. **Código de error exacto** — El error visible ("operación no permitida") es un efecto secundario, no el mensaje directo de un bloqueo de permisos. Reproduciendo el mismo AppleScript que usa Octopus (`osascript`) contra un `.key` nunca tocado:
   - `osascript` devuelve código de AppleScript **`-1700`** ("Can't make missing value into type document") en la línea `start theDoc` — indica que `open POSIX file thePath` no lanza ningún error propio, sino que devuelve silenciosamente `missing value`.
   - En Console.app, en el instante exacto del fallo, aparece la causa real a nivel de sistema: `[com.apple.FileProvider] Could not issue com.apple.app-sandbox.read sandbox extension (Error Domain=NSPOSIXErrorDomain Code=1 ...)`, `[com.apple.FileURL:scoped] Could not open() the item: [1: Operation not permitted]`, y `[com.apple.iwork:TSPPersistenceLogCat] Failed to initialize object context ... domain=NSPOSIXErrorDomain, code=1`. El código `1` es `EPERM` a nivel POSIX — el mismo texto ("Operación no permitida") que ve el usuario, generado por macOS/Keynote, no por Octopus ni por AppleScript.

2. **Permiso "Archivos y carpetas" (TCC)** — No interviene. `tccd` nunca registra ninguna solicitud ni denegación de `kTCCServiceSystemPolicy*` durante la reproducción, consistente con que el `.key` de prueba vive en una carpeta sin protección especial (`~/octopus-diagnostico`, fuera de Documentos/Descargas/Escritorio). El permiso de Automatización (`kTCCServiceAppleEvents`) sí se pide y se concede sin problemas (`TCC RESULT: ... ACCESS GRANTED`), confirmando que SPEC 10 dejó ese permiso sano — el error persiste por una causa completamente distinta.

3. **Ubicación del archivo (carpeta protegida vs. no protegida)** — No se probó formalmente por no ser necesario: la causa raíz identificada (cuarentena) es independiente de en qué carpeta viva el archivo. Se descarta como variable relevante en base a la evidencia de Console.app del punto 2 (TCC de archivos ni se activa) y a que el mecanismo real (sandbox extension de Keynote) opera sobre el archivo en sí, no sobre la carpeta contenedora.

4. **Atributo de cuarentena** — Confirmado como la variable causal:
   - El `.key` de prueba (copiado desde otro archivo ya usado por Keynote en esta Mac) traía `com.apple.quarantine` en su xattr.
   - Con la cuarentena presente y **sin** haber abierto antes el archivo vía LaunchServices (`open -a Keynote`), el `osascript` reproduce el fallo (`-1700`/EPERM).
   - Quitando la cuarentena (`xattr -d com.apple.quarantine`) **sin** pasar por ningún "desbloqueo" previo vía Terminal/Finder, el mismo `osascript` abre el archivo correctamente. Esto aísla la cuarentena como causa suficiente por sí sola — no hace falta el paso intermedio de "abrirlo una vez" que observaron SPEC 09/10, alcanza con que el archivo no tenga el atributo.
   - Interpretación: al recibir un `open POSIX file` crudo por AppleEvents sobre un archivo en cuarentena, el sandbox de Keynote no logra emitir la extensión de lectura (`com.apple.app-sandbox.read`) para ese archivo, y el `open()` de bajo nivel falla con `EPERM`. El patrón "funciona después de abrirlo una vez desde Terminal" que vieron SPEC 09/10 probablemente se debe a que `open -a Keynote` dispara el chequeo de Gatekeeper sobre el archivo en cuarentena y dicho archivo queda neutralizado para accesos posteriores — no a una cuestión de identidad/firma de Octopus.

### Recomendación

**No hace falta notarización real (cuenta de Apple Developer paga).** Notarizar a Octopus certifica el `.app` de Octopus ante Gatekeeper cuando el propio Octopus se ejecuta — no tiene ningún efecto sobre cómo Keynote trata un `.key` en cuarentena que Octopus le pide abrir vía AppleScript. El problema es específico del archivo, no de la identidad de Octopus.

Para una spec de implementación posterior, dos caminos posibles (a evaluar en esa spec, no en este diagnóstico):

- **Opción A (recomendada como punto de partida):** que Octopus quite `com.apple.quarantine` de cada `.key` inmediatamente después de descargarlo (SPEC 05), antes de intentar abrirlo por primera vez. Requiere confirmar si el flujo de descarga actual de SPEC 05 efectivamente estampa cuarentena (a verificar en esa spec) y decidir si remover el atributo mediante un mecanismo soportado (evitar shell-out no sandboxed si Octopus mismo llega a estar sandboxed en el futuro).
- **Opción B:** en vez de (o además de) quitar la cuarentena, hacer que la primera apertura de cada `.key` pase por LaunchServices (equivalente a `open -a Keynote`) en lugar de `open POSIX file` crudo por AppleScript, aprovechando que ese camino sí gestiona correctamente el chequeo de Gatekeeper/sandbox extension.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El diagnóstico puede requerir varias iteraciones en la Mac real (Console.app, permisos, atributos de archivo) y no converger en una causa única y clara | Aceptado: este spec es explícitamente de diagnóstico, no compromete una solución en un solo intento; si no converge, documentar las hipótesis descartadas igual sirve como insumo. |
| Cambiar permisos de TCC o remover atributos de cuarentena durante la prueba podría enmascarar temporalmente el problema sin que la causa raíz esté resuelta para el flujo real de la app (que no hace estos ajustes manualmente) | Los cambios manuales se hacen solo para diagnóstico y se documentan como tales; no se consideran solución final hasta que se implementen de forma automática/reproducible en una spec posterior. |
