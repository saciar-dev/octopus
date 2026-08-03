# SPEC 13 — Abrir `.key` vía LaunchServices en vez de AppleScript crudo (Opción B de SPEC 11)

> **Estado:** aprobado
> **Depende de:** SPEC 09 (abrir-key-macos), SPEC 11 (diagnostico-permiso-archivos-macos), SPEC 12 (remover-cuarentena-key-macos)
> **Fecha:** 2026-08-02
> **Objetivo:** Determinar si abrir el `.key` a través de LaunchServices (equivalente a `open -a Keynote <archivo>`) en vez de `osascript`/`open POSIX file` evita el error "operación no permitida" en el flujo real de descarga de Octopus, dado que SPEC 12 confirmó que la remoción de `com.apple.quarantine` (Opción A) no resuelve el bug para archivos descargados por el flujo real de la app.

## Contexto

SPEC 11 diagnosticó que el error "operación no permitida" se debía al atributo `com.apple.quarantine` en un `.key` de prueba copiado manualmente, y SPEC 12 implementó la Opción A (remoción automática de ese atributo tras la descarga). Al verificar en una Mac real con un archivo (`713.key`) descargado por el flujo normal de la app (no copiado a mano), se confirmó que:

- El archivo **nunca tuvo** `com.apple.quarantine`, ni antes ni después del fix de SPEC 12.
- El error "operación no permitida" **persiste** igual al primer "Go".

Esto invalida la aplicabilidad de la causa raíz de SPEC 11 al flujo real de Octopus: el archivo de prueba de SPEC 11 (con cuarentena heredada de un uso previo de Keynote/Safari/Mail) no es representativo de un `.key` que Octopus descarga por HTTP y escribe con `fsPromises.writeFile`. El mecanismo real que bloquea la apertura en el flujo de Octopus sigue sin identificarse con certeza.

SPEC 11 dejó documentada la Opción B como alternativa no explorada: en vez de pedirle a Keynote que abra un `open POSIX file` crudo por AppleEvents, hacer que la primera apertura de cada `.key` pase por LaunchServices (el mecanismo que usa `open -a Keynote <archivo>` desde Finder/Terminal), que sí gestiona correctamente el chequeo de Gatekeeper/sandbox extension según la hipótesis de SPEC 11.

## Scope

**Incluye (a definir/refinar antes de aprobar este spec):**

- Reproducir el error con `713.key` (o un `.key` nuevo del flujo real) y, en paralelo, revisar Console.app en el momento del fallo para obtener el mismo nivel de evidencia que SPEC 11 obtuvo con su archivo de prueba (código de error, entradas de `tccd`/sandbox/Keynote), ya que el mecanismo puede no ser el mismo que documentó SPEC 11.
- Probar manualmente si `open -a Keynote /ruta/al/713.key` (LaunchServices, vía Terminal) abre el archivo sin error en el primer intento, para validar la hipótesis de la Opción B antes de programar nada.
- Si LaunchServices resuelve el problema: diseñar cómo `src/main/keynoteOpener.js` (SPEC 09) puede invocar el equivalente de `open -a Keynote` en vez de `osascript open POSIX file` — evaluando si además hace falta el comportamiento actual de AppleScript (ej. traer Keynote al frente, cerrar ventana anterior) y cómo preservarlo.
- Si LaunchServices tampoco resuelve el problema: documentar la evidencia y decidir si hace falta reabrir el diagnóstico desde cero (posible causa distinta a TCC/cuarentena/Automatización).

**Fuera de scope:**

- Revertir o modificar el fix de SPEC 12 (`stripQuarantine`) — se deja como medida preventiva de bajo costo, no hace daño aunque no resuelva el bug principal.
- Notarización real (Apple Developer ID) — sigue sin evidencia de que sea la causa.

## Data model

A definir en el refinamiento — probablemente no introduce estructuras de datos nuevas, solo cambios en `src/main/keynoteOpener.js`.

## Implementation plan

1. Reproducir el error con `713.key` y validar manualmente en Terminal si `open -a Keynote <path>` (LaunchServices) abre el archivo sin error. **✅ Completado 2026-08-03** — abrió sin error en el primer intento.
2. Rediseñar `src/main/keynoteOpener.js` (Opción 1 — híbrido) para:
   - Mantener el `stop`/`close every document` vía AppleScript como paso previo (limpieza de estado anterior de Keynote).
   - Reemplazar `open POSIX file` por `open -a Keynote <path>` vía `execFile('open', ...)` (LaunchServices) para la apertura real del archivo.
   - Tras la apertura, correr un AppleScript corto que haga `activate` y `start (document 1)` con un retry/poll (hasta 20 intentos de 0.25s) para esperar a que el documento termine de cargar antes de iniciar la presentación.

## Acceptance criteria

- [x] `open -a Keynote <path>` abre un `.key` descargado por el flujo real de Octopus sin el error "operación no permitida", en el primer intento.
- [x] `src/main/keynoteOpener.js` usa LaunchServices (`open -a Keynote`) para la apertura del archivo, en vez de `osascript open POSIX file`.
- [x] Al presionar "Go" se sigue: cerrando cualquier documento/presentación anterior de Keynote, trayendo Keynote al frente, e iniciando la presentación automáticamente — mismo comportamiento que antes del cambio.

## Decisions

- **2026-08-03** — Prueba manual en Mac real: `open -a Keynote "/ruta/completa/a/713.key"` abrió el archivo **sin error** en el primer intento (el mismo `713.key` que fallaba con "operación no permitida" vía `osascript`/`open POSIX file`). Esto confirma la hipótesis de la Opción B: LaunchServices gestiona correctamente el chequeo de Gatekeeper/sandbox que el `open POSIX file` de AppleScript no gestiona. Se decide avanzar con el rediseño de `src/main/keynoteOpener.js` para usar LaunchServices en vez de AppleScript para la apertura inicial.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El mecanismo real que bloquea la apertura en el flujo de Octopus todavía no está confirmado — LaunchServices podría no resolverlo tampoco | El primer paso del plan es probarlo manualmente vía Terminal antes de programar cualquier cambio en `keynoteOpener.js`, para no invertir en una solución sin validar la hipótesis primero. |
