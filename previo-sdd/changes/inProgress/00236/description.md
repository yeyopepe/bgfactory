- **Name**: Alinear la documentación técnica con la convención `docs.tech` 0.9.6
- **Code**: 00236
- **Type**: change
- **Creation date**: 2026-09-03

## Full description

La documentación técnica del proyecto (las carpetas de arquitectura y de guía de estilo bajo `previo-sdd/design/docs/`) se escribió antes de la convención de documentación técnica que trae la versión 0.9.6 del proceso de trabajo del proyecto. Este cambio la actualiza para que cumpla esa convención, sin perder ninguno de los hechos que ya recoge: solo cambia la **forma** en que están escritos y organizados, no el contenido.

Se toma como base el borrador de plan guardado en `.claude/plans/fix-tech-doc.md`, pero ese borrador se redactó pensando en un escenario distinto (una copia aislada de la documentación, en rutas que no existen en este repositorio y sin acceso al código). Aquí se reinterpreta contra la documentación real del proyecto y con acceso al código, así que las comprobaciones que el borrador daba por imposibles (que cada concepto citado apunte a un símbolo real del código) sí se hacen.

### Situación de partida (lo que hoy no cumple la convención)

- **Numeración de los documentos**: cada documento lleva un número identificador de dos cifras (`01`, `02`…); la convención pide tres (`001`, `002`…).
- **Cabecera de cada documento**: la convención pide que las dos primeras líneas de cada documento numerado sean el título con su número (`# 001 — Título`) y una línea que indique el **área** temática a la que pertenece. Hoy ningún documento tiene número en el título ni línea de área.
- **El índice**: la convención dice que el índice de cada carpeta (`INDEX.md`) es solo una tabla de contenidos que se regenera automáticamente, sin texto propio. Hoy los dos índices están escritos a mano y contienen material de fondo que debería vivir en documentos numerados: en arquitectura, los objetivos y restricciones del proyecto, el esquema de capas, las convenciones de código y una lista de comprobaciones para añadir un tipo nuevo; en la guía de estilo, el "stack" de estilo, la convención de nombres, los patrones de componente y un bloque extenso de "qué no hacer" con sus casos particulares.
- **El árbol de nombres** (`00-namespace.md`): el documento existe y tiene ya las cabeceras normativas correctas, pero su árbol sigue con el texto de ejemplo de la plantilla, sin poblar con los conceptos reales del proyecto.
- **Estilo de redacción**: la convención pide una redacción "de notación primero" (tablas, contratos, aserciones compactas; la prosa es la excepción y va marcada con etiquetas). La guía de estilo ya está casi toda en ese estilo; en arquitectura, los dos primeros documentos ya son tablas, pero los cuatro restantes (grupos y recursos, modos, capa de interfaz, persistencia y build) son prosa narrativa densa.
- **Referencias entre documentos**: muchas apuntan con una ruta larga que ya no es válida y con los números antiguos de dos cifras; deben pasar a referencias relativas entre documentos hermanos con los números nuevos.
- **Frases vagas y anáforas**: hay expresiones sin cifra ("mucho más grande de lo esperado", "demasiado grande") y referencias del tipo "esa clave", "lo anterior", "el primero" que la convención pide sustituir por el identificador o la ruta concretos.

### Alcance acordado con el usuario

- **Reescritura "de notación primero"**: solo donde hoy hay prosa real. Lo que ya está bien tabulado (los dos primeros documentos de arquitectura y casi toda la guía de estilo) se respeta; solo se le aplica el arreglo mecánico de cabeceras y referencias. No se hace una reescritura completa de todo.
- **Árbol de nombres**: se puebla con los conceptos y las decisiones clave (campos y colecciones principales, contratos de las funciones más citadas, decisiones de diseño que el texto ya justifica), no con un árbol exhaustivo de todos los campos de todos los tipos.
- **Comprobación de anclas**: cada concepto del árbol de nombres que apunte a un símbolo del código se verifica contra el código real (que el archivo y el símbolo existen).
- **Carpeta huérfana**: existe una segunda carpeta de documentación (`previo-sdd/docs/`, con subcarpetas de arquitectura, funcionalidades y estilo, todas vacías) que parece un residuo de una configuración anterior. Queda **fuera del alcance** de este cambio; solo se deja constancia de ella para limpiarla por separado.

