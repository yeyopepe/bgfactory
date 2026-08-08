---
name: ms-init
description: Inicializa el framework ms-* (change/fix/workflow) en el proyecto actual, generando el puntero fijo .claude/ms-context.json (solo workFolder) y {workFolder}/framework/context.json con la configuración necesaria (rutas de carpetas/ficheros del proceso de tracking de cambios, más una sección libre con info del proyecto). Trigger: /ms-init, o cuando cualquier otra skill ms-* necesita esta configuración y no existe (o le faltan campos), o cuando el usuario pide "montar"/"configurar" este framework en un proyecto nuevo.
model: claude-sonnet-5
effort: medium
metadata:
  version: 2.0.0
  uses: []
---

# ms-init

Pone en marcha el framework `ms-*` en el proyecto actual: crea (o completa) los dos ficheros de configuración de los que dependen `ms-internal-workflow`, `ms-new`, `ms-fix`, `ms-how` y `ms-do` para funcionar en cualquier repo sin tener nada hardcodeado:

1. **`.claude/ms-context.json`** — puntero FIJO, siempre en esta misma ruta (junto al resto de `.claude/`, que es la carpeta genérica del framework, reutilizable entre proyectos). Contiene únicamente `workFolder`. Existe para que cualquier skill pueda localizar el fichero 2 sin depender de conocer `workFolder` de antemano (evita la dependencia circular de tener que leer un fichero dentro de `workFolder` para saber dónde está `workFolder`).
2. **`{workFolder}/framework/context.json`** — el fichero real de configuración, específico de este proyecto (`framework.*`, `project`, `skillModels`). Vive dentro de `workFolder` porque es contenido propio del proyecto, no del framework genérico — junto a él, en la misma carpeta `{workFolder}/framework/`, vive también `how-to-compile-version.md` (lo gestiona `ms-version`).

Lee primero, si no lo has hecho ya en esta sesión:
- [`schema.json`](schema.json) — JSON Schema del puntero (fichero 1): solo `workFolder`.
- [`context.schema.json`](context.schema.json) — JSON Schema del fichero de contenido (fichero 2): secciones `framework` y `project`, con cada campo documentado en su `description` (obligatoriedad, para qué sirve, qué skill lo usa) y ejemplos completos en `examples`.
- [`context.template.json`](context.template.json) — esqueleto mínimo válido del fichero de contenido (`{"framework": {}}`), punto de partida al crearlo por primera vez.

## 0. Revisar el entorno de desarrollo y las herramientas necesarias

Antes de tocar nada de la configuración, comprueba que las herramientas de línea de comandos de las que depende el framework `ms-*` están instaladas y funcionan. Este paso va primero porque de poco sirve dejar el framework configurado si luego `ms-new`/`ms-fix`/`ms-how`/`ms-do` fallan por falta de una herramienta.

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

La comparación contra los campos obligatorios de [`context.schema.json`](context.schema.json) la hace de forma determinista y gratis en tokens el script [`scripts/check-context.py`](scripts/check-context.py) (Python estándar, sin dependencias externas) — no la hagas a ojo comparando contra el schema. Ejecuta desde la raíz del repo:

```
python .claude/skills/ms-init/scripts/check-context.py
```

Imprime por stdout un único JSON `{"pointerExists", "workFolder", "contextPath", "contextExists", "hasFramework", "missingRequired", "complete"}`. `framework` ya no tiene ningún campo con `required: true` en `context.schema.json`, así que `missingRequired` siempre viene vacío — `complete` refleja simplemente si el puntero existe, `{workFolder}/framework/context.json` existe, y su sección `framework` existe. Para saber qué opcionales faltan por configurar, lee tú mismo `{workFolder}/framework/context.json` (ruta que te da `contextPath`) y compáralo campo a campo contra las propiedades de `framework` en `context.schema.json` (`docs.tech.architectureDocDir`, `docs.tech.styleBibleDocDir`, `docs.functional.featuresDocPathDir`, `sourcecodeDir`, `skillModels`) para construir tu propia lista de "opcionales sin configurar". Con ambas listas (`missingRequired` del script + opcionales sin configurar detectados por ti):

