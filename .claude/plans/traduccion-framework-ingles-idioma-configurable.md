# Plan — Traducir el framework `ms-*` al inglés + idioma configurable

## Contexto

Todo el framework `ms-*` (`.claude/skills/ms-*`, `.claude/ms-guide.md`, `.claude/ms-design.md`, plantillas y scripts) está escrito en español: instrucciones de cada `SKILL.md`, mensajes al usuario, plantillas de documentos (`description.template.md`, `PLAN.template.md`, `FEATURES.template.md`, `STATUS*.template.md`) y buena parte de los scripts Python (comentarios, docstrings, nombres de placeholder tipo `código`/`nombre`/`fecha`).

El objetivo es doble:

1. **Traducir todo el framework al inglés** como idioma base — el que usan las instrucciones internas de cada skill (el "código" que seguimos los LLMs), independientemente de con quién se esté hablando.
2. **Permitir que el usuario configure otros idiomas** en `.claude/ms-context.json`, de forma independiente para tres cosas distintas:
   - la interacción general con el usuario (valor por defecto para todo lo demás si no se especifica nada más concreto),
   - cada documento (o carpeta de documentos) de referencia declarado en `framework.docs.*` (arquitectura, biblia de estilo, features), por separado,
   - los documentos de seguimiento de cambios (`description.md`, `plan.md`, etc.).

Regla general pedida explícitamente: **ante cualquier duda de a qué idioma pertenece algo, se usa el idioma por defecto** (`language.interaction`). Y `ms-init` debe **confirmar siempre con el usuario** la configuración de idioma durante la inicialización, no solo preguntarla si faltan pistas.

Este documento es un plan de diseño e implementación; no se ha tocado código todavía. Se ha guardado en `.claude/plans/` para revisarlo antes de ejecutarlo (probablemente troceado en varios `ms-new`/`ms-fix` reales, dado el tamaño).

## Principio de diseño clave

**Las instrucciones que sigue el LLM (el contenido de cada `SKILL.md`, plantillas, scripts) se quedan siempre en inglés**, se configure lo que se configure en `language`. Lo único que cambia según `language` es **el idioma del texto que el LLM produce hacia fuera**: lo que le dice al usuario en el chat, y el contenido de los documentos que escribe (`description.md`, `plan.md`, `ARCHITECTURE.md`...). Esto es intencional y no es un capricho: separar "idioma de las instrucciones" de "idioma de la salida" es lo que hace fiable seguir instrucciones complejas en inglés (el idioma en el que estas skills están mejor probadas) mientras se conversa o se documenta en el idioma que el usuario prefiera.

## Nueva sección `language` en `.claude/ms-context.json`

Sección opcional a nivel raíz, hermana de `framework`/`project`/`skillModels`. Si no existe, todo funciona en inglés (comportamiento por defecto, sin romper proyectos ya inicializados con la versión actual del schema).

```json
"language": {
  "interaction": "en",
  "changeDocs": "es",
  "docs": {
    "tech.architectureDocPath": "en",
    "tech.styleBibleDocPath": "es",
    "functional.featuresDocPath": "es"
  }
}
```

- **`language.interaction`** (opcional, por defecto `"en"`) — idioma en el que las skills hablan con el usuario en el chat (preguntas, confirmaciones, resúmenes). Es también el **valor de respaldo** de `changeDocs` y de cualquier entrada de `docs` que no se configure explícitamente.
- **`language.changeDocs`** (opcional, por defecto = `interaction`) — idioma en el que se redactan los documentos de seguimiento de un cambio/fix: `description.md` (change/fix y también el de `ms-todo`), `plan.md`, `design_navigation_*.md`, y el texto de ejemplo dentro de las maquetas `design_*.html`. Todos viven bajo `{changesDir}/**` y forman una misma familia de documentos efímeros de proceso, distinta de la documentación de referencia del proyecto.
- **`language.docs`** (opcional) — mapa `clave → idioma`, donde la clave es el campo de `framework.docs` al que se refiere, en notación de punto (`tech.architectureDocPath`, `tech.styleBibleDocPath`, `functional.featuresDocPath`). Cada uno de estos documentos de referencia puede tener su propio idioma, independiente de los demás — incluye el caso en que uno de esos campos apunte a una carpeta con varios ficheros ("carpeta de documentos"), no solo a un fichero suelto: el idioma configurado aplica a todo lo que haya bajo esa ruta. Una clave sin entrada en `docs` cae a `interaction`.

