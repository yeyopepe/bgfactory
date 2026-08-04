---
name: ms-init
description: Inicializa el framework ms-* (change/fix/workflow) en el proyecto actual, generando .claude/ms-context.json con la configuración necesaria (rutas de carpetas/ficheros del proceso de tracking de cambios, más una sección libre con info del proyecto). Trigger: /ms-init, o cuando cualquier otra skill ms-* necesita .claude/ms-context.json y no existe (o le faltan campos), o cuando el usuario pide "montar"/"configurar" este framework en un proyecto nuevo.
model: claude-sonnet-5
effort: medium
metadata:
  version: 1.5.1
  uses: []
---

# ms-init

Pone en marcha el framework `ms-*` en el proyecto actual: crea (o completa) `.claude/ms-context.json`, el único fichero del que dependen `ms-internal-workflow`, `ms-new`, `ms-fix`, `ms-how` y `ms-do` para funcionar en cualquier repo sin tener nada hardcodeado.

Lee primero [`schema.json`](schema.json) si no lo has hecho ya en esta sesión — es un JSON Schema que define la forma exacta del fichero (secciones `framework` y `project`), con cada campo documentado en su `description` (obligatoriedad, para qué sirve, qué skill lo usa) y ejemplos completos en `examples`.

## 0. Revisar el entorno de desarrollo y las herramientas necesarias

Antes de tocar nada de `.claude/ms-context.json`, comprueba que las herramientas de línea de comandos de las que depende el framework `ms-*` están instaladas y funcionan. Este paso va primero porque de poco sirve dejar el framework configurado si luego `ms-new`/`ms-fix`/`ms-how`/`ms-do` fallan por falta de una herramienta.

Herramientas base, siempre necesarias (las usa el framework en sí, independientemente del proyecto):

- **Git** — el repo ya es un repositorio git, pero comprueba que el CLI responde: `git --version`.
- **Python 3** — lo usa `ms-internal-workflow` (invocado por `ms-new`/`ms-fix`) para calcular el código de cambio secuencial vía [`../ms-internal-workflow/scripts/next-change-number.py`](../ms-internal-workflow/scripts/next-change-number.py). Comprueba `python --version` o `python3 --version` (según qué alias resuelva en este sistema).

Herramientas condicionales — mira el repo (igual que en el paso 2 de exploración) para saber cuáles aplican antes de preguntar nada:

- Si hay `package.json` → Node/npm: `node --version`, `npm --version`.
- Cualquier otro intérprete o CLI relevante para el tipo de proyecto que detectes — si resulta ser una herramienta distinta a las ya comprobadas aquí, vuelve a verificarla puntualmente antes de darla por soportada.

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
- **Si ya existe**, la comparación contra los campos obligatorios de [`schema.json`](schema.json) la hace de forma determinista y gratis en tokens el script [`scripts/check-context.py`](scripts/check-context.py) (Python estándar, sin dependencias externas) — no la hagas a ojo comparando contra el schema. Ejecuta desde la raíz del repo:

  ```
  python .claude/skills/ms-init/scripts/check-context.py
  ```

  Imprime por stdout un único JSON `{"exists", "hasFramework", "missingRequired", "complete"}`. Parsea ese JSON para lo siguiente:
  - **Si no falta ningún campo obligatorio** (el framework ya está completamente inicializado): usa `AskUserQuestion` para preguntar al usuario si quiere re-inicializar el proyecto desde cero. Deja claro que eso borra el contexto actual (`framework` y `project`) y repite todo el proceso de preguntas como si no existiera. Si confirma, borra el contenido actual y continúa desde el paso 2. Si no confirma, no hagas nada más — el framework ya está listo tal cual está.

    ```
    El framework `ms-*` ya está inicializado en este proyecto. ¿Quieres reinicializarlo desde cero? Esto borra la configuración actual (`framework` y `project`) de `.claude/ms-context.json` y repite todas las preguntas como si no existiera.
    ```
  - **Si `missingRequired` no está vacío**: no repitas todo el cuestionario. Pregunta solo por los campos listados en `missingRequired` (paso 3, acotado a esos) y en el paso 4 actualiza el fichero con merge, sin tocar lo que ya estaba configurado.

