---
name: ms-version
description: Genera una nueva versión del entregable del proyecto hasta el último change/fix aplicado (fija la versión en el fichero de versión configurado y ejecuta el build). Parte del framework ms-*. Trigger: /ms-version, o cuando el usuario pide generar/cortar/bump de una nueva versión o build del proyecto.
metadata:
  version: 1.0.0
---

# ms-version

Genera una nueva versión del entregable, hasta el `xxxx` (código de cambio/fix) más reciente **implementado** en el proyecto, o hasta el `xxxx` que se le pase explícitamente (p.ej. cuando la invoca la skill `ms-implement` justo después de implementar y mover una entrada a `{changesDir}/implemented`).

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` en la raíz del repo. El esquema completo está en [`../ms-init/schema.json`](../ms-init/schema.json) (léelo primero si no lo has hecho ya en esta sesión).

- Si no existe, o le falta el campo `framework.versioning`, no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí.
- Si `framework.versioning` es `false`, informa de que este proyecto no versiona entregables (decisión explícita tomada en `ms-init`) y no hagas nada más.
- Si `framework.versioning` es `true` pero falta alguno de `versionFilePath`, `versionVariable`, `versionFormat`, `buildCommand`, `buildOutputPath`, no continúes: dile al usuario que debe volver a ejecutar `ms-init` para completar esos campos, y detente ahí.

## 1. Determinar el `xxxx` objetivo

- Si se ha invocado con un `xxxx` explícito, usa ese.
- Si no, calcúlalo como el número más alto entre las subcarpetas numéricas de `{changesDir}/implemented` (el último change/fix ya implementado). Si esa carpeta no existe o está vacía, avisa al usuario de que no hay ningún cambio implementado todavía y pregunta cómo proceder en vez de asumir un valor — un `xxxx` que sigue en `{changesDir}/inProgress` (documentado pero no implementado) no es válido como objetivo de versión.

Resuelve el valor de versión aplicando `versionFormat` (sustituyendo `{xxxx}`), p.ej. `v{xxxx}` + `0001` → `v0001`.

## 1.1 Pedir confirmación

Antes de tocar nada, usa `AskUserQuestion` para confirmar explícitamente con el usuario que quiere generar esta versión ahora, mostrándole el `xxxx` objetivo y el valor de versión resuelto (p.ej. `v0001`).

- Si confirma, ve al paso 2.
- Si no confirma, no hagas nada más: no se toca `versionFilePath` ni se ejecuta el build.

## 2. Fijar la versión

Edita `versionFilePath` y fija `versionVariable` al valor de versión resuelto en el paso 1, respetando la sintaxis del lenguaje del fichero (no asumas JavaScript si el fichero es de otro tipo — mira su contenido actual antes de editar).

## 3. Ejecutar el build

Ejecuta `buildCommand` tal cual está configurado (respeta el shell que espera: `.ps1` vía PowerShell, `.sh` vía bash, etc.).

## 4. Verificar el resultado

- Comprueba que el fichero resuelto de `buildOutputPath` (sustituyendo `{version}` por el valor de versión) se ha generado.
- Si es razonablemente inspeccionable (HTML/texto), comprueba que el número de versión visible dentro coincide con el esperado.
- Si algo falla, repórtalo con el mensaje de error real del build — no lo des por hecho como éxito.

## 5. Confirmar al usuario

Indica la versión generada, la ruta del entregable y si la verificación fue correcta.