Deliberadamente **no** se modela como un mapa de rutas de fichero libres con "longest prefix match": atarlo a las claves ya existentes de `framework.docs` evita lógica de resolución de rutas y ambigüedad — solo hay tres documentos de referencia posibles hoy, y si el framework añade alguno nuevo en el futuro, se añade aquí a la vez con el mismo patrón `área.campo`.

### Tabla de resolución de idioma

| Contenido | Campo que aplica | Fallback |
|---|---|---|
| Chat con el usuario (preguntas, confirmaciones, resúmenes) | `language.interaction` | `"en"` |
| `description.md` (change/fix) | `language.changeDocs` | `language.interaction` |
| `plan.md` | `language.changeDocs` | `language.interaction` |
| `description.md` de `ms-todo` | `language.changeDocs` | `language.interaction` |
| `design_navigation_*.md` | `language.changeDocs` | `language.interaction` |
| Texto de ejemplo en `design_*.html` | `language.changeDocs` | `language.interaction` |
| `framework.docs.tech.architectureDocPath` | `language.docs["tech.architectureDocPath"]` | `language.interaction` |
| `framework.docs.tech.styleBibleDocPath` | `language.docs["tech.styleBibleDocPath"]` | `language.interaction` |
| `framework.docs.functional.featuresDocPath` | `language.docs["functional.featuresDocPath"]` | `language.interaction` |
| Instrucciones de cada `SKILL.md`, plantillas, scripts | — (siempre inglés) | — |

### Límite conocido y asumido: los informes de `ms-status`

`ms-status` genera su informe con scripts Python deterministas (`render_status.py`, `filter_status.py`) que rellenan `STATUS.template.md`/`STATUS.filtered.template.md` por sustitución de placeholders — sin pasar por el LLM, precisamente para que sea gratis en tokens y consistente. Eso significa que sus cabeceras de tabla y textos fijos (`Estado`/`Change`/`Fix`... → `Status`/`Change`/`Fix`...) **no pueden traducirse dinámicamente** a un `language.interaction` arbitrario sin mantener plantillas por idioma dentro del script — desproporcionado para un valor de idioma en texto libre.

Decisión (aplicando "ante la duda, usa el de por defecto"): el **contenido tabular que generan los scripts se queda siempre en inglés**, sea cual sea `language.interaction`. Lo único que sigue el idioma de interacción es el texto que el LLM añade alrededor (la frase de introducción antes de pegar la tabla). Se documenta explícitamente como límite conocido, no como omisión.

## Cambios en `ms-init`

1. **`schema.json`** — añadir la sección `language` descrita arriba (`$defs` si conviene reutilizar, `additionalProperties: false` en el objeto `language`, con `docs` como `additionalProperties: {"type": "string"}`). Añadir un ejemplo completo con `language` a `examples`.
2. **`scripts/check-context.py`** — añadir al JSON de salida un campo nuevo `hasLanguage` (booleano: si la clave `language` existe en el fichero, sin importar qué contenga). No añadir `language.interaction` a `missingRequired` — sigue siendo opcional a nivel de schema (tiene default `"en"`), la obligatoriedad de preguntarlo es un paso de proceso de `ms-init`, no una validación de schema.
3. **`SKILL.md`** — nuevo paso, después de explorar el repo (paso 2 actual) y antes o junto con "preguntar lo que falte" (paso 3 actual):
   - **Si es una inicialización desde cero** (rama "no existe `.claude/ms-context.json`" o el usuario confirmó reinicializar del todo): preguntar **siempre** por la configuración de idioma, sin condicionarlo a que se detecten pistas — es la única sección de `framework`/config que se confirma incondicionalmente. Usar `AskUserQuestion`:
     1. Idioma de interacción — proponer inglés por defecto, pero dejar claro que puede ser cualquier otro (texto libre, o código ISO 639-1 tipo `es`, `fr`).
     2. Idioma de los documentos de cambio (`description.md`/`plan.md`) — proponer el mismo que el de interacción por defecto, preguntando solo si quiere uno distinto.
     3. Idioma de cada documento de `framework.docs` ya resuelto en este mismo paso 3 (`architectureDocPath`, `styleBibleDocPath`, `featuresDocPath` — los que apliquen) — proponer el mismo que el de interacción por defecto, preguntando solo si quiere alguno distinto.
   - **Si es una actualización parcial** (`missingRequired` no vacío, o hay `framework` sin completar): si `hasLanguage` es `false`, incluir esta misma pregunta de idioma en la misma ronda de preguntas (no crear una ronda aparte). Si `hasLanguage` es `true`, no volver a preguntar — igual que el resto de campos ya configurados.
