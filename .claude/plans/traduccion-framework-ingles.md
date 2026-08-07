# Plan — Traducir el framework `ms-*` al inglés + idioma configurable

## Contexto

Todo el framework `ms-*` (`.claude/skills/ms-*`, `.claude/ms-guide.md`, `.claude/ms-design.md`, plantillas y scripts) está escrito en español: instrucciones de cada `SKILL.md`, mensajes al usuario, plantillas de documentos (`description.template.md`, `PLAN.template.md`, `FEATURES.template.md`, `STATUS*.template.md`) y buena parte de los scripts Python (comentarios, docstrings, nombres de placeholder tipo `código`/`nombre`/`fecha`).

El objetivo es doble:

1. **Traducir todo el framework al inglés** como idioma base — el que usan las instrucciones internas de cada skill (el "código" que seguimos los LLMs), independientemente de con quién se esté hablando.
2. **Permitir que el usuario configure otros idiomas**, con un campo `language` embebido en distintos puntos de `framework` dentro de `.claude/ms-context.json`, de forma independiente para tres cosas distintas:
   - la interacción general con el usuario (`framework.interaction.language`; valor por defecto para todo lo demás si no se especifica nada más concreto),
   - cada área de documentos de referencia declarada en `framework.docs.*` (`docs.functional` para features, `docs.tech` para arquitectura + biblia de estilo juntas), por separado,
   - los documentos de seguimiento de cambios (`description.md`, `plan.md`, etc.), vía `framework.changes.language`.

Regla general pedida explícitamente: **ante cualquier duda de a qué idioma pertenece algo, se usa el idioma por defecto** (`framework.interaction.language`). Y `ms-init` debe **confirmar siempre con el usuario** la configuración de idioma durante la inicialización, no solo preguntarla si faltan pistas.

Este documento es un plan de diseño e implementación; no se ha tocado código todavía. Se ha guardado en `.claude/plans/` para revisarlo antes de ejecutarlo (probablemente troceado en varios `ms-new`/`ms-fix` reales, dado el tamaño).

## Principio de diseño clave

**Las instrucciones que sigue el LLM (el contenido de cada `SKILL.md`, plantillas, scripts) se quedan siempre en inglés**, se configure lo que se configure en `language`. Lo único que cambia según `language` es **el idioma del texto que el LLM produce hacia fuera**: lo que le dice al usuario en el chat, y el contenido de los documentos que escribe (`description.md`, `plan.md`, `ARCHITECTURE.md`...). Esto es intencional y no es un capricho: separar "idioma de las instrucciones" de "idioma de la salida" es lo que hace fiable seguir instrucciones complejas en inglés (el idioma en el que estas skills están mejor probadas) mientras se conversa o se documenta en el idioma que el usuario prefiera.

## Campos `language` embebidos en `framework` de `.claude/ms-context.json`

No se añade una sección nueva a nivel raíz: cada campo de idioma se embebe como hermano de los campos que ya existen dentro de `framework`, en el bloque al que pertenece. Todos son opcionales — si ninguno existe, todo funciona en inglés (comportamiento por defecto, sin romper proyectos ya inicializados con la versión actual del schema).

```json
"framework": {
  "interaction": { "language": "en" },
  "mockupsSkill": "ms-internal-mockups-html",
  "sourcecodeDir": "src",
  "changes": { "language": "es", "changesDir": "changes" },
  "numberWidth": 5,
  "docs": {
    "functional": { "language": "es", "featuresDocPathDir": "design/docs/features" },
    "tech": { "language": "en", "architectureDocDir": "design/docs/architecture", "styleBibleDocDir": "design/docs/style" }
  }
}
```

