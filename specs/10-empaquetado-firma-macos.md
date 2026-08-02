# SPEC 10 — Empaquetado y firma de la app Electron para macOS

> **Estado:** aprobado
> **Depende de:** SPEC 09 (abrir-key-macos)
> **Fecha:** 2026-08-01
> **Objetivo:** Empaquetar Octopus como una app `.app` de macOS con identidad estable y firma (al menos ad-hoc), en vez de correrla vía `npm start`/`electron .` en modo desarrollo, para que macOS reconozca de forma consistente los permisos de Automatización y de acceso a archivos que SPEC 09 necesita para controlar Keynote — evitando el comportamiento errático detectado en pruebas donde un archivo `.key` nuevo era rechazado por Keynote (`osascript` -> "operación no permitida") hasta que era "destrabado" manualmente abriéndolo primero desde Terminal.

## Contexto

Durante las pruebas de SPEC 09 en una Mac real se observó que, corriendo Octopus sin empaquetar (`npm start`, que lanza el binario genérico de `electron` en modo desarrollo), el primer intento de abrir un archivo `.key` nuevo vía AppleScript a veces fallaba con "operación no permitida", mientras que el mismo archivo abierto una vez desde Terminal (`osascript` directo) luego se abría sin problema desde la propia app. Esto es consistente con el riesgo ya documentado en SPEC 09 ("Sin firma/notarización de la app... Gatekeeper podría bloquear o advertir..."): un binario Electron sin firmar y con identidad inestable entre ejecuciones no acumula de forma confiable los permisos de Automatización/acceso a archivos que macOS asocia a una app. Empaquetar y firmar la app le da una identidad de bundle estable, que es lo que macOS necesita para tratar esos permisos de forma consistente.

## Scope

**Incluye:**

- Incorporar una herramienta de empaquetado (ej. `electron-builder`) como dependencia de desarrollo, con configuración mínima para generar un `.app` de macOS (target `dir` o `dmg`, a definir en el plan de implementación).
- Definir un `Info.plist` (vía configuración del empaquetador) que incluya `NSAppleEventsUsageDescription` con un texto explicando por qué Octopus necesita controlar Keynote vía Eventos de Apple.
- Firma ad-hoc (`codesign` con identidad `-`) del `.app` generado, suficiente para que macOS le asigne una identidad de bundle estable entre builds, sin requerir una cuenta de Apple Developer pagada.
- Verificación manual de que, con la app empaquetada y firmada (ad-hoc), el comportamiento de SPEC 09 (abrir `.key` en Keynote vía "Go") es consistente para archivos nuevos sin necesitar el workaround manual de abrirlos primero por Terminal.
- Documentar el proceso de build (`npm run build:mac` o equivalente) para generar el `.app` a instalar en las Macs de los eventos.

**Fuera de scope (para specs futuras, si resultan necesarias):**

- Notarización ante Apple (requiere cuenta de Apple Developer paga) y firma con certificado de Developer ID — se evalúa solo si la firma ad-hoc resulta insuficiente en la práctica (ej. si Gatekeeper sigue bloqueando la app en Macs distintas a la de desarrollo).
- Distribución/instalación automatizada del `.app` en las Macs de los eventos (ej. MDM, `.pkg` instalador) — este spec cubre solo generar el artefacto empaquetado y firmado, no su despliegue.
- Empaquetado para Windows — SPEC 02/05 ya funcionan corriendo la app sin empaquetar; este spec se acota a macOS porque es donde se detectó el problema de permisos.
- Auto-actualización de la app (`electron-updater` u otro mecanismo) — no se pidió y no es necesario para resolver el problema de permisos.

## Data model

Este spec no introduce estructuras de datos nuevas. No afecta `config.json`, el manifest de descargas, ni el `state` de la app.

## Implementation plan

1. Agregar `electron-builder` (o la herramienta que se decida) como devDependency y configurar el bloque `build` en `package.json` (o un `electron-builder.yml` separado) con `appId`, `productName: "Octopus"`, target `mac: dir` para empezar (sin generar `.dmg` todavía, para iterar rápido).
2. Configurar `NSAppleEventsUsageDescription` (y cualquier otro `extendInfo` necesario) en el bloque `mac` de la configuración de `electron-builder`.
3. Configurar firma ad-hoc: `mac.identity: null` con `codesign` ad-hoc explícito (`--sign -`) según el mecanismo que soporte `electron-builder`, o un script de post-build que corra `codesign --deep --force --sign - <ruta-al-.app>` si el empaquetador no lo hace nativamente.
4. Agregar script `npm run build:mac` que genere el `.app` empaquetado y firmado.
5. Verificación manual en una Mac real: generar el build, mover/instalar el `.app` resultante (no correr vía `npm start`), abrir Octopus desde ahí, y repetir las pruebas de SPEC 09 (Go sobre varias charlas `.key` distintas, incluyendo archivos nunca antes tocados por Terminal) confirmando que no aparece más "operación no permitida" en el primer intento.
6. Si el paso 5 sigue fallando de forma intermitente, documentar el resultado y evaluar si hace falta escalar a notarización real (Apple Developer ID) en una spec posterior — no implementarlo en este spec sin antes confirmar que la firma ad-hoc no alcanza.

## Acceptance criteria

- [ ] Existe un script (`npm run build:mac` o equivalente) que genera un `.app` de macOS empaquetado y firmado (al menos ad-hoc) a partir del código fuente actual.
- [ ] El `.app` generado tiene `NSAppleEventsUsageDescription` configurado en su `Info.plist`.
- [ ] Corriendo el `.app` empaquetado (no `npm start`) en una Mac real, el flujo de "Go" sobre una charla `.key` nunca antes abierta funciona en el primer intento, sin necesitar el workaround de abrirla primero desde Terminal.
- [ ] El comportamiento de SPEC 09 para Windows y para extensiones no-`.key` en Mac no se ve afectado por este spec (el empaquetado es un cambio de packaging, no de lógica de negocio).
- [ ] Queda documentado (en el propio spec o en un README) el comando para generar el build de Mac, para que quien prepare las Macs del evento sepa cómo generarlo.

## Decisions

*(A completar durante la fase de refinamiento de este spec — Draft.)*

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La firma ad-hoc podría no ser suficiente para que macOS trate los permisos de forma consistente entre reinicios o entre Macs distintas (a diferencia de una firma con Developer ID real) | Aceptado como riesgo a validar en el paso 5/6 del plan; si no alcanza, se evalúa notarización real en spec futura. |
| Sin notarización, Gatekeeper puede mostrar una advertencia al abrir el `.app` por primera vez ("no se puede verificar el desarrollador"), requiriendo que el operador del kiosco lo autorice manualmente (clic derecho → Abrir, o Preferencias del Sistema → Seguridad) | Riesgo operativo aceptado, documentado para el operador del kiosco, igual que el riesgo ya aceptado en SPEC 09 sobre el permiso de Automatización. |
