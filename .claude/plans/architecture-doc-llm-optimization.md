# Reestructurar ARCHITECTURE.md como documentación LLM-first

## Contexto

`design/docs/ARCHITECTURE.md` (340 líneas, ~76k tokens) es la fuente de verdad técnica que las skills `ms-*` leen antes de analizar cualquier change/fix. La propia skill `ms-internal-tech-analysis` señala en su propio `SKILL.md` que releer este documento completo (típicamente 2 veces por ciclo: `ms-new`/`ms-fix` y luego `ms-how`) es "el mayor coste evitable de todo el ciclo".

El origen del problema no es la información en sí, sino el formato: casi cada línea es un párrafo-ladrillo que mezcla el estado actual con el historial completo de cómo se llegó ahí (`cambio 00108`, `fix 00166`, etc.). Ese historial ya vive en `changes/implemented/` — no hace falta narrarlo también aquí. Además el documento es un único fichero monolítico que se lee entero aunque la tarea solo afecte a una parte pequeña.

Objetivo: que `ARCHITECTURE.md` deje de narrar el pasado y pase a describir solo el presente, en un formato que una skill pueda cargar de forma selectiva en vez de todo o nada. Ningún objetivo de legibilidad humana — el único lector es un LLM.

## Formato: Markdown, no JSON

JSON añade sintaxis (comillas, llaves, comas) que para contenido narrativo pesa más en tokens que Markdown equivalente, y fuerza a escapar texto libre. Los LLM están mucho más densamente entrenados en Markdown. Se mantiene Markdown en todo el documento, con **tablas** para lo que hoy son bloques de pseudo-código o listas de campos (el modelo de componente, los tipos concretos, el modelo de grupo/recurso) — eso sí es genuinamente tabular y una tabla es más compacta y menos ambigua que prosa o un objeto JS comentado.

## Estructura nueva: carpeta en vez de fichero único

`design/docs/ARCHITECTURE.md` se sustituye por `design/docs/architecture/`, con estos ficheros (mapeando las secciones actuales, ya identificadas por su índice real):

- **`index.md`** — §1 Objetivo y restricciones, §2 Arquitectura por capas (diagrama de dependencias), §7 Convenciones de código, §8 Checklist de funcionalidades transversales a revisar al añadir un tipo nuevo. Es el fichero que se lee siempre primero: corto, y contiene además una tabla-índice de qué cubre cada uno de los demás ficheros (para poder decidir cuáles hacen falta sin abrirlos).
- **`component-model.md`** — §4 Modelo de datos de componente: tabla de campos (nombre/tipo/default/para qué sirve/quién lo edita), "Copias vinculadas" y "Tipos de componente implementados" (tabla por tipo con sus `properties` específicas). Es la sección más grande hoy; si tras aplicar las reglas de reescritura sigue siendo grande, se separa en `component-model.md` + `component-types.md`.
- **`groups-resources.md`** — §4.1 Modelo de grupo, §4.2 Modelo de recurso (galería), §4.3 Migración de `'ficha'`, §4.4 Portapapeles de estilo.
- **`modes.md`** — §3 Modo juego vs modo edición: modelo compartido, paneles (Componentes/Recursos/Grupos), selección, menús contextuales, indicadores, z-index, título editable.
- **`ui-layer.md`** — §5 Capa UI, módulos reutilizables.
- **`persistence-build.md`** — §6 Flujo de desarrollo y build, §6.1 Persistencia y guardado a fichero.

## Reglas de reescritura (aplicadas sección a sección al migrar contenido)

1. **Fuera el historial inline.** Ninguna referencia a `cambio NNNNN`/`fix NNNNN` ni prosa que explique cuándo o por qué cambió algo — solo el comportamiento vigente. Las migraciones de datos legacy (`migrateBloqueado`, `migrateGrupoIdToGrupoIds`...) sí se mantienen porque son comportamiento actual del código (siguen ejecutándose), pero sin el "por qué histórico".
2. **Una idea por línea.** Los párrafos-bloque de hoy (algunos de 3000+ caracteres en una sola línea) se trocean en bullets cortos y autocontenidos, para que se puedan localizar y leer parcialmente (grep/offset) sin cargar la sección entera.
3. **Directorio en vez de fichero único**, con `index.md` como mapa — ya descrito arriba.
4. **Tablas donde el contenido es tabular** (campos de componente, propiedades por tipo, campos de grupo/recurso) en vez de bloques de objeto JS comentado o listas anidadas.

En la práctica, 1/2/4 se aplican juntos en una sola pasada de reescritura por sección (no tiene sentido trocear líneas y luego, aparte, quitarles el historial), y 3 es el contenedor donde aterriza cada sección ya reescrita.

## Cambios de configuración (`ms-context.json` / `schema.json`)

En `.claude/skills/ms-init/schema.json`: renombrar `framework.docs.tech.architectureDocPath` (string, fichero) → `framework.docs.tech.architectureDocDir` (string, carpeta). Actualizar su `description` para explicar la convención: la carpeta debe contener `index.md`, que resume qué cubre cada fichero hermano. Actualizar también el bloque `examples` del propio schema.

