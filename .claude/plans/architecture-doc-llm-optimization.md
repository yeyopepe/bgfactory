# Reestructurar ARCHITECTURE.md y STYLE_BIBLE.md como documentación LLM-first

## Contexto

`design/docs/ARCHITECTURE.md` (340 líneas, ~76k tokens) es la fuente de verdad técnica que las skills `ms-*` leen antes de analizar cualquier change/fix. La propia skill `ms-internal-tech-analysis` señala en su propio `SKILL.md` que releer este documento completo (típicamente 2 veces por ciclo: `ms-new`/`ms-fix` y luego `ms-how`) es "el mayor coste evitable de todo el ciclo".

El origen del problema no es la información en sí, sino el formato: casi cada línea es un párrafo-ladrillo que mezcla el estado actual con el historial completo de cómo se llegó ahí (`cambio 00108`, `fix 00166`, etc.). Ese historial ya vive en `changes/implemented/` — no hace falta narrarlo también aquí. Además el documento es un único fichero monolítico que se lee entero aunque la tarea solo afecte a una parte pequeña.

`design/docs/stylebible/STYLE_BIBLE.md` (346 líneas, 84KB — líneas de hasta 4400 caracteres) tiene exactamente el mismo problema: historial inline (`cambio 00063`, `cambio 00077`...) mezclado con la convención vigente, en un único fichero que ya vive en carpeta propia pero sin partir por sección. `ms-internal-tech-analysis`, `ms-do`, `ms-how` y `ms-fix` ya tratan `architectureDocPath` y `styleBibleDocPath` de forma simétrica (misma regla de lectura, mismo criterio de "fast" en `ms-fix`, misma mención en el resumen final de `ms-do`), así que resolver esto para ambos documentos con el mismo patrón completa algo que el código de las skills ya asume, en vez de forzar una extensión artificial.

Objetivo: que ambos documentos dejen de narrar el pasado y pasen a describir solo el presente, en un formato que una skill pueda cargar de forma selectiva en vez de todo o nada. Ningún objetivo de legibilidad humana — el único lector es un LLM.

## Formato: Markdown, no JSON

JSON añade sintaxis (comillas, llaves, comas) que para contenido narrativo pesa más en tokens que Markdown equivalente, y fuerza a escapar texto libre. Los LLM están mucho más densamente entrenados en Markdown. Se mantiene Markdown en todo el documento, con **tablas** para lo que hoy son bloques de pseudo-código o listas de campos (el modelo de componente, los tipos concretos, el modelo de grupo/recurso) — eso sí es genuinamente tabular y una tabla es más compacta y menos ambigua que prosa o un objeto JS comentado.

## Convención de nombres: prefijo numérico, como en `design/docs/features/`

Los ficheros hermanos (todos salvo `index.md`) llevan un prefijo numérico de 2 dígitos (`01-`, `02-`...), igual que `design/docs/features/NNN-slug.md` con su `INDEX.md` — mismo motivo: localizar el fichero a simple vista (listado de carpeta, resultado de grep) sin tener que abrir el índice primero. `index.md` se queda sin numerar, igual que `INDEX.md` en `features/`, porque es el punto de entrada fijo, no uno más de la lista.

El número se asigna una vez, en el orden en que se listan más abajo, y no se reutiliza ni se renumera si más adelante se borra un fichero. Cuando `ms-do` cree un fichero nuevo por no encajar en ninguno existente (ver más abajo), le asigna el siguiente número libre de esa carpeta y lo añade a la tabla-índice de `index.md` — igual que el `upsert` de `ms-internal-doc-features` asigna número nuevo solo a funcionalidades nuevas.

## Estructura nueva de ARCHITECTURE.md: carpeta en vez de fichero único

`design/docs/ARCHITECTURE.md` se sustituye por `design/docs/architecture/`, con estos ficheros (mapeando las secciones actuales, ya identificadas por su índice real):