- **`framework.interaction.language`** (opcional, por defecto `"en"`) — idioma en el que las skills hablan con el usuario en el chat (preguntas, confirmaciones, resúmenes). Es también el **valor de respaldo** de `changes.language` y de cualquier bloque de `docs.*` que no lleve su propio `language`.
- **`framework.changes.language`** (opcional, por defecto = `interaction.language`) — idioma en el que se redactan los documentos de seguimiento de un cambio/fix: `description.md` (change/fix y también el de `ms-todo`), `plan.md`, `design_navigation_*.md`, y el texto de ejemplo dentro de las maquetas `design_*.html`. Todos viven bajo `{changesDir}/**` y forman una misma familia de documentos efímeros de proceso, distinta de la documentación de referencia del proyecto — de ahí que su `language` se anide junto a `changesDir`, en el mismo objeto.
- **`framework.docs.functional.language`** (opcional, por defecto = `interaction.language`) — idioma de `featuresDocPathDir`.
- **`framework.docs.tech.language`** (opcional, por defecto = `interaction.language`) — idioma compartido por `architectureDocDir` y `styleBibleDocDir`. Ambos documentos cuelgan del mismo objeto `tech` y comparten un único `language` — no hay forma de darle a arquitectura un idioma distinto del de la biblia de estilo. Es una simplificación deliberada frente a modelar un idioma por cada campo de documento individual: hoy `tech` solo agrupa esos dos documentos y normalmente se redactan juntos por la misma persona/equipo; si en el futuro hiciera falta desacoplarlos, sería una extensión de este mismo diseño (mover `language` de `docs.tech` a `docs.tech.architectureDocDir`/`docs.tech.styleBibleDocDir` si cada uno pasa a ser un objeto en vez de una ruta suelta).

Deliberadamente **no** se modela como un mapa de rutas de fichero libres con "longest prefix match": cada `language` vive pegado al campo (o grupo de campos) de `framework` al que ya se refiere, así que no hace falta lógica de resolución de rutas ni notación de punto — si el framework añade un área de documentos nueva en el futuro, ese nuevo bloque lleva su propio `language` opcional siguiendo el mismo patrón.

### Tabla de resolución de idioma

| Contenido | Campo que aplica | Fallback |
|---|---|---|
| Chat con el usuario (preguntas, confirmaciones, resúmenes) | `framework.interaction.language` | `"en"` |
| `description.md` (change/fix) | `framework.changes.language` | `framework.interaction.language` |
| `plan.md` | `framework.changes.language` | `framework.interaction.language` |
| `description.md` de `ms-todo` | `framework.changes.language` | `framework.interaction.language` |
| `design_navigation_*.md` | `framework.changes.language` | `framework.interaction.language` |
| Texto de ejemplo en `design_*.html` | `framework.changes.language` | `framework.interaction.language` |
| `framework.docs.tech.architectureDocDir` | `framework.docs.tech.language` | `framework.interaction.language` |
| `framework.docs.tech.styleBibleDocDir` | `framework.docs.tech.language` | `framework.interaction.language` |
| `framework.docs.functional.featuresDocPathDir` | `framework.docs.functional.language` | `framework.interaction.language` |
| Instrucciones de cada `SKILL.md`, plantillas, scripts | — (siempre inglés) | — |

### Límite conocido y asumido: los informes de `ms-status`

`ms-status` genera su informe con scripts Python deterministas (`render_status.py`, `filter_status.py`) que rellenan `STATUS.template.md`/`STATUS.filtered.template.md` por sustitución de placeholders — sin pasar por el LLM, precisamente para que sea gratis en tokens y consistente. Eso significa que sus cabeceras de tabla y textos fijos (`Estado`/`Change`/`Fix`... → `Status`/`Change`/`Fix`...) **no pueden traducirse dinámicamente** a un `framework.interaction.language` arbitrario sin mantener plantillas por idioma dentro del script — desproporcionado para un valor de idioma en texto libre.

Decisión (aplicando "ante la duda, usa el de por defecto"): el **contenido tabular que generan los scripts se queda siempre en inglés**, sea cual sea `framework.interaction.language`. Lo único que sigue el idioma de interacción es el texto que el LLM añade alrededor (la frase de introducción antes de pegar la tabla). Se documenta explícitamente como límite conocido, no como omisión.

## Cambios en `ms-init`