- **Si `pointerExists` es `false`**: no hay nada que preservar — sigue el proceso normal desde el paso 2 (exploración + preguntas + escritura completa de ambos ficheros).
- **Si `pointerExists` es `true` pero `contextExists` es `false`**: ya se conoce `workFolder` (reutilízalo, no lo vuelvas a preguntar salvo que el usuario quiera cambiarlo) pero falta crear el fichero de contenido — sigue el proceso normal desde el paso 2, acotando el paso 3 a las secciones `framework`/`project`/`skillModels` (el `workFolder` ya está resuelto).
- **Si `complete` es `true` y no hay opcionales sin configurar**: usa `AskUserQuestion` para preguntar al usuario si quiere re-inicializar el proyecto desde cero. Deja claro que eso borra la configuración actual (`workFolder` del puntero, y `framework`/`project` del fichero de contenido) y repite todo el proceso de preguntas como si no existiera. Si confirma, borra el contenido actual de ambos ficheros y continúa desde el paso 2. Si no confirma, no hagas nada más — el framework ya está listo tal cual está.

  ```
  El framework `ms-*` ya está inicializado en este proyecto. ¿Quieres reinicializarlo desde cero? Esto borra la configuración actual (.claude/ms-context.json y {workFolder}/framework/context.json) y repite todas las preguntas como si no existiera.
  ```
- **Si `complete` es `false`** (existe el puntero y el fichero de contenido, pero a este último le falta la sección `framework`): sigue el proceso normal desde el paso 2 — no hay nada que preservar con merge en `framework`/`project`.
- **Si `complete` es `true` pero hay opcionales sin configurar** (p.ej. el usuario inicializó una vez solo confirmando `workFolder` y declinó lo demás): no ofrezcas el reinicio destructivo de entrada. Pregunta primero con `AskUserQuestion` si quiere completar/revisar esos campos opcionales concretos (listándolos) o prefiere dejarlo como está; solo si pide explícitamente reiniciar todo desde cero, sigue la rama de arriba. Si quiere completar, ve al paso 3 acotado a esos campos y actualiza en el paso 4 con merge, igual que con campos que faltaran.

## 2. Explorar el repo en busca de pistas

Antes de preguntar en blanco, mira el repo para proponer valores por defecto razonables:

- Carpeta de cambios existente: `_changes`, `changes`, `CHANGELOG*`.
- Documento de arquitectura/diseño: una carpeta con `INDEX.md` bajo `docs/`, `design/` (convención actual), o un `ARCHITECTURE.md`/`design_technical.md` suelto (convención antigua, migrable).
- Documento de listado de funcionalidades: algo bajo `docs/`, `design/`, o un `FEATURES.md`.
- Guía de estilo (visual/interacción/redacción): una carpeta con `INDEX.md` bajo `docs/`, `design/` (convención actual), o un `STYLE_BIBLE.md` suelto (convención antigua, migrable).
- Carpeta raíz del código fuente: `src`, `app`, `lib`, o la que tenga más peso en el repo.
- Tipo de proyecto, stack y propósito (mirando `package.json`, `README.md`, la estructura de carpetas) para la sección `project`.

## 3. Preguntar lo que falte

Primero `workFolder` (fichero 1, el puntero), luego el resto de `framework` (fichero 2) descrito en `context.schema.json`, sección por sección — ninguno se da por hecho ni se deja sin resolver en silencio: los obligatorios se preguntan siempre, los opcionales se preguntan o se confirman explícitamente (aunque la respuesta más habitual sea "usa el default"), y solo los de puro ajuste fino (ver más abajo) pueden asumir su default sin preguntar. Usa `AskUserQuestion` para cualquier decisión cerrada (confirmar una ruta detectada, elegir entre opciones, sí/no); texto libre para lo abierto (nombre/resumen del proyecto, estilo deseado).

