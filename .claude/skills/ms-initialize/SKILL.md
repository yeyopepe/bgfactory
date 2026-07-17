---
name: ms-initialize
description: Inicializa el framework ms-* (change/fix/version/workflow) en el proyecto actual, generando .claude/ms-context.json con la configuración necesaria (rutas de carpetas/ficheros del proceso de tracking de cambios y versionado, más una sección libre con info del proyecto). Trigger: /ms-initialize, o cuando cualquier otra skill ms-* necesita .claude/ms-context.json y no existe (o le faltan campos), o cuando el usuario pide "montar"/"configurar" este framework en un proyecto nuevo.
metadata:
  version: 1.0.0
---

# ms-initialize

Pone en marcha el framework `ms-*` en el proyecto actual: crea (o completa)
`.claude/ms-context.json`, el único fichero del que dependen `ms-workflow`,
`ms-change`, `ms-fix`, `ms-implement` y `ms-version` para funcionar en
cualquier repo sin tener nada hardcodeado.

Lee primero [`schema.json`](schema.json) si no lo has hecho ya en esta
sesión — es un JSON Schema que define la forma exacta del fichero
(secciones `framework` y `project`), con cada campo documentado en su
`description` (obligatoriedad, para qué sirve, qué skill lo usa) y ejemplos
completos en `examples`.

## 0. Comprobar estado actual

- **Si `.claude/ms-context.json` no existe**: sigue el proceso normal desde
  el paso 1 (exploración + preguntas + escritura completa).
- **Si ya existe**, léelo y compáralo contra los campos obligatorios de
  [`schema.json`](schema.json) (`framework.changesDir`,
  `framework.versioning`, y si `versioning` es `true` también
  `versionFilePath`, `versionVariable`, `versionFormat`, `buildCommand` y
  `buildOutputPath`):
  - **Si no falta ningún campo obligatorio** (el framework ya está
    completamente inicializado): usa `AskUserQuestion` para preguntar al
    usuario si quiere re-inicializar el proyecto desde cero. Deja claro que
    eso borra el contexto actual (`framework` y `project`) y repite todo el
    proceso de preguntas como si no existiera. Si confirma, borra el
    contenido actual y continúa desde el paso 1. Si no confirma, no hagas
    nada más — el framework ya está listo tal cual está.
  - **Si falta algún campo obligatorio**: no repitas todo el cuestionario.
    Pregunta solo por lo que falta (paso 2, acotado a los campos ausentes)
    y en el paso 3 actualiza el fichero con merge, sin tocar lo que ya
    estaba configurado.

## 1. Explorar el repo en busca de pistas

Antes de preguntar en blanco, mira el repo para proponer valores por
defecto razonables:

- Carpeta de cambios existente: `_changes`, `changes`, `CHANGELOG*`.
- Documento de arquitectura/diseño: algo bajo `docs/`, `design/`, o un
  `ARCHITECTURE.md`.
- Grafo de conocimiento del proyecto: `graphify-out/graph.json` (generado
  por la skill `graphify`) u otro fichero de grafo si el usuario lo indica.
- Carpeta raíz del código fuente: `src`, `app`, `lib`, o la que tenga más
  peso en el repo.
- Fichero de versión: `version.js`, `version.py`, `VERSION`, el campo
  `version` de `package.json`, etc.
- Script de build: `build.ps1`, `build.sh`, `Makefile`, script `build` en
  `package.json`.
- Tipo de proyecto, stack y propósito (mirando `package.json`, `README.md`,
  la estructura de carpetas) para la sección `project`.

## 2. Preguntar lo que falte

Usa `AskUserQuestion` cuando sea una decisión cerrada (p.ej. confirmar una
ruta detectada, o si el proyecto versiona entregables o no); pregunta en
texto libre lo que sea abierto (p.ej. nombre/resumen del proyecto).

Campos a resolver — sección `framework`:
- `changesDir` (obligatorio).
- `numberWidth` (opcional, por defecto `4`, no hace falta preguntar salvo
  que el usuario quiera algo distinto).
- `designDocPath` (opcional — pregunta si existe un doc de arquitectura a
  mantener sincronizado; si no, se omite).
- `projectGraphPath` (opcional — si detectas `graphify-out/graph.json` u
  otro grafo generado, propónlo; si no hay ninguno y el usuario no quiere
  generarlo ahora, se omite. Lo usa `ms-implement` como contexto).
- `sourcecodeDir` (opcional — propón la carpeta raíz del código fuente
  detectada; `ms-implement` la usa como contexto de respaldo cuando no hay
  `designDocPath` ni `projectGraphPath`).
- `versioning` (obligatorio, booleano) — pregunta primero si el proyecto
  genera versiones/entregables versionados. Si la respuesta es no, fija
  `versioning: false` y omite por completo el resto del grupo de versión.
  Si es sí, fija `versioning: true` y pregunta el grupo de versión —
  `versionFilePath`, `versionVariable`, `versionFormat`, `buildCommand`,
  `buildOutputPath` — completo.

Sección `project`: pregunta al usuario qué quiere dejar anotado sobre el
proyecto (nombre, resumen, stack, convenciones relevantes para redactar
documentación...). Es libre — si el usuario no quiere anotar nada, se deja
`{}`.

## 3. Escribir el fichero

Crea `.claude/` si no existe. Escribe (o actualiza con merge, sin pisar
campos ya presentes que el usuario no ha pedido cambiar)
`.claude/ms-context.json` con la forma de [`schema.json`](schema.json).

## 4. Confirmar

Muestra un resumen de lo que ha quedado configurado (ruta del fichero,
campos de `framework` resueltos, y si se ha dejado algo en `project`) y
recuerda al usuario que puede volver a invocar esta skill para
reconfigurar cualquier campo más adelante.