- **`index.md`** — §1 Objetivo y restricciones, §2 Arquitectura por capas (diagrama de dependencias), §7 Convenciones de código, §8 Checklist de funcionalidades transversales a revisar al añadir un tipo nuevo. Es el fichero que se lee siempre primero: corto, y contiene además una tabla-índice de qué cubre cada uno de los demás ficheros (para poder decidir cuáles hacen falta sin abrirlos).
- **`01-component-model.md`** — §4 Modelo de datos de componente: tabla de campos (nombre/tipo/default/para qué sirve/quién lo edita), "Copias vinculadas" y "Tipos de componente implementados" (tabla por tipo con sus `properties` específicas). Es la sección más grande hoy; si tras aplicar las reglas de reescritura sigue siendo grande, se separa en `01-component-model.md` + `02-component-types.md` (y el resto de números de la lista se desplaza en consecuencia).
- **`02-groups-resources.md`** — §4.1 Modelo de grupo, §4.2 Modelo de recurso (galería), §4.3 Migración de `'ficha'`, §4.4 Portapapeles de estilo.
- **`03-modes.md`** — §3 Modo juego vs modo edición: modelo compartido, paneles (Componentes/Recursos/Grupos), selección, menús contextuales, indicadores, z-index, título editable.
- **`04-ui-layer.md`** — §5 Capa UI, módulos reutilizables.
- **`05-persistence-build.md`** — §6 Flujo de desarrollo y build, §6.1 Persistencia y guardado a fichero.

## Estructura nueva de STYLE_BIBLE.md: de fichero único a varios ficheros en la misma carpeta

`design/docs/stylebible/STYLE_BIBLE.md` ya vive en su propia carpeta (`design/docs/stylebible/`) — el cambio aquí es partir ese único fichero en varios, mapeando las secciones actuales (índice real del documento):

- **`index.md`** — §1 Stack de estilos, §7 Nomenclatura de clases (BEM), §8 Patrones de componente (JS), §13 Qué NO hacer. Fichero que se lee siempre primero: las convenciones transversales más la tabla-índice de qué cubre cada uno de los demás ficheros.
- **`01-tokens-visual.md`** — §2 Design tokens (`:root`), §3 Tipografía, §4 Espaciado, §5 Bordes y esquinas, §6 Elevación/sombra/transición.
- **`02-componentes-layout.md`** — §9 Botones, §10 Layout, §11 Redimensionado (manejador de esquina), §11.1 Cabecera de tabla fija (`position: sticky`).
- **`03-modales-menus.md`** — §12 Icono de ayuda y todos sus sub-apartados (§12.1–§12.11): modal de error/éxito, cursores, etiqueta identificativa de componente, modales anchas y su botón maximizar, lista de selección agrupada, secciones en pestañas, menú desplegable de acciones, menú contextual, copiar/pegar estilo, grupo de botones icono-solo, título editable.

`STYLE_BIBLE.md` (el fichero) se borra tras la migración, igual que `ARCHITECTURE.md`.

## Reglas de reescritura (aplicadas sección a sección al migrar contenido, en ambos documentos)

1. **Fuera el historial inline.** Ninguna referencia a `cambio NNNNN`/`fix NNNNN` ni prosa que explique cuándo o por qué cambió algo — solo el comportamiento vigente. Las migraciones de datos legacy (`migrateBloqueado`, `migrateGrupoIdToGrupoIds`...) sí se mantienen porque son comportamiento actual del código (siguen ejecutándose), pero sin el "por qué histórico".
2. **Una idea por línea.** Los párrafos-bloque de hoy (algunos de 3000+ caracteres en una sola línea) se trocean en bullets cortos y autocontenidos, para que se puedan localizar y leer parcialmente (grep/offset) sin cargar la sección entera.
3. **Directorio en vez de fichero único**, con `index.md` como mapa y prefijo numérico en los ficheros hermanos — ya descrito arriba.
4. **Tablas donde el contenido es tabular** (campos de componente, propiedades por tipo, campos de grupo/recurso) en vez de bloques de objeto JS comentado o listas anidadas.

5. **Estilo telegráfico.** Sin artículos superfluos, sin adverbios de relleno, verbos en presente, sujeto implícito cuando se sobreentiende. No es compresión agresiva: cada referencia (nombre de campo, tipo, fichero) se mantiene explícita y sin ambigüedad — se recorta gramática, no información. Ejemplo: "El campo `bloqueado` controla en qué modo el componente no se puede mover, y se inicializa a `'ninguno'` por defecto" → "`bloqueado`: modo(s) donde componente no se mueve. Default `'ninguno'`."

