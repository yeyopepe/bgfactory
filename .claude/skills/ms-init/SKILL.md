---
name: ms-init
description: Inicializa el framework ms-* (change/fix/version/workflow) en el proyecto actual, generando .claude/ms-context.json con la configuración necesaria (rutas de carpetas/ficheros del proceso de tracking de cambios y versionado, más una sección libre con info del proyecto). Trigger: /ms-init, o cuando cualquier otra skill ms-* necesita .claude/ms-context.json y no existe (o le faltan campos), o cuando el usuario pide "montar"/"configurar" este framework en un proyecto nuevo.
metadata:
  version: 1.0.0
---

# ms-init

Pone en marcha el framework `ms-*` en el proyecto actual: crea (o completa) `.claude/ms-context.json`, el único fichero del que dependen `ms-workflow`, `ms-new`, `ms-fix`, `ms-implement` y `ms-version` para funcionar en cualquier repo sin tener nada hardcodeado.

Lee primero [`schema.json`](schema.json) si no lo has hecho ya en esta sesión — es un JSON Schema que define la forma exacta del fichero (secciones `framework` y `project`), con cada campo documentado en su `description` (obligatoriedad, para qué sirve, qué skill lo usa) y ejemplos completos en `examples`.

## 0. Revisar el entorno de desarrollo y las herramientas necesarias

Antes de tocar nada de `.claude/ms-context.json`, comprueba que las herramientas de línea de comandos de las que depende el framework `ms-*` están instaladas y funcionan. Este paso va primero porque de poco sirve dejar el framework configurado si luego `ms-new`/`ms-fix`/`ms-implement`/`ms-version` fallan por falta de una herramienta.

Herramientas base, siempre necesarias (las usa el framework en sí, independientemente del proyecto):

- **Git** — el repo ya es un repositorio git, pero comprueba que el CLI responde: `git --version`.
- **Python 3** — lo usa `ms-workflow` (invocado por `ms-new`/`ms-fix`) para calcular el código de cambio secuencial vía [`../ms-workflow/scripts/next-change-number.py`](../ms-workflow/scripts/next-change-number.py). Comprueba `python --version` o `python3 --version` (según qué alias resuelva en este sistema).

Herramientas condicionales — mira el repo (igual que en el paso 2 de exploración) para saber cuáles aplican antes de preguntar nada:

- Si hay `package.json` → Node/npm: `node --version`, `npm --version`.
- Si hay o va a haber un `buildCommand` en `.ps1` → PowerShell: `pwsh --version` (o `powershell` en Windows si no hay `pwsh`).
- Si hay o va a haber un `buildCommand` en `.sh`, o un `Makefile` → bash / make disponibles.
- Cualquier otro intérprete o CLI que el `buildCommand` que se configure más adelante (paso 3) vaya a necesitar — si en ese momento resulta ser una herramienta distinta a las ya comprobadas aquí, vuelve a verificarla puntualmente antes de darla por soportada.

Cómo comprobarlo: ejecuta los comandos de versión con la herramienta de shell del sistema (`Bash` o `PowerShell` según el `Platform`/`Shell` del entorno). Un comando que no existe o devuelve error de "no encontrado" cuenta como herramienta ausente.

Si falta alguna herramienta:

1. Informa al usuario con claridad qué falta y para qué la necesita el framework (usa la lista de arriba como referencia).
2. Propón cómo instalarla en su sistema operativo (p.ej. `winget install`/`choco install` en Windows, `brew install` en macOS, `apt install` en Linux) — sé específico con el paquete y el comando exacto propuesto.
3. **No instales nada sin confirmación explícita del usuario** — instalar software afecta al sistema fuera del repo. Pregunta antes (`AskUserQuestion` o confirmación directa) y, si acepta, ejecuta el comando de instalación con su ayuda.
4. Tras instalar, vuelve a comprobar la herramienta (repite el comando de versión) para verificar que quedó bien instalada y configurada (en el `PATH`, versión esperada, etc.) antes de continuar.
5. Si el usuario no quiere o no puede instalar algo ahora mismo, pregúntale explícitamente si prefiere continuar igualmente con la inicialización (dejando constancia de que esa parte del framework no funcionará hasta resolverlo) o detener el proceso aquí. No asumas por tu cuenta cuál prefiere.

Solo cuando las herramientas base estén disponibles (y las condicionales que ya se puedan determinar en este momento, o el usuario haya decidido explícitamente seguir sin ellas) continúa al paso 1.

## 1. Comprobar estado actual