En `.claude/ms-context.json` de este repo: `docs.tech.architectureDocPath: "design/docs/ARCHITECTURE.md"` → `docs.tech.architectureDocDir: "design/docs/architecture"`.

Sin shims de compatibilidad con el nombre viejo — es config de un único proyecto, no una API externa.

## Skills a modificar

- **`ms-internal-tech-analysis/SKILL.md`** (el cambio funcional más importante): en vez de "lee el fichero completo (o la parte relevante si es muy extenso)", el paso 1 pasa a: (a) leer siempre `{architectureDocDir}/index.md` primero; (b) con el resumen de qué se está analizando (ya recibido como entrada) y la tabla-índice de `index.md`, decidir qué ficheros hermanos son relevantes y leer solo esos; (c) en caso de duda razonable sobre si un fichero es relevante, leerlo (mejor pasarse que quedarse corto). La regla de "no releer en el mismo ciclo si ya está en contexto" pasa a aplicarse por fichero individual, no al documento completo — esto es estrictamente más eficiente que hoy.
- **`ms-init/SKILL.md`** + `schema.json`: el paso de exploración busca una carpeta de arquitectura (o el fichero viejo, para poder migrarlo si algún día se reusa el flujo en otro proyecto) en vez de un único fichero; el paso de preguntas pide `architectureDocDir`; si hay que generar una versión mínima inicial, crea la carpeta con `index.md` + un único fichero de contenido en vez de un fichero suelto.
- **`ms-how/SKILL.md`** + `PLAN.template.md`: las menciones a `docs.tech.architectureDocPath` pasan a `architectureDocDir`; la sección (c) "Cambios de arquitectura" del plan debe indicar explícitamente **qué fichero(s)** de la carpeta hay que tocar, ya que ahora hay varios candidatos.
- **`ms-do/SKILL.md`**: paso 2.1 — actualizar el fichero (o ficheros) de `architectureDocDir` que correspondan al área tocada; si la solución introduce un tema nuevo que no encaja en ningún fichero existente, crear uno nuevo y añadirlo a la tabla-índice de `index.md` (mantenerlo sincronizado es parte de esta responsabilidad).
- **`ms-fix/SKILL.md`**: mismas menciones de nombre de campo en los criterios de "fast" (sin cambio de lógica, solo el nombre).
- **`.claude/ms-design.md`** y **`.claude/ms-guide.md`**: actualizar el ejemplo de `ms-context.json` (nombre de campo y valor) y cualquier prosa que hable de "el documento de arquitectura" en singular.
- **`src/core/state.js:125`**: el comentario que apunta a `ARCHITECTURE.md` pasa a apuntar a `design/docs/architecture/index.md`.

Fuera de alcance (no se tocan en este cambio): `STYLE_BIBLE.md`/`styleBibleDocPath` (mismo problema potencial, pero no se ha pedido); `changes/closed/**`, `.claude/improvement/**` y `.claude/plans/**` (son registros históricos, no parte del framework vivo).

## Orden de ejecución

1. Migrar contenido: leer `ARCHITECTURE.md` sección a sección y escribir cada una, ya reescrita (reglas 1/2/4), en el fichero nuevo que le corresponda dentro de `design/docs/architecture/` (regla 3), incluyendo la tabla-índice en `index.md`.
2. Borrar `design/docs/ARCHITECTURE.md`.
3. Actualizar `schema.json` y `.claude/ms-context.json` (rename + nuevo valor).
4. Actualizar las skills listadas arriba (`ms-internal-tech-analysis` primero, por ser el cambio funcional real; el resto son variaciones del mismo rename + aclaración de "qué fichero tocar").
5. Actualizar `ms-design.md`, `ms-guide.md` y el comentario de `state.js`.
6. Repasar que no queda ninguna referencia viva a `ARCHITECTURE.md` ni a `architectureDocPath` fuera de los históricos ya excluidos (`grep` de verificación).

## Verificación

- `grep -rn "architectureDocPath\|ARCHITECTURE\.md"` sobre `.claude/skills`, `.claude/ms-*.md`, `src/` y `.claude/ms-context.json` no debe devolver nada (solo quedará en `changes/closed/**`, histórico).
- `python .claude/skills/ms-init/scripts/check-context.py` sigue devolviendo `complete: true` (no depende de este campo, pero confirma que el JSON sigue siendo válido tras la edición).
- Cada fichero de `design/docs/architecture/` es visualmente Markdown válido (tablas bien formadas, sin líneas gigantes) y `index.md` referencia a los 5 ficheros restantes con una frase de qué cubre cada uno.
- Comparar de forma manual una entrada representativa del `ARCHITECTURE.md` viejo (p.ej. el campo `bloqueado` del modelo de componente) contra su equivalente en `component-model.md` nuevo para confirmar que el comportamiento actual descrito no se ha perdido, solo el historial.
