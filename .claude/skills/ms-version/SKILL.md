---
name: ms-version
description: Genera una nueva versión del entregable del proyecto (incrementa en 1 la versión actual, sin relación con ningún código de change/fix, y ejecuta el build). Parte del framework ms-*. Trigger: /ms-version, o cuando el usuario pide generar/cortar/bump de una nueva versión o build del proyecto.
metadata:
  version: 1.2.0
  uses: []
---

# ms-version

Genera una nueva versión del entregable. El número de versión es un contador automático e independiente de cualquier código de change/fix: lo calcula e incrementa el propio `buildCommand` (lee `versionVariable` en `versionFilePath`, le suma 1 y guarda el resultado ahí mismo). Esta skill no calcula ni fija la versión — solo confirma con el usuario y ejecuta el build.

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` en la raíz del repo. El esquema completo está en [`../ms-init/schema.json`](../ms-init/schema.json) (léelo primero si no lo has hecho ya en esta sesión).

- Si no existe, o le falta el campo `framework.versioning`, no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí.

  ```
  Este proyecto todavía no tiene el framework `ms-*` inicializado (o le falta configuración). Ejecuta primero `/ms-init` antes de volver a invocarme.
  ```
- Si `framework.versioning` es `false`, informa de que este proyecto no versiona entregables (decisión explícita tomada en `ms-init`) y no hagas nada más.

  ```
  Este proyecto no versiona entregables (decisión tomada al inicializar el framework con `/ms-init`). No hay nada que generar aquí.
  ```
- Si `framework.versioning` es `true` pero falta alguno de `versionFilePath`, `versionVariable`, `buildCommand`, `buildOutputPath`, no continúes: dile al usuario que debe volver a ejecutar `ms-init` para completar esos campos, y detente ahí.

  ```
  Falta configuración de versionado en `.claude/ms-context.json` ({campos que faltan}). Ejecuta `/ms-init` para completarla antes de volver a invocarme.
  ```

## 1. Ejecutar el build

Ejecuta `buildCommand` tal cual está configurado (respeta el shell que espera: `.ps1` vía PowerShell, `.sh` vía bash, etc.). El propio build se encarga de incrementar `versionVariable` en `versionFilePath` y de generar el entregable con la nueva versión.

## 2. Verificar el resultado

La relectura de la versión y la comprobación del entregable las hace de forma determinista y gratis en tokens el script [`scripts/verify-build.py`](scripts/verify-build.py) (Python estándar, sin dependencias externas) — no las repitas a mano releyendo ficheros. Ejecuta desde la raíz del repo:

```
python .claude/skills/ms-version/scripts/verify-build.py
```

El script lee `versionFilePath`/`versionVariable`/`buildOutputPath` de `.claude/ms-context.json`, relee la versión ya incrementada por el build, resuelve la ruta de `buildOutputPath` sustituyendo `{version}`, comprueba que el fichero existe y, si es texto legible, que el string de versión aparece dentro. Imprime por stdout un único JSON: `{"version", "outputPath", "outputExists", "versionFoundInOutput"}` (`versionFoundInOutput` es `null` si el fichero no se pudo leer como texto, p.ej. un binario). Parsea ese JSON:

- Si `outputExists` es `false`, o `versionFoundInOutput` es `false`, el build no ha generado lo esperado — repórtalo como fallo, no lo des por hecho como éxito.
- Si el propio script termina con error (p.ej. no encuentra `versionVariable` en `versionFilePath`), repórtalo con su mensaje real.

## 3. Confirmar al usuario

Indica la versión generada, la ruta del entregable y si la verificación fue correcta.