### Cómo debe quedar el resultado

- Todos los documentos numerados con número de tres cifras, con su título numerado y su línea de área.
- Los dos índices, solo como tabla de contenidos regenerada automáticamente (título = nombre de la carpeta, agrupación por área, una línea por documento), sin texto propio ni tablas de "documentos hermanos" ni rutas antiguas.
- El material de fondo que hoy vive en los índices, trasladado a documentos numerados nuevos: en arquitectura, un documento de visión general (objetivos, restricciones y capas) y documentos de convenciones (convenciones de código y lista de comprobaciones para añadir un tipo, esta última como tabla); en la guía de estilo, repartido entre los documentos de estilo que correspondan por tema.
- El árbol de nombres poblado con los conceptos y decisiones clave del proyecto, con sus anclas al código verificadas.
- La prosa que quede, justificada (una sola frase, o marcada como motivación/aviso); el resto en tabla o notación.
- Sin frases vagas sin cifra, sin anáforas, con las referencias entre documentos apuntando a los números nuevos.
- Ningún hecho perdido respecto a la documentación actual: se comprueba con una comparación del antes y el después.

## Technical notes

- **Rutas reales de la documentación** (según `.claude/pv-context.json`, `framework.workFolder = "/previo-sdd"`):
  - `framework.docs.tech.architectureDocDir = "design/docs/architecture"` → `previo-sdd/design/docs/architecture/` (`00-namespace.md`, `01-component-model.md` … `06-persistence-build.md`, `INDEX.md`).
  - `framework.docs.tech.styleBibleDocDir = "design/docs/style"` → `previo-sdd/design/docs/style/` (`01-tokens-visual.md`, `02-componentes-layout.md`, `03-modales-menus.md`, `INDEX.md`).
  - `framework.docs.functional.featuresDocPathDir = "design/docs/features"` (no se toca en este cambio).
  - El borrador `.claude/plans/fix-tech-doc.md` apunta a una carpeta de datos de prueba que no existe en este repositorio; se ignora esa ruta por completo y se trabaja sobre las rutas reales de arriba.
- **Mapa de áreas propuesto** (valor de la línea `**Area**:`, por el que agrupa el índice):
  - arquitectura: `Overview`, `Data model`, `Component types`, `Groups & resources`, `Modes`, `UI layer`, `Persistence & build`, `Conventions`.
  - estilo: `Tokens`, `Layout & components`, `Modals & menus`.
- **Renumeración** (sin reordenar ni renumerar huecos):
  - arquitectura: se inserta `001-overview.md` nuevo (hoy el índice hace de visión general y no debe); `01-component-model` → `002`, `02-component-types` → `003`, `03-groups-resources` → `004`, `04-modes` → `005`, `05-ui-layer` → `006`, `06-persistence-build` → `007`; más `008-code-conventions.md` y `009-cross-cutting-checklist.md` nuevos (área `Conventions`). Números exactos y reparto final, a decidir en el plan técnico.
  - estilo: `01-tokens-visual` → `001`, `02-componentes-layout` → `002`, `03-modales-menus` → `003`. El material de fondo del índice de estilo (`§1` stack, `§7` nombres BEM, `§8` patrones de componente, `§13` "qué no hacer" y sus subsecciones de biseles/recortes) se reparte entre esos tres por tema, o en un documento de convenciones de estilo nuevo; reparto exacto a decidir en el plan técnico.
- **Herramientas del framework para los ficheros**:
  - `python .claude/skills/pv-internal-doc-files/scripts/rebuild-index.py --folder <ruta>` regenera `INDEX.md`. Acepta `--title`, pero la convención es dejar el H1 por defecto (nombre de carpeta con mayúscula inicial); **no** pasar `--title`. Sirve además para validar que las cabeceras `# NNN — título` + `**Area**:` son parseables.
  - `python .claude/skills/pv-internal-doc-files/scripts/next-feature-number.py --folder <ruta>` calcula el siguiente número libre. `slugify.py` calcula el slug del nombre de fichero.
  - `rebuild-index.py`/`next-feature-number.py` ignoran `INDEX.md` y cualquier `00-*.md`.
  - `00-namespace.md` se edita directamente (Read/Edit), nunca vía el flujo `upsert` de `pv-internal-doc-files`.