1. **`schema.json`** — añadir el campo opcional `language` (string) a cada uno de los objetos afectados de `framework`: `interaction` (objeto nuevo si no existía ya), `changes` (junto a `changesDir`), `docs.functional` y `docs.tech` (junto a los campos de ruta que ya tienen). Añadir también el campo opcional `framework._comments` (objeto `clave → string`, incluido en `additionalProperties: false` de `framework` para que sea válido) — es el mismo patrón que `skillModels._instructions`: metadata informativa para quien edite el JSON a mano, ignorada en tiempo de ejecución por todas las skills. Añadir un ejemplo completo con los cuatro campos `language` y con `_comments` a `examples`.
2. **`scripts/check-context.py`** — añadir al JSON de salida un campo nuevo `hasLanguage` (booleano: `true` si `framework.interaction.language` existe en el fichero, sin importar qué contenga — es el único campo cuya ausencia dispara la pregunta incondicional de `ms-init`; `changes.language`/`docs.*.language` son afinamientos opcionales sobre ese valor por defecto). No añadir `framework.interaction.language` a `missingRequired` — sigue siendo opcional a nivel de schema (tiene default `"en"`), la obligatoriedad de preguntarlo es un paso de proceso de `ms-init`, no una validación de schema.
3. **`SKILL.md`** — nuevo paso, después de explorar el repo (paso 2 actual) y antes o junto con "preguntar lo que falte" (paso 3 actual):
   - **Si es una inicialización desde cero** (rama "no existe `.claude/ms-context.json`" o el usuario confirmó reinicializar del todo): preguntar **siempre** por la configuración de idioma, sin condicionarlo a que se detecten pistas — es el único grupo de campos de `framework` que se confirma incondicionalmente. Usar `AskUserQuestion`:
     1. Idioma de interacción (`framework.interaction.language`) — proponer inglés por defecto, pero dejar claro que puede ser cualquier otro (texto libre, o código ISO 639-1 tipo `es`, `fr`).
     2. Idioma de los documentos de cambio (`framework.changes.language`, para `description.md`/`plan.md`) — proponer el mismo que el de interacción por defecto, preguntando solo si quiere uno distinto.
     3. Idioma de cada área de `framework.docs` ya resuelta en este mismo paso 3 (`docs.functional.language`, `docs.tech.language` — las que apliquen) — proponer el mismo que el de interacción por defecto, preguntando solo si quiere alguna distinta.
   - Al escribir/actualizar `language`, `ms-init` también escribe (o completa si faltan claves) `framework._comments` con la explicación de cada campo `language` que haya quedado configurado — mismo texto de referencia que en el ejemplo de este plan.
   - **Si es una actualización parcial** (`missingRequired` no vacío, o hay `framework` sin completar): si `hasLanguage` es `false`, incluir esta misma pregunta de idioma en la misma ronda de preguntas (no crear una ronda aparte). Si `hasLanguage` es `true`, no volver a preguntar — igual que el resto de campos ya configurados.
4. **Paso 5 (confirmar)** — el resumen final debe incluir también lo que ha quedado configurado en `interaction.language`/`changes.language`/`docs.*.language`.

## Cambios en cada skill: aplicar la configuración de idioma

Cada skill que ya tiene un paso "0. Cargar contexto / comprobar que el framework está inicializado" (todas las invocables por el usuario, más `ms-internal-workflow`) añade ahí mismo, tras leer `.claude/ms-context.json`, un párrafo corto y estándar (mismo patrón de duplicación controlada que ya usan hoy para el guardarraíl "framework no inicializado" — cada skill repite su propio bloque en vez de centralizarlo, porque son skills invocadas de forma independiente):

> **Language.** Use `framework.interaction.language` (default English) for everything you say to the user in this conversation. [Frase adicional específica de la skill: qué campo `language` aplica al documento que escribe, con su fallback — ver tabla de resolución arriba.] If `language` is not configured anywhere, everything is English.

Aplicación concreta por skill:

