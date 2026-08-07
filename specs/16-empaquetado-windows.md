# SPEC 16 — Empaquetado de la app Electron para Windows

> **Estado:** Approved
> **Depende de:** SPEC 10 (empaquetado-firma-macos), SPEC 15 (config-json-userdata)
> **Fecha:** 2026-08-06
> **Objetivo:** Empaquetar Octopus como un instalador `.exe` (NSIS, x64, sin firma de código) mediante `electron-builder`, análogo al `npm run build:mac` de SPEC 10, para poder distribuir e instalar la app en las PCs Windows de los kioscos de congresos sin depender de `npm start`.

## Scope

**Incluye:**

- Configurar el bloque `build.win` en `package.json` (junto al `build.mac` ya existente de SPEC 10) para generar un instalador NSIS x64.
- Target NSIS: instalador one-click (`oneClick: true`), sin wizard de opciones, instalación sin privilegios de administrador (`perMachine: false`, instala en `%LOCALAPPDATA%`).
- Icono `.ico` generado por `electron-builder` a partir de `references/assets/logo-mark-512.png` (recién agregado a esta spec), usado para el instalador, el `.exe` y los accesos directos que crea NSIS.
- Accesos directos estándar de NSIS (Escritorio y Menú Inicio) — comportamiento default del target `nsis`, sin configuración adicional.
- Agregar `electron-builder` como target adicional (ya está como devDependency desde SPEC 10, no se reinstala).
- Script `npm run build:win` (`electron-builder --win --x64`) que genera el `.exe` instalador en `dist/`.
- Documentar el comando de build de Windows (en el propio spec, análogo a SPEC 10) para quien prepare las PCs del evento.
- Verificación manual completa en esta misma PC Windows: generar el instalador, correrlo, confirmar que la app instalada arranca y funciona (lectura/escritura de `config.json` en `userData` por SPEC 15, descarga de presentaciones/imágenes, apertura de PowerPoint).

**Fuera de scope:**

- Firma de código para Windows (certificado `.pfx`) — sin firmar, análogo a la decisión de firma ad-hoc de SPEC 10 pero sin firma alguna acá; SmartScreen puede advertir al primer uso, riesgo aceptado y documentado.
- Soporte para `ia32` (32 bits) — solo `x64`.
- Notarización/certificación de ningún tipo.
- Auto-actualización (`electron-updater`) — mismo scope excluido que SPEC 10.
- Distribución/instalación automatizada (MDM, GPO, etc.) — este spec cubre solo generar el artefacto, no su despliegue en las PCs del evento.
- Cualquier cambio a la lógica de apertura de PowerPoint (SPEC 02) — este spec es puramente de packaging, no toca esa lógica.
- Migración/actualización de una instalación previa de Octopus en Windows corrida vía `npm start` — no existe ese caso hoy.

## Data model

Este spec no introduce estructuras de datos nuevas ni afecta `config.json`, el manifest de descargas, ni el `state` de la app — es puramente configuración de empaquetado.

**Cambios en `package.json`** (agregado junto al bloque `build.mac` existente):

```json
{
  "scripts": {
    "build:win": "electron-builder --win --x64"
  },
  "build": {
    "win": {
      "target": "nsis",
      "icon": "references/assets/logo-mark-512.png"
    },
    "nsis": {
      "oneClick": true,
      "perMachine": false
    }
  }
}
```

**Archivo nuevo:**

- `references/assets/logo-mark-512.png` — logo cuadrado 520×512 provisto por el usuario, fuente para el `.ico` generado por `electron-builder` (ya agregado al repo durante esta sesión de `/spec`).

## Implementation plan

1. Confirmar que `references/assets/logo-mark-512.png` está en el repo (agregado durante esta spec) y es válido como fuente de ícono (cuadrado, ≥256×256 — es 520×512). Verificación manual: abrir el archivo y confirmar dimensiones.
2. En `package.json`, agregar el bloque `build.win` (`target: "nsis"`, `icon: "references/assets/logo-mark-512.png"`) y el bloque `nsis` (`oneClick: true`, `perMachine: false`), junto al `build.mac` ya existente de SPEC 10, sin modificar este último. Verificación manual: `package.json` sigue siendo JSON válido y `npm run build:mac` (SPEC 10) sigue funcionando sin cambios.
3. Agregar el script `"build:win": "electron-builder --win --x64"` a la sección `scripts` de `package.json`, junto a `build:mac`. Verificación manual: `npm run build:win` corre sin errores de configuración (aunque falle más adelante por otro motivo, no debe fallar por config inválida).
4. Correr `npm run build:win` en esta PC Windows y confirmar que genera un instalador en `dist/` (ej. `dist/Octopus Setup 1.0.0.exe`), sin errores de `electron-builder`, y que el log no reporta el warning de resolución de ícono (ya resuelto con el logo de 512px). Verificación manual: revisar el log de build y confirmar la existencia del `.exe` generado.
5. Ejecutar el instalador generado en esta misma PC (fuera de la carpeta del repo), confirmar instalación one-click sin prompt de UAC (perMachine: false), y que crea accesos directos en Escritorio y Menú Inicio con el ícono del logo. Verificación manual: observar el instalador y los accesos directos creados.
6. Abrir Octopus desde el acceso directo instalado (no `npm start`) y confirmar el flujo básico: la app arranca, muestra el cronograma con datos reales (SPEC 03), `config.json` se inicializa en `userData` (SPEC 15) y es editable/guardable desde la pantalla `config`, y las descargas de presentaciones/imágenes (SPEC 05/14) funcionan. Verificación manual: recorrer Splash → Schedule → Session → Speaker y guardar un cambio de config.
7. Documentar en este spec (sección ya cubierta arriba) el comando `npm run build:win` como el equivalente Windows de `npm run build:mac`, para quien prepare las PCs del evento.