`workFolder` (puntero — opcional, por defecto `"/"`, pero pregúntalo/confírmalo siempre — no lo des por supuesto en silencio, igual que `sourcecodeDir`): es la única ruta que el usuario elige para todo el trabajo del framework. Propón `"/"` (raíz del repo) como opción recomendada; si el repo ya tiene una carpeta de cambios existente detectada en el paso 2 (`_changes`, `changes`...) y no coincide con la raíz, coméntaselo al usuario y ofrece migrar su contenido a `{workFolder}/changes/` en vez de crear ambas cosas por separado. Dentro de `workFolder`, las subcarpetas `changes/`, `versions/` y `framework/` son siempre de nombre fijo — no se preguntan ni se configuran, las crean las skills correspondientes (o esta misma skill, para `framework/context.json`) la primera vez que hacen falta. Si ya existe el puntero de una ejecución anterior de `ms-init`, no vuelvas a preguntar `workFolder` salvo que el usuario pida explícitamente cambiarlo — cambiarlo implica mover `{workFolder anterior}/framework/context.json` (y `changes/`, `versions/` si ya tienen contenido) a la nueva ubicación; coméntaselo al usuario y pide confirmación antes de mover nada.

Campos a resolver — sección `framework` (fichero 2):
- `docs.tech.architectureDocDir` y `docs.tech.styleBibleDocDir` (opcionales, pero pregúntalos siempre explícitamente — no los des por omitidos sin más, a diferencia de `numberWidth`/`mockupsSkill`: la calidad de todo el análisis técnico del framework depende de que existan). Pregunta si el usuario quiere mantener sincronizados un documento de arquitectura y/o una guía de estilo:
  - Si el usuario **ya tiene alguno de los dos como carpeta** con `INDEX.md` (o lo has detectado en el paso 2), usa esa ruta tal cual.
  - Si el usuario tiene alguno de los dos en la **convención antigua** (fichero único, p.ej. `ARCHITECTURE.md`/`STYLE_BIBLE.md`), ofrece migrarlo: crea la carpeta con un `INDEX.md` que resuma el fichero y un único fichero de contenido (`01-contenido.md` o similar) con el resto, y borra el fichero suelto.
  - Si al usuario **le falta alguno de los dos** y quiere que se genere, no lo generes a ciegas: hazle estas preguntas básicas en texto libre antes de crearlo (solo las que hagan falta según qué documento falte):
    1. ¿De qué va el proyecto?
    2. ¿Qué tecnologías quieres usar?
    3. ¿Qué estilo tendrá o a qué se parecerá?

    Con las respuestas, genera una **primera versión reducida** (no una documentación completa) de cada documento que falte, como carpeta con `INDEX.md` + un único fichero de contenido:
    - Arquitectura (por defecto `design/docs/architecture/`): `INDEX.md` con una tabla-índice mínima (un solo fichero hermano por ahora) y `01-overview.md` con el resumen del proyecto (respuesta 1) y stack/tecnologías elegidas (respuesta 2), como punto de partida mínimo que `ms-do` irá ampliando (nuevos ficheros numerados) con cada cambio implementado.
    - Guía de estilo (por defecto `design/docs/style/`): mismo patrón `INDEX.md` + `01-overview.md`, a partir de la respuesta 3 sobre estilo/referencias; si el usuario no da detalles suficientes para definir una paleta, cae en la paleta neutra en blanco, negro y tonos de grises ya prevista por defecto.

    Si alguna de estas preguntas ya se ha respondido al recoger la sección `project` (más abajo), no la repitas — reutiliza esa respuesta.
    Deja claro al usuario que son versiones iniciales mínimas y que se irán enriqueciendo con cada `ms-do`.
  - Si el usuario **decide explícitamente no configurar uno de los dos (o ninguno)** ahora mismo, respeta esa decisión y deja el campo sin definir — el resto de skills lo tratan como opcional y lo omiten sin preguntar nada. No insistas ni lo generes por tu cuenta.