- **Si `.claude/ms-context.json` no existe**: sigue el proceso normal desde el paso 2 (exploración + preguntas + escritura completa).
- **Si ya existe**, léelo y compáralo contra los campos obligatorios de [`schema.json`](schema.json) (`framework.changesDir`, `framework.versioning`, y si `versioning` es `true` también `versionFilePath`, `versionVariable`, `versionFormat`, `buildCommand` y `buildOutputPath`):
  - **Si no falta ningún campo obligatorio** (el framework ya está completamente inicializado): usa `AskUserQuestion` para preguntar al usuario si quiere re-inicializar el proyecto desde cero. Deja claro que eso borra el contexto actual (`framework` y `project`) y repite todo el proceso de preguntas como si no existiera. Si confirma, borra el contenido actual y continúa desde el paso 2. Si no confirma, no hagas nada más — el framework ya está listo tal cual está.
  - **Si falta algún campo obligatorio**: no repitas todo el cuestionario. Pregunta solo por lo que falta (paso 3, acotado a los campos ausentes) y en el paso 4 actualiza el fichero con merge, sin tocar lo que ya estaba configurado.

## 2. Explorar el repo en busca de pistas

Antes de preguntar en blanco, mira el repo para proponer valores por defecto razonables:

- Carpeta de cambios existente: `_changes`, `changes`, `CHANGELOG*`.
- Documento de arquitectura/diseño: algo bajo `docs/`, `design/`, o un `ARCHITECTURE.md`.
- Grafo de conocimiento del proyecto: `graphify-out/graph.json` (generado por la skill `graphify`) u otro fichero de grafo si el usuario lo indica.
- Carpeta raíz del código fuente: `src`, `app`, `lib`, o la que tenga más peso en el repo.
- Fichero de versión: `version.js`, `version.py`, `VERSION`, el campo `version` de `package.json`, etc.
- Script de build: `build.ps1`, `build.sh`, `Makefile`, script `build` en `package.json`.
- Tipo de proyecto, stack y propósito (mirando `package.json`, `README.md`, la estructura de carpetas) para la sección `project`.

## 3. Preguntar lo que falte

Usa `AskUserQuestion` cuando sea una decisión cerrada (p.ej. confirmar una ruta detectada, o si el proyecto versiona entregables o no); pregunta en texto libre lo que sea abierto (p.ej. nombre/resumen del proyecto).

Campos a resolver — sección `framework`:
- `changesDir` (obligatorio).
- `numberWidth` (opcional, por defecto `4`, no hace falta preguntar salvo que el usuario quiera algo distinto).
- `designDocPath` (opcional — pregunta si existe un doc de arquitectura a mantener sincronizado; si no, se omite).
- `projectGraphPath` (opcional — si detectas `graphify-out/graph.json` u otro grafo generado, propónlo; si no hay ninguno y el usuario no quiere generarlo ahora, se omite. Lo usa `ms-implement` como contexto).
- `sourcecodeDir` (opcional — propón la carpeta raíz del código fuente detectada; `ms-implement` la usa como contexto de respaldo cuando no hay `designDocPath` ni `projectGraphPath`).
- `versioning` (obligatorio, booleano) — pregunta primero si el proyecto genera versiones/entregables versionados. Si la respuesta es no, fija `versioning: false` y omite por completo el resto del grupo de versión. Si es sí, fija `versioning: true` y pregunta el grupo de versión — `versionFilePath`, `versionVariable`, `versionFormat`, `buildCommand`, `buildOutputPath` — completo.

Sección `project`: pregunta al usuario qué quiere dejar anotado sobre el proyecto (nombre, resumen, stack, convenciones relevantes para redactar documentación...). Es libre — si el usuario no quiere anotar nada, se deja `{}`.

## 4. Escribir el fichero

Crea `.claude/` si no existe. Escribe (o actualiza con merge, sin pisar campos ya presentes que el usuario no ha pedido cambiar) `.claude/ms-context.json` con la forma de [`schema.json`](schema.json).

## 5. Confirmar

Muestra un resumen de lo que ha quedado configurado (ruta del fichero, campos de `framework` resueltos, y si se ha dejado algo en `project`) y recuerda al usuario que puede volver a invocar esta skill para reconfigurar cualquier campo más adelante.

## 6. Generar el grafo si ya hay código

Si `sourcecodeDir` apunta a una carpeta que ya contiene código (esto no es un repo vacío recién creado), invoca la skill `ms-graph` (`Skill` con `skill: "ms-graph"`) para generar el grafo inicial ahora, en vez de dejarlo pendiente para la primera vez que otra skill lo necesite:

- Pásale como `rutaBase` el `sourcecodeDir` ya configurado.
- Si `projectGraphPath` quedó configurado en el paso 4, pásaselo como `rutaGraphJson`. Si no se configuró (el usuario no tenía grafo previo), propón uno por defecto (p.ej. `graph.json` en la raíz del repo) antes de invocar `ms-graph`; si el usuario lo acepta, añádelo a `framework.projectGraphPath` en `.claude/ms-context.json` con merge para que `ms-implement` lo recoja automáticamente en adelante.

Si no hay código todavía (proyecto recién creado) o el usuario prefiere no generarlo ahora, omite este paso sin más.