En la práctica, 1/2/4/5 se aplican juntos en una sola pasada de reescritura por sección (no tiene sentido trocear líneas y luego, aparte, quitarles el historial), y 3 es el contenedor donde aterriza cada sección ya reescrita.

## Cambios de configuración (`ms-context.json` / `schema.json`)

En `.claude/skills/ms-init/schema.json`:
- Renombrar `framework.docs.tech.architectureDocPath` (string, fichero) → `framework.docs.tech.architectureDocDir` (string, carpeta).
- Renombrar `framework.docs.tech.styleBibleDocPath` (string, fichero) → `framework.docs.tech.styleBibleDocDir` (string, carpeta).
- Actualizar la `description` de ambos campos para explicar la convención: la carpeta debe contener `index.md`, que resume qué cubre cada fichero hermano.
- Actualizar también el bloque `examples` del propio schema para los dos campos.

En `.claude/ms-context.json` de este repo:
- `docs.tech.architectureDocPath: "design/docs/ARCHITECTURE.md"` → `docs.tech.architectureDocDir: "design/docs/architecture"`.
- `docs.tech.styleBibleDocPath: "design/docs/stylebible/STYLE_BIBLE.md"` → `docs.tech.styleBibleDocDir: "design/docs/stylebible"`.

Sin shims de compatibilidad con los nombres viejos — es config de un único proyecto, no una API externa.

## Skills a modificar

Confirmado por grep sobre `.claude/skills/*/SKILL.md`: de las skills añadidas después de la primera versión de este plan (`ms-new`, `ms-status`, `ms-todo`, `ms-internal-workflow`, `ms-internal-doc-features`, `ms-internal-mockups-html`/`ascii`), ninguna menciona `architectureDocPath`/`styleBibleDocPath`/`ARCHITECTURE.md`/`STYLE_BIBLE.md`. El listado de abajo sigue siendo completo.

- **`ms-internal-tech-analysis/SKILL.md`** (el cambio funcional más importante): en vez de "lee el fichero completo (o la parte relevante si es muy extenso)", el paso 1 pasa a, **para cada uno de `architectureDocDir` y `styleBibleDocDir` que esté configurado**: (a) leer siempre `{dir}/index.md` primero; (b) con el resumen de qué se está analizando (ya recibido como entrada) y la tabla-índice de `index.md`, decidir qué ficheros hermanos son relevantes y leer solo esos; (c) en caso de duda razonable sobre si un fichero es relevante, leerlo (mejor pasarse que quedarse corto). La regla de "no releer en el mismo ciclo si ya está en contexto" pasa a aplicarse por fichero individual, no al documento completo — esto es estrictamente más eficiente que hoy, y se aplica igual a ambos documentos.
- **`ms-init/SKILL.md`** + `schema.json`: el paso de exploración busca una carpeta de arquitectura y una de biblia de estilo (o los ficheros viejos, para poder migrarlos si algún día se reusa el flujo en otro proyecto) en vez de ficheros únicos; el paso de preguntas pide `architectureDocDir` y `styleBibleDocDir`; si hay que generar una versión mínima inicial de cualquiera de los dos, crea la carpeta con `index.md` + un único fichero de contenido en vez de un fichero suelto.
- **`ms-how/SKILL.md`** + `PLAN.template.md`: las menciones a `docs.tech.architectureDocPath`/`docs.tech.styleBibleDocPath` pasan a `architectureDocDir`/`styleBibleDocDir`; la sección (c) "Cambios de arquitectura" del plan debe indicar explícitamente **qué fichero(s)** de cada carpeta hay que tocar, ya que ahora hay varios candidatos por documento.
- **`ms-do/SKILL.md`**: paso 2.1 — actualizar el fichero (o ficheros) de `architectureDocDir`/`styleBibleDocDir` que correspondan al área tocada; si la solución introduce un tema nuevo que no encaja en ningún fichero existente de esa carpeta, crear uno nuevo con el siguiente número libre (`NN-slug.md`, sin reutilizar ni renumerar los existentes) y añadirlo a su tabla-índice de `index.md` (mantenerlo sincronizado es parte de esta responsabilidad, para ambos documentos).
- **`ms-fix/SKILL.md`**: mismas menciones de nombre de campo (`architectureDocPath`→`architectureDocDir`, `styleBibleDocPath`→`styleBibleDocDir`) en los criterios de "fast" (sin cambio de lógica, solo el nombre).
- **`.claude/ms-design.md`** y **`.claude/ms-guide.md`**: actualizar el ejemplo de `ms-context.json` (nombres de campo y valores de ambos documentos) y cualquier prosa que hable de "el documento de arquitectura"/"la biblia de estilo" en singular como fichero.
- **`src/core/state.js:125`**: el comentario que apunta a `ARCHITECTURE.md` pasa a apuntar a `design/docs/architecture/index.md` (o al fichero numerado concreto si la referencia era a la sección del modelo de componente, no al índice general).
- **`src/styles/main.css`**, **`src/ui/componentModal.js`**, **`src/ui/contextMenu.js`**, **`src/ui/componentRenderer.js`**, **`src/ui/boardPatternModal.js`**, **`src/ui/styleClipboardSelectionModal.js`**, **`src/core/cardProportions.js`**, **`src/core/colorUtils.js`**: cualquier comentario que enlace a `STYLE_BIBLE.md` pasa a apuntar al fichero concreto de `design/docs/stylebible/` que corresponda (no siempre `index.md` — depende de qué sección referenciaba).