- **Reglas de redacción a aplicar**: las *Writing rules* de `.claude/skills/pv-internal-doc-technical/SKILL.md` (arquitectura) y `.claude/skills/pv-internal-doc-style/SKILL.md` (estilo), que extienden a las primeras. Etiquetas fijas en inglés, incluidas `[gotcha]` y `[motivación]`. Sin opción de idioma: inglés técnico fijo (no hay `docs.tech.language`).
- **Anclas del árbol de nombres, ya verificadas contra `/src`**:
  - `core/group.js#getEffectiveGeneralProps` (existe, línea 27) — resuelve `bloqueado`/`oculto`/`mostrarTooltip`/`subirAlMoverInteractuar`/`etiquetaIds` efectivos de un componente agrupado.
  - `core/resource.js#isResourceInUse` + helper local `collectDeepValues` (existen) — detección de recurso en uso por recorrido profundo de `component.properties`.
  - `core/component.js#nextGroupId` (existe, línea 130) — id `grupo-N` al formar un grupo.
  - Otros símbolos citados por la doc (`renderComponentsOnTable`, `shadeColor`, `getCartaShapeCss`, `getHexInnerClipPath`, `getTriangleInnerClipPath`, `computeSacarCartaDeMazo`, `migrateFichaComponent`, `resolveTextVariables`…) existen en `src/core/*` y `src/ui/*` con la forma que describe la documentación. No se detectó ninguna inconsistencia documentación↔código.
- **Contenido candidato del árbol de nombres** (alcance "conceptos + decisiones clave"):
  - `component.*`: `order` (número, `1` = arriba), `copyOf` (`string|null`), `sincronizado` (`boolean`), `groupId` (`string|null`), `bloqueado in {ninguno, juego, todos}`, `oculto` (`boolean`), `subirAlMoverInteractuar` (`boolean`), `profundidad: number [0..40] = 0`, `colorExtrusion: string|null`, `accionClickDerecho in {ninguno, menuContextual}`.
  - `group.*`: `bloqueado`, `oculto`, `mostrarTooltip`, `subirAlMoverInteractuar`, `etiquetaIds`; `group.effectiveProps.rule` (ancla a `getEffectiveGeneralProps`).
  - `tag.*`: `id`, `name`; unicidad de nombre normalizada.
  - `resource.*`: `type in {imagen, tipografia}`, `dataUrl`, `mimeType`; `resource.usage.rule` (ancla a `isResourceInUse`).
  - `persistence.serializedFields = [components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, appTitle]`.
  - `ui.token.*`: `--accent-blue = #2c7dd8`, `--accent-blue-dark = #123a66`, `--accent-blue-light = #eaf3fc`, `--section-accent = #5b5f97`, `--error = #d32f2f`, `--radius-sm = 4px`, `--radius-lg = 8px`, `--shadow-1`, `--shadow-2`, `--transition-fast = 150ms ease`.
  - `ui.class.*`: `is-copy`, `is-group-passenger`, `lifted`, `drop-target`, `carta--flip-feedback`.
  - `ui.elevation.*`: 3 niveles (0 plano, 1 flotación sutil, 2 overlay).
  - Decisiones (`path.decision.<slug>` + `[motivación]` de una línea): `group.persist.decision.key-componentGroups` (no se usa la clave `groups` porque ya es alias de compatibilidad de `tags`); `ui.class.decision.is-group-passenger-wins-over-is-copy` (declarada después en la cascada CSS); `component.copy.decision.non-synced-keys` (`x`/`y`, `order`, `groupId`, `properties.resultadoActual`, `properties.caraActual` nunca se sincronizan entre original y copia).
- **Seguridad**: ninguna categoría del checklist de `pv-internal-tech-security` aplica — el cambio solo edita ficheros `.md`.
- **Verificación de "ningún hecho perdido"**: comparar `git diff` de cada documento antes/después; el criterio es que solo cambie la forma (numeración, cabeceras, tablas vs. prosa, referencias), nunca que desaparezca una afirmación.