## 2. Explorar el repo en busca de pistas

Antes de preguntar en blanco, mira el repo para proponer valores por defecto razonables:

- Carpeta de cambios existente: `_changes`, `changes`, `CHANGELOG*`.
- Documento de arquitectura/diseño: algo bajo `docs/`, `design/`, o un `ARCHITECTURE.md`.
- Documento de listado de funcionalidades: algo bajo `docs/`, `design/`, o un `FEATURES.md`.
- Guía de estilo (visual/interacción/redacción): algo bajo `docs/`, `design/`, o un `STYLE_BIBLE.md`.
- Carpeta raíz del código fuente: `src`, `app`, `lib`, o la que tenga más peso en el repo.
- Tipo de proyecto, stack y propósito (mirando `package.json`, `README.md`, la estructura de carpetas) para la sección `project`.

## 3. Preguntar lo que falte

Usa `AskUserQuestion` cuando sea una decisión cerrada (p.ej. confirmar una ruta detectada, o si el proyecto versiona entregables o no); pregunta en texto libre lo que sea abierto (p.ej. nombre/resumen del proyecto).

Campos a resolver — sección `framework`:
- `changesDir` (obligatorio).
- `numberWidth` (opcional, por defecto `4`, no hace falta preguntar salvo que el usuario quiera algo distinto).
- `docs.functional.featuresDocPath` (opcional — pregunta si quiere que `ms-do` mantenga un listado de funcionalidades implementadas, y en qué ruta; si no, se omite. Se crea vacío la primera vez que `ms-do` lo necesite).
- `docs.tech.architectureDocPath` y `docs.tech.styleBibleDocPath` (ambos obligatorios — pregunta si el usuario ya tiene un doc de arquitectura y/o una guía de estilo que mantener sincronizados):
  - Si el usuario ya tiene alguno de los dos (o lo has detectado en el paso 2), usa esa ruta tal cual.
  - Si al usuario **le falta alguno de los dos** (no tiene ese documento técnico todavía), no lo generes a ciegas: hazle estas preguntas básicas en texto libre antes de crearlo (solo las que hagan falta según qué documento falte):
    1. ¿De qué va el proyecto?
    2. ¿Qué tecnologías quieres usar?
    3. ¿Qué estilo tendrá o a qué se parecerá?

    Con las respuestas, genera una **primera versión reducida** (no una documentación completa) de cada documento que falte:
    - Arquitectura (por defecto `design/docs/ARCHITECTURE.md`): resumen del proyecto (respuesta 1) y stack/tecnologías elegidas (respuesta 2), como punto de partida mínimo que `ms-do` irá ampliando con cada cambio implementado.
    - Guía de estilo (por defecto `design/docs/STYLE_BIBLE.md`): a partir de la respuesta 3 sobre estilo/referencias; si el usuario no da detalles suficientes para definir una paleta, cae en la paleta neutra en blanco, negro y tonos de grises ya prevista por defecto.

    Si alguna de estas preguntas ya se ha respondido al recoger la sección `project` (más abajo), no la repitas — reutiliza esa respuesta.
    Deja claro al usuario que son versiones iniciales mínimas y que se irán enriqueciendo con cada `ms-do`.
- `sourcecodeDir` (opcional — propón la carpeta raíz del código fuente detectada; `ms-how` la usa como contexto de respaldo cuando no hay `docs.tech.architectureDocPath`).

Sección `project`: pregunta al usuario qué quiere dejar anotado sobre el proyecto (nombre, resumen, stack, convenciones relevantes para redactar documentación...). Es libre — si el usuario no quiere anotar nada, se deja `{}`.

## 4. Escribir el fichero

Crea `.claude/` si no existe. Escribe (o actualiza con merge, sin pisar campos ya presentes que el usuario no ha pedido cambiar) `.claude/ms-context.json` con la forma de [`schema.json`](schema.json).

## 5. Confirmar

Muestra un resumen de lo que ha quedado configurado (ruta del fichero, campos de `framework` resueltos, y si se ha dejado algo en `project`) y recuerda al usuario que puede volver a invocar esta skill para reconfigurar cualquier campo más adelante.