## Acceptance criteria

- [ ] Existe un script `npm run build:win` que genera un instalador `.exe` (NSIS, x64) a partir del código fuente actual.
- [ ] El build no requiere ninguna configuración adicional de firma de código — corre sin certificado `.pfx`.
- [ ] El instalador generado usa como ícono el derivado de `references/assets/logo-mark-512.png` (instalador, `.exe` y accesos directos).
- [ ] El instalador es one-click: no muestra wizard de opciones ni pide elegir carpeta de instalación.
- [ ] La instalación no requiere privilegios de administrador ni muestra prompt de UAC (`perMachine: false`).
- [ ] Tras instalar, existen accesos directos en Escritorio y Menú Inicio que abren la app.
- [ ] Corriendo la app instalada (no `npm start`), el flujo completo funciona: arranque, lectura/escritura de `config.json` en `userData` (SPEC 15), fetch de datos reales (SPEC 03), descarga de presentaciones e imágenes (SPEC 05/14), navegación Splash → Schedule → Session → Speaker.
- [ ] `npm run build:mac` (SPEC 10) sigue funcionando sin cambios de comportamiento tras agregar el bloque `build.win`.
- [ ] Queda documentado en este spec el comando para generar el build de Windows.

## Decisions

- **Sí:** target NSIS (instalador `.exe`) en vez de portable. Decisión explícita del usuario — instalador tradicional para distribuir a las PCs de los kioscos.
- **No:** target portable. Descartado por el usuario a favor de NSIS.
- **Sí:** sin firma de código para Windows (sin certificado `.pfx`). Análogo en espíritu a la firma ad-hoc de SPEC 10 en Mac (mínima fricción, sin cuenta/certificado pago), aunque acá es directamente sin firmar — SmartScreen puede advertir, riesgo aceptado.
- **No:** firma con certificado propio. Descartada por el usuario por no tener certificado disponible; se puede reconsiderar en spec futura si aparece uno.
- **Sí:** solo arquitectura `x64`. Cubre el hardware Windows moderno usado en kioscos; no se soporta `ia32`.
- **Sí:** instalador one-click, sin wizard de opciones. Decisión explícita del usuario — menor fricción para el operador del kiosco, consistente con la filosofía de simplicidad ya aplicada en SPEC 04/05/14/15.
- **Sí:** instalación sin privilegios de administrador (`perMachine: false`, instala en `%LOCALAPPDATA%`). Decisión explícita del usuario — evita depender de que la PC del evento tenga una sesión con admin disponible; consistente con SPEC 15, que ya asume que la app corre sin permisos elevados.
- **No:** instalación `perMachine: true` (Program Files, requiere UAC). Descartada por el usuario.
- **Sí:** ícono generado por `electron-builder` a partir de `references/assets/logo-mark-512.png` (520×512, provisto por el usuario durante esta sesión y agregado al repo), en vez de `logo-mark.png` (153×149), que está por debajo del mínimo recomendado (256×256) y generaría un `.ico` borroso.
- **No:** empaquetado como `dir` sin instalador (a diferencia de SPEC 10 en Mac, que usa `dir` para iterar rápido). En Windows se va directo a NSIS porque el instalador final es lo que se necesita distribuir; no hay un paso intermedio de "iterar rápido" pedido para esta spec.
- **Sí:** verificación manual de todo el plan en esta misma PC Windows (no en una PC de evento separada). Decisión explícita del usuario.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Sin firma de código, Windows SmartScreen puede mostrar "Windows protegió su PC" al primer intento de ejecutar el instalador o la app, requiriendo que el operador del kiosco haga clic en "Más información" → "Ejecutar de todas formas" | Riesgo operativo aceptado, documentado para el operador del kiosco, análogo al riesgo ya aceptado en SPEC 10 sobre la advertencia de Gatekeeper sin notarización en Mac. |
| El logo fuente (520×512, no perfectamente cuadrado) puede generar un `.ico` con márgenes o recorte leve al convertirse a las resoluciones estándar de Windows | Riesgo menor aceptado; se valida visualmente en el paso 5 del plan (accesos directos generados) y se puede ajustar el asset en una spec futura si el resultado no es aceptable. |
| Instalar sin privilegios de administrador (`perMachine: false`) coloca la app en `%LOCALAPPDATA%` del usuario que instala — si la PC del kiosco usa una cuenta de usuario distinta a la que la ejecuta durante el evento, el acceso directo/instalación no sería visible para esa otra cuenta | Riesgo operativo a tener en cuenta al preparar las PCs del evento: instalar con la misma cuenta de Windows que va a operar el kiosco. No se resuelve en código en esta spec. |
| `electron-builder` con targets `mac` y `win` configurados simultáneamente en el mismo `package.json` podría introducir algún conflicto de configuración no anticipado | Se valida explícitamente en el paso 2 del plan que `npm run build:mac` sigue funcionando sin cambios tras agregar el bloque `build.win`. |