- `docs.functional.featuresDocPathDir` (opcional — pregunta si quiere que `ms-do` mantenga un listado de funcionalidades implementadas, y en qué ruta; si no, se omite. Se crea vacío la primera vez que `ms-do` lo necesite).
- `sourcecodeDir` (opcional pero pregúntalo/confírmalo siempre — no lo des por supuesto en silencio): propón la carpeta raíz del código fuente detectada en el paso 2 y pide confirmación con `AskUserQuestion` (o el nombre correcto si la detección falló). La usa `ms-how` como contexto de respaldo cuando no hay `docs.tech.architectureDocDir`.
- `numberWidth` (opcional, por defecto `4`, no hace falta preguntar salvo que el usuario quiera algo distinto).
- `mockupsSkill` (opcional, por defecto `ms-internal-mockups-html`, no hace falta preguntar salvo que el usuario quiera usar otra skill/tecnología para generar las maquetas `design_*.html` de `ms-new`/`ms-fix`).

Sección `skillModels` (opcional, fuera de `framework`, en el fichero 2) — menciónala siempre aunque sea brevemente, no la omitas en silencio: pregunta si el usuario quiere fijar de entrada un modelo/esfuerzo distinto del propio de cada `SKILL.md` para alguna skill `ms-*` (p.ej. bajar a Haiku las más mecánicas como `ms-status`/`ms-todo`, o subir el esfuerzo de `ms-do`). Si no quiere tocar nada ahora, omite la sección entera — el valor por defecto es el que ya trae cada `SKILL.md` en su propio frontmatter. Si configura algo, recuerda al usuario en el paso 5 que debe ejecutar `python .claude/skills/ms-init/scripts/sync-skill-models.py` para que el cambio tenga efecto real (esta sección por sí sola no basta, ver su `description` en `context.schema.json`).

Sección `project` (fichero 2): pregunta al usuario qué quiere dejar anotado sobre el proyecto (nombre, resumen, stack, convenciones relevantes para redactar documentación...). Es libre — si el usuario no quiere anotar nada, se deja `{}`. Cualquier respuesta dada de pasada en preguntas anteriores (p.ej. si el proyecto versiona entregables, o detalles de stack ya mencionados) que no tenga campo propio en `framework` debe capturarse aquí, no descartarse.

## 4. Escribir los ficheros

1. Crea `.claude/` si no existe. Escribe (o actualiza con merge, sin pisar un `workFolder` ya presente que el usuario no ha pedido cambiar) `.claude/ms-context.json` con la forma de [`schema.json`](schema.json): únicamente `{"workFolder": "..."}`.
2. Crea `{workFolder}/framework/` si no existe. Escribe (o actualiza con merge, sin pisar campos ya presentes que el usuario no ha pedido cambiar) `{workFolder}/framework/context.json`, partiendo de [`context.template.json`](context.template.json) si es la primera vez, con la forma de [`context.schema.json`](context.schema.json) — mismos nombres de campo, sin propiedades fuera de las que declara el schema (`additionalProperties: false` en cada nivel).

## 5. Verificar y confirmar

Antes de dar la inicialización por terminada:

1. Vuelve a ejecutar `python .claude/skills/ms-init/scripts/check-context.py` y comprueba que devuelve `"complete": true`. Si no es así, algo se escribió mal (p.ej. la sección `framework` quedó vacía, o alguno de los dos ficheros no se llegó a escribir) — corrígelo antes de continuar, no lo des por bueno sin comprobarlo.
2. Si `docs.tech.architectureDocDir`/`docs.tech.styleBibleDocDir` se configuraron con generación de contenido mínimo, confirma que la carpeta y sus dos ficheros (`INDEX.md` + `01-overview.md`) existen de verdad en disco.
3. Si `docs.functional.featuresDocPathDir` se configuró, no hace falta crear nada todavía (se crea vacío la primera vez que `ms-do` lo necesite) — solo confirma que el valor quedó guardado en el JSON.

Muestra al usuario un resumen completo de lo que ha quedado configurado: ruta de ambos ficheros (`.claude/ms-context.json` y `{workFolder}/framework/context.json`), `workFolder` resuelto, cada campo de `framework` resuelto (incluidos los que se dejaron sin configurar y por qué), si se definió algo en `skillModels` (con el recordatorio de ejecutar `sync-skill-models.py` si aplica), y si se ha dejado algo en `project`. Recuerda al usuario que puede volver a invocar esta skill para reconfigurar cualquier campo más adelante.