- **`ms-init`** — caso especial: al preguntar por primera vez, todavía no hay `framework.interaction.language` configurado. Usa inglés por defecto para la conversación hasta que el usuario fije uno (y a partir de ahí, si re-invocas `ms-init` sobre un proyecto ya inicializado, usa ya `framework.interaction.language` si existe).
- **`ms-new`, `ms-fix`** — chat en `interaction.language`; `description.md` (vía `ms-internal-workflow`), `design_navigation_*.md` y el texto de ejemplo de `design_*.html` en `changes.language`.
- **`ms-how`** — chat en `interaction.language`; `plan.md` en `changes.language`. Al actualizar las secciones (c)/(d) del plan (que luego `ms-do` aplicará a `docs.tech.*`), estas siguen el idioma de `changes.language` (viven en `plan.md`, no en el documento final).
- **`ms-do`** — chat en `interaction.language`; al actualizar `docs.functional.featuresDocPathDir`, usa `docs.functional.language`; al actualizar `docs.tech.architectureDocDir`/`docs.tech.styleBibleDocDir`, usa `docs.tech.language` (fallback `interaction.language` en ambos casos) — **no** el de `changes.language`, aunque la fuente (`plan.md`) esté en otro idioma: es responsabilidad de `ms-do` traducir el contenido al escribirlo en el documento de referencia si los idiomas no coinciden.
- **`ms-internal-workflow`** — chat (mensajes de guardarraíl) en `interaction.language`; `description.md` que redacta en la acción `create` usa `changes.language`.
- **`ms-internal-tech-analysis`** — no escribe nada ni habla directamente con el usuario (solo devuelve contexto a quien la invoca); no necesita este párrafo, pero si cita literalmente fragmentos de `docs.tech.*` en su respuesta, los cita en el idioma en que estén escritos realmente (no traduce lo que lee).
- **`ms-internal-mockups-html` / `ms-internal-mockups-ascii`** — no hablan con el usuario; el texto de ejemplo dentro del `design_*.html`/`design_*.txt` que generan sigue `changes.language` (se lo puede indicar quien invoca, o resolverlo ella misma leyendo `.claude/ms-context.json`).
- **`ms-status`** — chat (la frase que envuelve el informe) en `interaction.language`; el informe en sí (tabla generada por script) se queda en inglés según el límite documentado arriba — dejarlo explícito en el propio `SKILL.md` para que no se intente "arreglar" en el futuro sin revisar antes esta decisión.
- **`ms-todo`** — chat en `interaction.language`; su `description.md` en `changes.language` (misma familia que `ms-new`/`ms-fix`, aunque viva en `todo/` en vez de `inProgress/`).

## Alcance de la traducción al inglés (inventario)

### Skills — `SKILL.md` y ficheros de soporte

- `ms-init/SKILL.md`, `ms-init/schema.json`
- `ms-new/SKILL.md`, `ms-new/extend-entry.md`, `ms-new/todo-mode.md`
- `ms-fix/SKILL.md`
- `ms-how/SKILL.md`, `ms-how/PLAN.template.md`
- `ms-do/SKILL.md`, `ms-do/FEATURES.template.md`
- `ms-internal-workflow/SKILL.md`, `ms-internal-workflow/description.template.md`
- `ms-internal-tech-analysis/SKILL.md`
- `ms-status/SKILL.md`, `ms-status/STATUS.template.md`, `ms-status/STATUS.filtered.template.md`
- `ms-todo/SKILL.md`
- `ms-internal-mockups-html/SKILL.md`
- `ms-internal-mockups-ascii/SKILL.md`