4. **Paso 5 (confirmar)** — el resumen final debe incluir también lo que ha quedado configurado en `language`.

## Cambios en cada skill: aplicar la configuración de idioma

Cada skill que ya tiene un paso "0. Cargar contexto / comprobar que el framework está inicializado" (todas las invocables por el usuario, más `ms-internal-workflow`) añade ahí mismo, tras leer `.claude/ms-context.json`, un párrafo corto y estándar (mismo patrón de duplicación controlada que ya usan hoy para el guardarraíl "framework no inicializado" — cada skill repite su propio bloque en vez de centralizarlo, porque son skills invocadas de forma independiente):

> **Language.** Use `language.interaction` (default English) for everything you say to the user in this conversation. [Frase adicional específica de la skill: qué campo de `language` aplica al documento que escribe, con su fallback — ver tabla de resolución arriba.] If `language` is not configured at all, everything is English.

Aplicación concreta por skill:

- **`ms-init`** — caso especial: al preguntar por primera vez, todavía no hay `language.interaction` configurado. Usa inglés por defecto para la conversación hasta que el usuario fije uno (y a partir de ahí, si re-invocas `ms-init` sobre un proyecto ya inicializado, usa ya `language.interaction` si existe).
- **`ms-new`, `ms-fix`** — chat en `interaction`; `description.md` (vía `ms-internal-workflow`), `design_navigation_*.md` y el texto de ejemplo de `design_*.html` en `changeDocs`.
- **`ms-how`** — chat en `interaction`; `plan.md` en `changeDocs`. Al actualizar las secciones (c)/(d) del plan (que luego `ms-do` aplicará a `docs.tech.*`), estas siguen el idioma de `changeDocs` (viven en `plan.md`, no en el documento final).
- **`ms-do`** — chat en `interaction`; al actualizar `docs.tech.architectureDocPath`/`docs.functional.featuresDocPath`/`docs.tech.styleBibleDocPath`, usa el idioma de `language.docs` correspondiente a cada uno (fallback `interaction`) — **no** el de `changeDocs`, aunque la fuente (`plan.md`) esté en otro idioma: es responsabilidad de `ms-do` traducir el contenido al escribirlo en el documento de referencia si los idiomas no coinciden.
- **`ms-internal-workflow`** — chat (mensajes de guardarraíl) en `interaction`; `description.md` que redacta en la acción `create` usa `changeDocs`.
- **`ms-internal-tech-analysis`** — no escribe nada ni habla directamente con el usuario (solo devuelve contexto a quien la invoca); no necesita este párrafo, pero si cita literalmente fragmentos de `docs.tech.*` en su respuesta, los cita en el idioma en que estén escritos realmente (no traduce lo que lee).
- **`ms-internal-mockups-html` / `ms-internal-mockups-ascii`** — no hablan con el usuario; el texto de ejemplo dentro del `design_*.html`/`design_*.txt` que generan sigue `changeDocs` (se lo puede indicar quien invoca, o resolverlo ella misma leyendo `.claude/ms-context.json`).
- **`ms-status`** — chat (la frase que envuelve el informe) en `interaction`; el informe en sí (tabla generada por script) se queda en inglés según el límite documentado arriba — dejarlo explícito en el propio `SKILL.md` para que no se intente "arreglar" en el futuro sin revisar antes esta decisión.
- **`ms-todo`** — chat en `interaction`; su `description.md` en `changeDocs` (misma familia que `ms-new`/`ms-fix`, aunque viva en `todo/` en vez de `inProgress/`).

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
- Los bloques de mensaje literal al usuario (los que hoy están en español entre ``` ``` ```, p.ej. el guardarraíl "Este proyecto todavía no tiene el framework...") se traducen al inglés como texto base, pero quedan marcados como el mensaje a adaptar según `language.interaction` en tiempo de ejecución (no como texto fijo a pegar siempre en inglés) — es decir, se traduce el contenido de referencia, pero la instrucción que lo rodea dice explícitamente que ese mensaje se traduce al idioma configurado.

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

- `language` es opcional a nivel de schema: cualquier `.claude/ms-context.json` existente (de este repo o de terceros) generado con la versión anterior del framework sigue siendo válido sin cambios — todo funciona en inglés (`interaction` por defecto `"en"`, `changeDocs` y `docs.*` caen a `interaction`).
- No hay que migrar nada de forma destructiva: la próxima vez que se invoque `ms-init` sobre un proyecto así, el nuevo paso de `check-context.py`/`hasLanguage` detecta que falta `language` y lo pregunta una vez, sin tocar el resto de configuración ya presente (merge, igual que el resto de campos).
- Los proyectos que **no** vuelvan a invocar `ms-init` simplemente siguen operando en inglés indefinidamente con el framework ya traducido — comportamiento correcto y explícito (idioma base), no un bug.

## Aplicar esto al propio repo `errantes-board-game`

Este repo ya tiene `.claude/ms-context.json` sin sección `language`, y toda la interacción hasta ahora ha sido en español. Como parte de la implementación (no de este plan en sí):

1. Añadir la sección `language` a este `.claude/ms-context.json`, preguntando explícitamente al usuario (no asumiendo) — igual que exige el nuevo paso de `ms-init` — con español como propuesta por defecto dado el histórico de este proyecto, pero confirmando en vez de asumir.
2. No hace falta retraducir `changes/` existentes (`description.md`/`plan.md` ya escritos) — el idioma configurado aplica hacia adelante, a partir de la próxima entrada.

## Plan de verificación

- **Schema**: `python -c "import json; json.load(open('.claude/skills/ms-init/schema.json'))"` no falla tras el cambio; validar a mano los ejemplos nuevos contra la forma añadida.
- **`check-context.py`**: ejecutar contra el `ms-context.json` actual del repo (sin `language`) y comprobar `hasLanguage: false`; añadir `language` de prueba y comprobar `hasLanguage: true`.
- **`ms-init` (flujo completo)**: invocar sobre un repo de prueba sin `.claude/ms-context.json` y comprobar que la pregunta de idioma aparece siempre, con las tres sub-preguntas (interacción, changeDocs, docs.*) y que el fichero resultante tiene la forma esperada.
- **`ms-init` (flujo parcial)**: sobre un `ms-context.json` ya completo salvo `language`, comprobar que solo pregunta por idioma (no repite el resto del cuestionario).
- **Ciclo completo con idioma distinto de inglés**: en un repo de prueba con `language.interaction="es"` y `language.changeDocs="en"`, invocar `/ms-new` y comprobar que las preguntas/confirmaciones en chat salen en español pero `description.md` se redacta en inglés.
- **`ms-status` con `interaction` no inglés**: comprobar que la tabla sigue en inglés y que la frase introductoria del LLM sí sale en el idioma configurado.
- **Scripts de `ms-status` tras el rename de placeholders**: ejecutar `render_status.py` y `filter_status.py` sobre `changes/` real de este repo y comparar que la tabla generada tiene los mismos datos que antes del rename (mismos totales), solo con cabeceras/placeholders en inglés.
- **Regresión general**: recorrer el ciclo `ms-new → ms-how → ms-do` completo en un repo de prueba tras la traducción, sin tocar `language` (repo "legacy"), y comprobar que todo el texto generado (chat y documentos) sigue siendo coherente en inglés de punta a punta.

## Riesgos y preguntas abiertas para cuando se implemente

- **Tamaño**: esto es ~2100 líneas de contenido a traducir/revisar más el diseño nuevo — probablemente conviene trocearlo en varias entradas `ms-new`/`ms-fix` reales (p.ej. una por skill o grupo de skills) en vez de un único cambio monolítico, para poder revisar cada traducción con calma.
- **`design_*.html` en `changeDocs`**: si el idioma de interacción y el de `changeDocs` difieren del idioma real en que está escrita la UI del proyecto (que no tiene por qué coincidir con ninguno de los dos), el texto de ejemplo de las maquetas podría no reflejar el idioma real de la app. No hay campo hoy para "idioma de la UI del proyecto" — si hiciera falta, sería una extensión futura de `project`, fuera del alcance de esta traducción.
- **Traducción de `plan.md` → `docs.tech.*` cuando `changeDocs` ≠ `docs["tech...."]`**: `ms-do` tiene que traducir contenido, no solo copiarlo — asumible porque ya es un LLM redactando el documento final, pero conviene señalarlo explícitamente en `ms-do/SKILL.md` para que no se copie/pegue texto tal cual sin más.
- **Nombre del campo `language.docs`**: alternativa considerada y descartada fue un mapa de rutas de fichero libres (más flexible pero con lógica de resolución de rutas innecesaria hoy, dado que solo hay tres documentos de referencia posibles). Revisar si se prefiere esa alternativa antes de implementar.