Fuera de alcance (no se tocan en este cambio): `changes/closed/**`, `.claude/improvement/**` y `.claude/plans/**` (son registros históricos, no parte del framework vivo).

## Orden de ejecución

1. Migrar contenido de ARCHITECTURE.md: leerlo sección a sección y escribir cada una, ya reescrita (reglas 1/2/4), en el fichero nuevo que le corresponda dentro de `design/docs/architecture/` (regla 3), incluyendo la tabla-índice en `index.md`.
2. Borrar `design/docs/ARCHITECTURE.md`.
3. Migrar contenido de STYLE_BIBLE.md: mismo procedimiento, escribiendo cada sección en `index.md`/`01-tokens-visual.md`/`02-componentes-layout.md`/`03-modales-menus.md` dentro de `design/docs/stylebible/`, incluyendo su propia tabla-índice en `index.md`.
4. Borrar el `design/docs/stylebible/STYLE_BIBLE.md` viejo (queda solo la carpeta con los ficheros nuevos).
5. Actualizar `schema.json` y `.claude/ms-context.json` (los dos renames + los dos nuevos valores).
6. Actualizar las skills listadas arriba (`ms-internal-tech-analysis` primero, por ser el cambio funcional real; el resto son variaciones del mismo rename + aclaración de "qué fichero tocar", aplicadas a la vez para `architectureDocDir` y `styleBibleDocDir`).
7. Actualizar `ms-design.md`, `ms-guide.md`, el comentario de `state.js` y los comentarios a `STYLE_BIBLE.md` en los ficheros de `src/` listados arriba.
8. Repasar que no queda ninguna referencia viva a `ARCHITECTURE.md`/`architectureDocPath` ni a `STYLE_BIBLE.md`/`styleBibleDocPath` fuera de los históricos ya excluidos (`grep` de verificación).

## Verificación

- `grep -rn "architectureDocPath\|ARCHITECTURE\.md\|styleBibleDocPath\|STYLE_BIBLE\.md"` sobre `.claude/skills`, `.claude/ms-*.md`, `src/` y `.claude/ms-context.json` no debe devolver nada (solo quedará en `changes/closed/**`, histórico).
- `python .claude/skills/ms-init/scripts/check-context.py` sigue devolviendo `complete: true` (no depende de estos campos, pero confirma que el JSON sigue siendo válido tras la edición).
- Cada fichero de `design/docs/architecture/` y de `design/docs/stylebible/` es visualmente Markdown válido (tablas bien formadas, sin líneas gigantes); cada `index.md` referencia a los ficheros hermanos de su carpeta con una frase de qué cubre cada uno.
- Comparar de forma manual una entrada representativa de cada documento viejo contra su equivalente nuevo, para confirmar que el comportamiento actual descrito no se ha perdido, solo el historial: en ARCHITECTURE.md, el campo `bloqueado` del modelo de componente (→ `01-component-model.md`); en STYLE_BIBLE.md, la escala de radios de la sección 5 (→ `01-tokens-visual.md`).
- Los ficheros hermanos de ambas carpetas llevan prefijo numérico de 2 dígitos sin huecos ni duplicados (`01-`, `02-`...), y `index.md` no lo lleva.