Reglas de traducción para estos ficheros:
- Se traduce todo el prosa (frontmatter `description`/`argument-hint` incluidos — importante: `description` es lo que el harness usa para decidir el trigger de la skill, tiene que quedar en inglés e igual de específico que hoy).
- **No se traducen**: nombres de skill (`ms-new`, `ms-how`...), nombres de campo JSON (`changesDir`, `xxxx`, `description.md`, `plan.md`...), rutas de fichero, código/comandos.
- Los bloques de mensaje literal al usuario (los que hoy están en español entre ``` ``` ```, p.ej. el guardarraíl "Este proyecto todavía no tiene el framework...") se traducen al inglés como texto base, pero quedan marcados como el mensaje a adaptar según `framework.interaction.language` en tiempo de ejecución (no como texto fijo a pegar siempre en inglés) — es decir, se traduce el contenido de referencia, pero la instrucción que lo rodea dice explícitamente que ese mensaje se traduce al idioma configurado.

### Documentación del framework

- `.claude/ms-guide.md` — traducir contenido y el diagrama Mermaid (etiquetas de nodos). Añadir una sección nueva explicando `language` (mismo hueco donde hoy se explica `skillModels`).
- `.claude/ms-design.md` — traducir contenido y etiquetas del diagrama Mermaid.

### Scripts Python

Traducir docstrings, comentarios y mensajes de error/consola a inglés en:
- `ms-init/scripts/check-context.py`, `ms-init/scripts/sync-skill-models.py`
- `ms-how/scripts/get-max-change-codes.py`
- `ms-internal-workflow/scripts/move-change.py`, `ms-internal-workflow/scripts/next-change-number.py`
- `ms-status/scripts/collect_status.py`, `ms-status/scripts/filter_status.py`, `ms-status/scripts/render_status.py`
- `ms-todo/scripts/new-todo-code.py`

Caso especial — `ms-status`: los placeholders de las plantillas y el código que los rellena usan nombres en español (`código`, `nombre`, `fecha`, `tipo`, `descripción`, `estado`, `filas...`). Como el output de estos scripts se queda en inglés por decisión de diseño (ver límite conocido arriba), esto es una traducción 1:1 sin ambigüedad de diseño:
- Placeholders: `código→code`, `nombre→name`, `fecha→date`, `tipo→type`, `descripción→description`, `estado→status`, `filas→rows` (y sus variantes: `filasImplementar→rowsToImplement`, etc.), `fechaGeneracion→generatedAt`.
- Cabeceras de tabla y texto fijo del template: `Estado del proyecto→Project status`, `Generado→Generated`, `En progreso→In progress`, `Cambios fast implementados→Implemented fast changes`, `Ideas en todo/...→Ideas in todo/...`, `Avisos→Warnings`, etc.
- Actualizar `render_status.py`/`filter_status.py`/`collect_status.py` para que usen esos nombres de placeholder/clave en las llamadas `.format(...)` y en el JSON que emiten (`collect_status.py` ya emite claves en inglés como `states`/`totalsByType`/`grandTotal`/`warnings` — revisar si hay alguna clave residual en español, p.ej. `subStatus` con valores `listo_para_implementar`/`descrito`/`sin_descripcion` → `ready_to_implement`/`described`/`no_description`).

### Explícitamente fuera de alcance

- `.claude/improvement/**` — notas de auditoría/medición históricas del propio framework, no forman parte del framework en sí que usan los proyectos. Se dejan tal cual.
- `.claude/plans/quiero-implementar-una-nueva-witty-rossum.md` (y cualquier plan histórico previo) — artefacto puntual, no se retraduce.
- Todo lo que no esté bajo `.claude/` (código del juego, `README`, etc.) — no es parte del framework de skills.

## Ficheros nuevos

Ninguno estructural: esto es una traducción + una extensión de schema + un paso nuevo en `ms-init`, no una skill nueva. El único fichero nuevo es este propio plan.

## Ficheros modificados (resumen)

- `.claude/skills/ms-init/SKILL.md`, `schema.json`, `scripts/check-context.py`
- `.claude/skills/ms-new/SKILL.md`, `extend-entry.md`, `todo-mode.md`
- `.claude/skills/ms-fix/SKILL.md`
- `.claude/skills/ms-how/SKILL.md`, `PLAN.template.md`
- `.claude/skills/ms-do/SKILL.md`, `FEATURES.template.md`
- `.claude/skills/ms-internal-workflow/SKILL.md`, `description.template.md`, `scripts/move-change.py`, `scripts/next-change-number.py`
- `.claude/skills/ms-internal-tech-analysis/SKILL.md`
- `.claude/skills/ms-status/SKILL.md`, `STATUS.template.md`, `STATUS.filtered.template.md`, `scripts/collect_status.py`, `scripts/filter_status.py`, `scripts/render_status.py`
- `.claude/skills/ms-todo/SKILL.md`, `scripts/new-todo-code.py`
- `.claude/skills/ms-internal-mockups-html/SKILL.md`
- `.claude/skills/ms-internal-mockups-ascii/SKILL.md`
- `.claude/skills/ms-how/scripts/get-max-change-codes.py`
- `.claude/ms-guide.md`, `.claude/ms-design.md`
- `.claude/ms-context.json` (de este propio repo — ver siguiente sección)

Cada `SKILL.md` modificado también sube su `metadata.version` (semver, incremento *minor* al añadir el soporte de idioma, ya que amplía comportamiento sin romper compatibilidad) — patrón que ya siguen las skills existentes (`ms-new` está en `1.11.0`, `ms-fix` en `2.1.0`, etc.).

## Migración y retrocompatibilidad

- Los campos `language` son opcionales a nivel de schema: cualquier `.claude/ms-context.json` existente (de este repo o de terceros) generado con la versión anterior del framework sigue siendo válido sin cambios — todo funciona en inglés (`interaction.language` por defecto `"en"`, `changes.language` y `docs.*.language` caen a `interaction.language`).
- No hay que migrar nada de forma destructiva: la próxima vez que se invoque `ms-init` sobre un proyecto así, el nuevo paso de `check-context.py`/`hasLanguage` detecta que falta `framework.interaction.language` y lo pregunta una vez, sin tocar el resto de configuración ya presente (merge, igual que el resto de campos).
- Los proyectos que **no** vuelvan a invocar `ms-init` simplemente siguen operando en inglés indefinidamente con el framework ya traducido — comportamiento correcto y explícito (idioma base), no un bug.

## Aplicar esto al propio repo `errantes-board-game`

Este repo ya tiene `.claude/ms-context.json` sin campos `language`, y toda la interacción hasta ahora ha sido en español. Como parte de la implementación (no de este plan en sí):

1. Añadir los campos `language` (`interaction`, `changes`, `docs.functional`, `docs.tech`) a este `.claude/ms-context.json`, preguntando explícitamente al usuario (no asumiendo) — igual que exige el nuevo paso de `ms-init` — con español como propuesta por defecto dado el histórico de este proyecto, pero confirmando en vez de asumir.
2. No hace falta retraducir `changes/` existentes (`description.md`/`plan.md` ya escritos) — el idioma configurado aplica hacia adelante, a partir de la próxima entrada.

### Ejemplo — cómo quedaría este `.claude/ms-context.json` tras el cambio

Partiendo del fichero real de este repo (mismo `skillModels`/`framework`, sin tocar), suponiendo que el usuario confirma español como idioma de interacción y de documentos de cambio, pero prefiere mantener la documentación técnica de arquitectura en inglés (caso ilustrativo de que `docs.*` puede divergir del resto):

```json
{
  "skillModels": {
    "_instructions": "Tras editar 'default' o 'overrides' de esta seccion, ejecuta desde la raiz del repo: python .claude/skills/ms-init/scripts/sync-skill-models.py -- reescribe el campo 'model'/'effort' en el frontmatter de cada SKILL.md 'ms-*' segun lo que quede configurado aqui. El harness de Claude Code solo lee ese frontmatter, no este JSON, asi que sin ejecutar el script los cambios de aqui no tienen efecto.",
    "default": { "model": "claude-sonnet-5", "effort": "medium" },
    "overrides": {
      "ms-status": { "model": "claude-haiku-4-5", "effort": "medium" },
      "ms-todo": { "model": "claude-haiku-4-5", "effort": "medium" },
      "ms-do": { "model": "claude-haiku-4-5", "effort": "medium" }
    }
  },
  "framework": {
    "_comments": {
      "interaction.language": "Idioma en el que las skills hablan contigo en el chat (preguntas, confirmaciones, resúmenes). También es el valor por defecto para changes.language y docs.*.language cuando no se indican.",
      "changes.language": "Idioma de los documentos de seguimiento de un cambio/fix (description.md, plan.md, design_navigation_*.md, texto de ejemplo en design_*.html) dentro de changesDir. Si se omite, usa interaction.language.",
      "docs.functional.language": "Idioma de featuresDocPathDir. Si se omite, usa interaction.language.",
      "docs.tech.language": "Idioma compartido por architectureDocDir y styleBibleDocDir (no se puede fijar uno distinto para cada uno). Si se omite, usa interaction.language."
    },
    "interaction":
    {
        "language": "es"
    },
    "mockupsSkill": "ms-internal-mockups-html",
    "sourcecodeDir": "src",
    "changes":
    {
        "language": "es",
        "changesDir": "changes"
    },
    "numberWidth": 5,
    "docs": {
      "functional": {
        "language": "es",
        "featuresDocPathDir": "design/docs/features"
      },
      "tech": {
        "language": "en",
        "architectureDocDir": "design/docs/architecture",
        "styleBibleDocDir": "design/docs/style"
      }
    }
  }
}
```

Notas sobre este ejemplo:
- `framework._comments` — mismo patrón que `skillModels._instructions`: un campo informativo, ignorado por el schema/las skills en tiempo de ejecución, pensado solo para quien abra el JSON a mano y quiera saber qué edita antes de tocarlo. `ms-init` lo escribe (o actualiza) al generar/completar `language`, pero ninguna skill lo lee.
- `framework.interaction.language: "es"` — el chat de todas las skills (preguntas, confirmaciones, resúmenes) pasa a español. Es también el valor por defecto para cualquier otro campo `language` que no se especifique en `changes`/`docs.*`.
- `framework.changes.language: "es"` — idioma de los documentos de seguimiento del cambio/fix (`description.md`, `plan.md`, `design_navigation_*.md`, texto de ejemplo en `design_*.html`). Se ha anidado junto a `changesDir` porque ambos describen la misma carpeta (`{changesDir}/**`); en este ejemplo coincide con `interaction`, pero podría no hacerlo.
- `framework.docs.functional.language: "es"` — idioma de `featuresDocPathDir`, junto al propio campo de ruta. Cae a `interaction` si se omite.
- `framework.docs.tech.language: "en"` — idioma compartido por `architectureDocDir` y `styleBibleDocDir`, porque ambos cuelgan del mismo objeto `tech` (ver razonamiento en la sección de arriba). Es el caso ilustrativo de divergencia frente a `interaction`: se mantiene en inglés mientras el resto del proyecto pasa a español.
- Si un bloque (`changes`, `docs.functional`, `docs.tech`) no lleva `language`, hereda `framework.interaction.language` — no hace falta repetirlo cuando coincide.


## Plan de verificación

- **Schema**: `python -c "import json; json.load(open('.claude/skills/ms-init/schema.json'))"` no falla tras el cambio; validar a mano los ejemplos nuevos (incluido `_comments`) contra la forma añadida.
- **`check-context.py`**: ejecutar contra el `ms-context.json` actual del repo (sin campos `language`) y comprobar `hasLanguage: false`; añadir `framework.interaction.language` de prueba y comprobar `hasLanguage: true`.
- **`ms-init` (flujo completo)**: invocar sobre un repo de prueba sin `.claude/ms-context.json` y comprobar que la pregunta de idioma aparece siempre, con las tres sub-preguntas (`interaction.language`, `changes.language`, `docs.*.language`), que el fichero resultante tiene la forma esperada y que `framework._comments` queda escrito con la explicación de cada campo configurado.
- **`ms-init` (flujo parcial)**: sobre un `ms-context.json` ya completo salvo `language`, comprobar que solo pregunta por idioma (no repite el resto del cuestionario).
- **Ciclo completo con idioma distinto de inglés**: en un repo de prueba con `framework.interaction.language="es"` y `framework.changes.language="en"`, invocar `/ms-new` y comprobar que las preguntas/confirmaciones en chat salen en español pero `description.md` se redacta en inglés.
- **`ms-status` con `interaction.language` no inglés**: comprobar que la tabla sigue en inglés y que la frase introductoria del LLM sí sale en el idioma configurado.
- **Scripts de `ms-status` tras el rename de placeholders**: ejecutar `render_status.py` y `filter_status.py` sobre `changes/` real de este repo y comparar que la tabla generada tiene los mismos datos que antes del rename (mismos totales), solo con cabeceras/placeholders en inglés.
- **Regresión general**: recorrer el ciclo `ms-new → ms-how → ms-do` completo en un repo de prueba tras la traducción, sin tocar `language` (repo "legacy"), y comprobar que todo el texto generado (chat y documentos) sigue siendo coherente en inglés de punta a punta.

## Riesgos y preguntas abiertas para cuando se implemente

- **Tamaño**: esto es ~2100 líneas de contenido a traducir/revisar más el diseño nuevo — probablemente conviene trocearlo en varias entradas `ms-new`/`ms-fix` reales (p.ej. una por skill o grupo de skills) en vez de un único cambio monolítico, para poder revisar cada traducción con calma.
- **`design_*.html` en `changes.language`**: si el idioma de interacción y el de `changes.language` difieren del idioma real en que está escrita la UI del proyecto (que no tiene por qué coincidir con ninguno de los dos), el texto de ejemplo de las maquetas podría no reflejar el idioma real de la app. No hay campo hoy para "idioma de la UI del proyecto" — si hiciera falta, sería una extensión futura de `project`, fuera del alcance de esta traducción.
- **Traducción de `plan.md` → `docs.tech.*` cuando `changes.language` ≠ `docs.tech.language`**: `ms-do` tiene que traducir contenido, no solo copiarlo — asumible porque ya es un LLM redactando el documento final, pero conviene señalarlo explícitamente en `ms-do/SKILL.md` para que no se copie/pegue texto tal cual sin más.
- **Granularidad de `docs.tech.language`**: al compartir un único idioma entre `architectureDocDir` y `styleBibleDocDir`, se pierde la posibilidad de que un proyecto quiera cada uno en un idioma distinto. Alternativa considerada y descartada por ahora: un `language` por campo de ruta individual en vez de por objeto `tech`/`functional` — más flexible pero más campos que mantener; revisar si algún caso real de este framework lo necesita antes de implementar.