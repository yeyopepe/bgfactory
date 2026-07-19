---
name: ms-version
description: Genera una nueva versión del entregable del proyecto (incrementa en 1 la versión actual, sin relación con ningún código de change/fix, y ejecuta el build). Parte del framework ms-*. Trigger: /ms-version, o cuando el usuario pide generar/cortar/bump de una nueva versión o build del proyecto.
metadata:
  version: 1.1.0
---

# ms-version

Genera una nueva versión del entregable. El número de versión es un contador automático e independiente de cualquier código de change/fix: lo calcula e incrementa el propio `buildCommand` (lee `versionVariable` en `versionFilePath`, le suma 1 y guarda el resultado ahí mismo). Esta skill no calcula ni fija la versión — solo confirma con el usuario y ejecuta el build.

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` en la raíz del repo. El esquema completo está en [`../ms-init/schema.json`](../ms-init/schema.json) (léelo primero si no lo has hecho ya en esta sesión).

- Si no existe, o le falta el campo `framework.versioning`, no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí.
- Si `framework.versioning` es `false`, informa de que este proyecto no versiona entregables (decisión explícita tomada en `ms-init`) y no hagas nada más.
- Si `framework.versioning` es `true` pero falta alguno de `versionFilePath`, `versionVariable`, `buildCommand`, `buildOutputPath`, no continúes: dile al usuario que debe volver a ejecutar `ms-init` para completar esos campos, y detente ahí.

## 1. Ejecutar el build

Ejecuta `buildCommand` tal cual está configurado (respeta el shell que espera: `.ps1` vía PowerShell, `.sh` vía bash, etc.). El propio build se encarga de incrementar `versionVariable` en `versionFilePath` y de generar el entregable con la nueva versión.

## 2. Verificar el resultado

- Lee de nuevo `versionVariable` en `versionFilePath` para saber qué versión se generó (build.py ya la habrá incrementado).
- Comprueba que el fichero resuelto de `buildOutputPath` (sustituyendo `{version}` por ese valor) se ha generado.
- Si es razonablemente inspeccionable (HTML/texto), comprueba que el número de versión visible dentro coincide con el esperado.
- Si algo falla, repórtalo con el mensaje de error real del build — no lo des por hecho como éxito.

## 3. Confirmar al usuario

Indica la versión generada, la ruta del entregable y si la verificación fue correcta.
