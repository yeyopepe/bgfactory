- **Creation date**: 2026-09-03
- **Risk**: 1/10 — Minimal risk — local change, with a safety net (tests) or easily reversible

## (a) Functional notes

**Out of scope:**
- La carpeta huérfana `previo-sdd/docs/` (subcarpetas `architecture/`, `features/`, `style/` vacías, sin historia en git). Solo se deja constancia; su limpieza va aparte.
- La carpeta de funcionalidades (`previo-sdd/design/docs/features/`): ya cumple la convención (números de 3 cifras, `INDEX.md` generado). No se toca.
- Reescritura *notation-first* completa: los documentos ya tabulados (`002-component-model`, `003-component-types` de arquitectura; casi toda la guía de estilo) solo reciben el arreglo mecánico de cabecera y referencias, no una reescritura de forma.
- El código de la aplicación (`/src`): no se toca ni una línea. Este cambio es solo documentación `.md`.
- Ampliar el árbol de nombres a todos los campos de todos los tipos de componente: se limita a conceptos y decisiones clave.

**Doubts resolved with the user:**
- *¿Sobre qué documentación se trabaja?* → La real del proyecto (`previo-sdd/design/docs/{architecture,style}`), in situ, con verificación de anclas contra `/src`. El borrador `.claude/plans/fix-tech-doc.md` apuntaba a una carpeta de datos de prueba que no existe en este repo; se reinterpreta con rutas y supuestos correctos.
- *¿Se crean los ficheros nuevos de `Conventions` y el `001-overview.md`?* → Sí, tal como propone el borrador: vaciar `INDEX.md` de contenido sustantivo y repartirlo en documentos numerados nuevos.
- *¿Qué profundidad de reescritura notation-first?* → "Estructura + gaps": reescribir a notación solo donde hoy hay prosa real; respetar lo ya tabulado.
- *¿Hasta dónde se puebla `00-namespace.md`?* → "Conceptos + decisiones clave", no árbol exhaustivo.
- *¿Qué se hace con `previo-sdd/docs/` huérfana?* → Ignorarla en este cambio.

## (b) Technical solution

### Salvaguardas contra el error de documentación (aplican a TODAS las fases)

El riesgo real de este cambio no es romper código (no se toca `/src`), sino **afirmar algo falso sobre cómo funciona el proyecto** o **perder un matiz verdadero** al reorganizar y reescribir. Reglas de obligado cumplimiento durante la implementación:

- [ ] **S1 — La reescritura notation-first solo comprime, nunca reinterpreta.** Cada celda de una tabla nueva (o cada línea de notación nueva) tiene que ser trazable a una frase concreta del texto original. Si para rellenar una columna hay que deducir algo que el texto no dice → esa celda va vacía o con `?`, nunca con una suposición.
- [ ] **S2 — Al reescribir, verificar contra `/src` lo que sea comprobable.** La doc actual es anterior a 0.9.6 y puede tener imprecisiones ya. Si una afirmación que se está reescribiendo es fácil de comprobar en el código (una firma, un `= default`, un `enum`, un nombre de fichero/símbolo), se comprueba de paso. Si doc y código discrepan → **gana el código**, se corrige la afirmación y se anota como corrección en el reporte (no como "cambio de forma").
- [ ] **S3 — Ningún `anchor:` sin abrir el fichero y leer el símbolo.** No basta con `grep` que confirme que el símbolo existe. Para los nodos-contrato (`group.effectiveProps.rule`, `resource.usage.rule`, `persistence.serializedFields.rule`, `component.order.rule`, `group.id.rule`, `resource.typeForFileName.rule`) hay que leer la función y comprobar que el `pre:`/`post:`/descripción que se escribe corresponde a lo que hace de verdad. Un `anchor:` roto o un contrato mal redactado es **peor** que no tener nodo: se cita como verdad canónica en cada ciclo futuro de `pv-internal-tech-analysis`.
- [ ] **S4 — Una `.decision.<slug>` solo entra si hay una frase original que la respalde.** Las decisiones del árbol (`group.persist.decision.key-componentGroups`, `ui.class.decision.is-group-passenger-wins-over-is-copy`, `component.copy.decision.non-synced-keys`, `component.image.decision.unused`, `tag.persist.decision.compat-chain`) salen de frases que **ya están** en la doc actual ("deliberately not `groups` because…", "declared later in the cascade", "treated like position, never synced", "unused currently", la cadena de fallback `tags`/`groups`/`decks`). Regla: si no se puede señalar la frase de la que sale → la decisión **no entra**, se deja fuera y se dice en el reporte. Nada de inferir la motivación.
- [ ] **S5 — El contenido que se mueve de los `INDEX.md` a ficheros nuevos se mueve, no se reescribe.** `§1 Goal and constraints`, `§2 Layered architecture`, `§7 Code conventions`, `§8 Checklist`, y los `§1`/`§7`/`§8`/`§13` de estilo → van a los ficheros nuevos **tal cual**, con el mínimo cambio de forma imprescindible (viñetas → tabla solo en el `§8`, quitar la línea `See INDEX.md …`). Cuanto menos se toque al moverlo, menos margen de error. Si algún bloque movido necesita además reescritura notation-first, es un paso posterior y separado dentro de la misma fase.
- [ ] **S6 — Commit por fase, no un commit final.** Fase 1 (`git mv` a secas, sin tocar contenido) → un commit. Cabeceras + intros de arquitectura → otro. Cada fichero reescrito (`004`, `005`, `006`, `007`) → un commit por fichero. Ficheros nuevos → un commit. Namespace → un commit. Índices regenerados → un commit. Así un `git revert` puntual deshace una fase sin arrastrar el resto, y cada `git diff` es revisable.
- [ ] **S7 — `git diff` revisado al terminar CADA fichero, no en bloque al final.** Por cada fichero reescrito: leer el diff completo y, por cada línea eliminada, confirmar en voz alta que ese hecho sigue presente en el fichero en otra forma. Si no está → o vuelve, o se justifica explícitamente en el reporte por qué se elimina (p. ej. era una intro de relleno, o un intensificador sin cifra que la convención prohíbe).
- [ ] **S8 — Reporte final con la lista de puntos donde hubo criterio.** Al entregar (lo recoge también la Fase 5): lista explícita de (a) afirmaciones reformuladas — "estaba como prosa X, ahora como notación Y"; (b) frases vagas sustituidas por cifra — "`much larger than expected` → `~170–200px` según UA, de `main.css`"; (c) discrepancias doc↔código encontradas y cómo se resolvieron; (d) decisiones que NO se documentaron como `.decision.` y por qué. La revisión humana se centra en esos puntos, no en releer 1500 líneas.

### Fase 0 — Mapa de áreas y renumeración (decisión previa, sin editar aún)

- [x] **Fijar el mapa de áreas** (valor de la línea `**Area**:`, por el que agrupa `rebuild-index.py`):
  - arquitectura: `Overview`, `Data model`, `Component types`, `Groups & resources`, `Modes`, `UI layer`, `Persistence & build`, `Conventions`.
  - estilo: `Tokens`, `Layout & components`, `Modals & menus`.
- [x] **Fijar la tabla de renumeración** (sin reordenar ni renumerar huecos):

  | Actual | Nuevo | Título (`# NNN — …`) | `**Area**:` |
  |---|---|---|---|
  | *(nuevo)* | `001-overview.md` | `001 — Overview` | `Overview` |
  | `01-component-model.md` | `002-component-model.md` | `002 — Component data model` | `Data model` |
  | `02-component-types.md` | `003-component-types.md` | `003 — Implemented component types` | `Component types` |
  | `03-groups-resources.md` | `004-groups-resources.md` | `004 — Tags, resources, ficha migration, style clipboard` | `Groups & resources` |
  | `04-modes.md` | `005-modes.md` | `005 — Play mode vs edit mode` | `Modes` |
  | `05-ui-layer.md` | `006-ui-layer.md` | `006 — UI layer: reusable modules` | `UI layer` |
  | `06-persistence-build.md` | `007-persistence-build.md` | `007 — Development/build flow and persistence` | `Persistence & build` |
  | *(nuevo)* | `008-code-conventions.md` | `008 — Code conventions` | `Conventions` |
  | *(nuevo)* | `009-cross-cutting-checklist.md` | `009 — Checklist: adding a type or a state collection` | `Conventions` |

  Estilo:

  | Actual | Nuevo | Título | `**Area**:` |
  |---|---|---|---|
  | `01-tokens-visual.md` | `001-tokens-visual.md` | `001 — Visual tokens, typography, spacing, borders, elevation` | `Tokens` |
  | `02-componentes-layout.md` | `002-componentes-layout.md` | `002 — Buttons, layout, resize, sticky table header` | `Layout & components` |
  | `03-modales-menus.md` | `003-modales-menus.md` | `003 — Modals, menus, tooltips, identification patterns` | `Modals & menus` |
  | *(nuevo)* | `004-naming-and-patterns.md` | `004 — Class naming (BEM) and JS component patterns` | `Layout & components` |

- [x] **Confirmar que `next-feature-number.py` no interfiere**: al renumerar a mano, los ficheros ya llevarán su `NNN` en el nombre y en el título. `next-feature-number.py` solo se usaría para un fichero nuevo cuyo número no se quiera fijar a mano; aquí se fijan todos. No se usa `upsert` de `pv-internal-doc-files` para ninguno (edición directa Read/Write/`git mv`).

### Fase 1 — Renumerar ficheros y forzar cabeceras (arquitectura)

> Aplica S1, S2, S5, S6, S7 en cada fichero reescrito de esta fase (`004`, `005`, `006`, `007`).

- [x] **`git mv` de cada fichero de `previo-sdd/design/docs/architecture/`** según la tabla de Fase 0 (`01-component-model.md` → `002-component-model.md`, etc.). Hacerlo con `git mv` para conservar la historia, **en un commit propio sin tocar contenido** (S6) — así git registra el rename al 100% y los diffs de contenido posteriores quedan limpios. `00-namespace.md` e `INDEX.md` no se renombran.
- [x] **`002-component-model.md` — cabecera + intro.** Sustituir la primera línea `# Component data model` por las dos líneas `# 002 — Component data model` y `**Area**: Data model`. Eliminar el párrafo introductorio `Generic, extensible model: no structural change needed to define concrete types (cards, tokens, board, tracks...). See 02-component-types.md for the implemented types.` — su primer hecho ("modelo genérico y extensible, sin cambio estructural para tipos nuevos") pasa a una línea `[motivación]` o a un nodo `.decision.` en `00-namespace.md` (ver Fase 3); la referencia a `02-component-types.md` se resuelve al citarlo más abajo en el cuerpo. Resto del cuerpo: sin cambios (ya es tabla).
- [x] **`003-component-types.md` — cabecera + intro.** Primera línea `# Implemented component types` → `# 003 — Implemented component types` + `**Area**: Component types`. Mantener el párrafo `Eight types. Creation always goes through ui/componentTypeModal.js …` (es un hecho, no una intro de relleno). Resto del cuerpo sin cambios (ya tabulado).
- [x] **`004-groups-resources.md` — cabecera + reescritura notation-first.** Primera línea `# Tags, resources, 'ficha' migration, style clipboard` → `# 004 — Tags, resources, ficha migration, style clipboard` + `**Area**: Groups & resources`. Reescritura de la prosa densa:
  - "Tag data model", "Group data model", "Resource data model": ya son tablas de campos + prosa de las funciones expuestas. Dejar las tablas; convertir cada bloque "`core/X.js` exposes:" de lista-prosa a lista `- funcName(sig) -> tipo — efecto` compacta.
  - "Backward compatibility" (cadena de 3 niveles `tags`/`groups`/`decks`): tabla `clave leída | fallback 1 | fallback 2` o secuencia `tags/tagPanelState → groups/groupPanelState → decks/deckPanelState`.
  - La justificación "Persisted under the key `componentGroups` … deliberately not `groups`, because that key is already reserved as a backward-compatibility alias of `tags`" → `[motivación]` de una línea, y nodo `group.persist.decision.key-componentGroups` en `00-namespace.md`.
  - "'ficha' component migration": los sub-puntos de `migrateFichaProperties` (mapeo `forma`→`proporcion`, `bordeColor`/`bordeGrosor`, por `fondoTipo`) → tabla `campo ficha | destino carta | caso de error`. "Two use points, different criteria for errors" → tabla `punto de uso | fichero | trata errors`.
  - "Style clipboard": "Data shape: `{ generales?, proporcion?, caraFrontal?, caraTrasera? }`" ya es notación; el "Usage flow" (Copy / Paste) → secuencia numerada.
  - Anáforas ("that key", "the former") → repetir el identificador/ruta.
- [ ] **`005-modes.md` — cabecera + reescritura notation-first.** Primera línea `# Play mode vs edit mode` → `# 005 — Play mode vs edit mode` + `**Area**: Modes`. Reescritura:
  - Los bloques `- **Nombre**: prosa` de "Edit mode: table and panels", "Multi-selection with Ctrl", "Visual indicators in edit mode", "Restricted drag in edit mode" → tablas o listas `condición → efecto`.
  - "Groups in edit mode": ya tiene una tabla (`Active selection | Context menu | Agrupar | Desagrupar`). El resto (Atomic selection, Automatic dissolution, Block movement, "Componentes" panel) → listas `- regla` con la ruta namespace `group.effectiveProps.rule` citada en vez de re-explicar `getEffectiveGeneralProps`.
  - Anti-expectativas → `[gotcha]`:
    - `[gotcha] .is-group-passenger wins over .is-copy` (declarada después en la cascada CSS).
    - `[gotcha] individual editing of a grouped member: double click on the canvas stays blocked, but the panel "Editar" button is re-enabled` (00201, revierte parcialmente 00193).
    - `[gotcha] a card inside a mazo is NOT drawn on the table in ANY mode` (a diferencia de `oculto`, que solo filtra en modo juego).
  - Anáforas ("the former", "the above", "that value") → repetir identificador.
- [ ] **`006-ui-layer.md` — cabecera + reescritura notation-first parcial.** Primera línea `# UI layer — reusable modules` → `# 006 — UI layer: reusable modules` + `**Area**: UI layer`. Reescritura:
  - Cada módulo `- **`ui/x.js`**: prosa larga` → encabezado del módulo + firma en code span de la función que expone + tabla de parámetros `Param | Type | Default | Effect` cuando la firma tiene ≥3 parámetros con opciones (`renderComponentsOnTable`, `attachResizeHandle`, `openImageAdjustModal`, `openVisualEditorModal`, `createRotationSliderField`, `attachColumnResizing`).
  - Para `renderComponentsOnTable`: firma completa en bloque de código + tabla de las opciones (`onSelect`, `onToggleSelect`, `selectedIds`, `onMove`, `onResize`, `canMove`, `onContextMenu`, `identifyMode`, `liftOnDrag`, `showLockIndicator`, `showHiddenIndicator`) con columna Efecto; las "Rule for any type that clips its own visual content" y demás notas → líneas `[gotcha]`/prosa mínima.
  - Conservar tal cual los `[gotcha]`/`[motivación]` ya presentes del fix 00235 (`getEffectiveCanvasMaxSide()` NOT called per face; el bloque de `getEditorWorkArea`).
  - "Window size" del editor visual: los tres estados (`maximized`, `manualSize`, default) → tabla `estado | qué fija el tamaño | persiste entre aperturas`.
- [ ] **`007-persistence-build.md` — cabecera + reescritura notation-first.** Primera línea `# Development/build flow and persistence` → `# 007 — Development/build flow and persistence` + `**Area**: Persistence & build`. Reescritura:
  - "Autosave": la lista de eventos suscritos y el objeto serializado ya son casi notación; dejar `serializedFields = [components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, appTitle]` y citar `persistence.serializedFields` (nodo nuevo en `00-namespace.md`).
  - El diagrama de arranque (bloque ``` de `Startup (main.js): loadState() → …`) se mantiene como pseudocódigo (ya cumple la notación de "Temporal sequence / call flow").
  - "Export/Import with selection": el flujo import/merge → secuencia numerada + tabla `modo | id existente | efecto` (`overwrite` → lista vacía; `add` + `conflictMode: 'overwrite'` → reemplaza; `add` + `conflictMode: 'keepBoth'` → renombra con sufijo `-imported`).
  - "Default resources and backfill": condición `resourcesSeeded !== true` → tabla `estado del save | acción` en vez de prosa.
- [ ] **`001-overview.md` — crear.** Dos líneas de cabecera `# 001 — Overview` + `**Area**: Overview`. Cuerpo = contenido real trasladado desde `architecture/INDEX.md`:
  - `## Goal and constraints` = el `§1` actual del índice (prototipo digital en navegador, entregable HTML autocontenido, doble clic `file://`, build en Python, `/src` por capas, `src/scripts/build.py` → `src/_output/versions/`).
  - `## Layered architecture` = el `§2` actual (bloque de capas `core/ modes/ ui/ data/ main.js` + el bloque de dependencias entre capas + las 6 viñetas: `core` sin dependencias, `ui`→`core`, `modes` compone `ui`+`core`, `main.js` cablea todo, `state.js` única fuente de verdad, bus de eventos `core/eventBus.js`).
  - Referencias internas del cuerpo: `design/docs/style/` → `../style/INDEX.md`.
- [ ] **`008-code-conventions.md` — crear.** Cabecera `# 008 — Code conventions` + `**Area**: Conventions`. Cuerpo = el `§7 "Code conventions"` actual de `architecture/INDEX.md` (ES modules por capa, sin dependencias externas por defecto, librería nueva solo si el bundle se empotra entero, recursos en `/src/img`, convenciones visuales en `design/docs/style/`, `src/test/` con `.json`, estilo de comentarios telegráfico, excepción `src/vendor/`/`src/scripts/vendor/`). Referencia `design/docs/style/` → `../style/INDEX.md`. Reescritura mínima: viñetas → viñetas, sin prosa de relleno.
- [ ] **`009-cross-cutting-checklist.md` — crear como tabla.** Cabecera `# 009 — Checklist: adding a type or a state collection` + `**Area**: Conventions`. Cuerpo = el `§8 "Checklist when adding a new type/collection"` actual de `architecture/INDEX.md`, convertido de 9 viñetas de prosa a tabla `Aspecto | Fichero(s) | Qué revisar`:

  | Aspecto | Fichero(s) | Qué revisar |
  |---|---|---|
  | Persistencia y guardado a fichero | `core/persistence.js`, `core/fileExport.js` | Añadir la colección/campo nuevo a `serializedFields` en ambos y a la suscripción de autosave — si no, ni se guarda ni se exporta |
  | Detección de recurso en uso | `core/resource.js` (`isResourceInUse`/`getComponentsUsingResource` + `collectDeepValues`) | Si el tipo nuevo guarda referencias fuera de objetos/arrays planos (p. ej. claves de `Map`), borrar ese recurso no se bloquea aunque esté en uso |
  | Creación de tipo nuevo | `ui/componentTypeModal.js` + `createDefaultComponent`/`DEFAULT_*_PROPERTIES` de `ui/componentModal.js` | Lista de tipos disponibles y valores por defecto hardcodeados; sin añadirlo en ambos no aparece en el selector ni tiene defaults |
  | Render en la mesa | `ui/componentRenderer.js` (`renderComponentsOnTable`) | Rama de dibujo propia; respetar overflow en contenedor interno, orden por `order`, soporte `onSelect`/`onToggleSelect`/`onMove`/`onResize` |
  | Resize con proporción fija | `ui/resizeHandle.js` (parámetro `clamp`) | Tipos con proporción fija (`'dado'` 1:1, `'carta'` `getProporcionRatio`) pasan su propio `clamp`; `resizeHandle.js` no lo hace solo |
  | `getComponentsBounds` | `ui/componentRenderer.js` | Usa los mismos defaults que el render para el "Ajustar zoom"; si el tipo nuevo cambia los criterios de tamaño por defecto puede desincronizarse |
  | Recursos por defecto y su seeding | `data/defaultResources.js`, `main.js` | Un tipo de recurso nuevo (más allá de `'imagen'`/`'tipografia'`) o una extensión nueva obliga a revisar `resourceTypeForFileName` (`core/resource.js`) |
  | Guía de estilo | `design/docs/style/003-modales-menus.md` y otros | Revisar excepciones ya catalogadas (bisel de `'tableroSimple'`/`'dado'`, `border-radius` de contenedores destacados reusado por `'carta'`) antes de introducir una excepción nueva |
  | Menú contextual, badge de bloqueo, indicador de oculto | `ui/componentRenderer.js` | Un tipo que use `renderComponentsOnTable` obtiene `contextmenu` (`onContextMenu`), badge de bloqueo (`showLockIndicator`) y badge "Oculto" (`showHiddenIndicator`) sin nada específico; un tipo sin caja de relleno propia (como `'texto'`) sí debe respetar el patrón de contenedor interno y anclar sus badges con offsets propios |
  | Ficheros de test | `src/test/*.json` | No se actualizan solos; añadir un ejemplo del tipo nuevo ya configurado |

  Referencia `design/docs/style/` → `../style/003-modales-menus.md`.

### Fase 2 — Renumerar y reescribir la guía de estilo

> Aplica S1, S2, S5, S6, S7. Ojo con S2 en el bloque "Color field + associated thickness" de `004-naming-and-patterns.md`: la cifra que sustituye a "much larger than expected" hay que sacarla de `src/styles/main.css` / del comportamiento real, no inventarla.

- [ ] **`git mv` de los 3 ficheros de `previo-sdd/design/docs/style/`** según la tabla de Fase 0 (`01-tokens-visual.md` → `001-tokens-visual.md`, etc.), **en un commit propio sin tocar contenido** (S6).
- [ ] **`001-tokens-visual.md` — cabecera + intro.** Primera línea `# Visual tokens, typography, spacing, borders, elevation` → `# 001 — Visual tokens, typography, spacing, borders, elevation` + `**Area**: Tokens`. Eliminar la línea `See INDEX.md for the full map of the Style Bible.`. Renumerar los encabezados internos: hoy son `## 2. Design tokens`, `## 3. Typography`, `## 4. Spacing`, `## 5. Borders and corners`, `## 6. Elevation…` (heredados del monolito). Renumerar a `## 1.` … `## 5.` o quitar el número del encabezado (dejar `## Design tokens`, `## Typography`, …) — **quitar el número** es lo coherente con la convención (el `NNN` ya está en el `# 001 —`; las secciones internas no necesitan numeración propia). Aplicar el mismo criterio en los 3 ficheros de estilo y en las referencias cruzadas (`§2`, `§6` → nombre de sección). Cuerpo: ya es notation-first (bloque CSS de tokens, tablas de tipografía/spacing); sin cambios de forma.
- [ ] **`002-componentes-layout.md` — cabecera + intro.** Primera línea → `# 002 — Buttons, layout, resize, sticky table header` + `**Area**: Layout & components`. Quitar `See INDEX.md …`. Renumerar/despojar de número los encabezados `## 9. Buttons` … `## 11.2 Nested row …` igual que en `001`. Cuerpo ya notation-first; sin cambios de forma.
- [ ] **`003-modales-menus.md` — cabecera + intro + refs.** Primera línea → `# 003 — Modals, menus, tooltips, identification patterns` + `**Area**: Modals & menus`. Quitar `See INDEX.md …`. Encabezados `## 12. …` → sin número. Cuerpo ya notation-first (tablas de modales anchos, patrones de menú, badges); **el trabajo principal aquí son las referencias cruzadas**: `design/docs/architecture/04-modes.md` → `../architecture/005-modes.md`, `design/docs/architecture/02-component-types.md` → `../architecture/003-component-types.md`, `design/docs/architecture/05-ui-layer.md` → `../architecture/006-ui-layer.md`, `01-component-model.md` → `../architecture/002-component-model.md`, `01-tokens-visual.md` → `001-tokens-visual.md`, `INDEX.md §13`/`§7` → `004-naming-and-patterns.md` (ver siguiente tarea). Las `§NN.N` internas de este mismo fichero → referirse por nombre de sección (ya no hay número).
- [ ] **`004-naming-and-patterns.md` — crear.** Cabecera `# 004 — Class naming (BEM) and JS component patterns` + `**Area**: Layout & components`. Cuerpo = contenido real trasladado desde `style/INDEX.md`:
  - `## Style stack` = el `§1` actual (CSS plano un solo fichero, DOM vanilla JS, `src/ui/*.js` = "componentes", no añadir dependencias de UI sin acordarlo).
  - `## Class naming — BEM` = el `§7` completo (bloque kebab-case, elemento `__`, modificador `--`, estados transitorios `.grabbing`/`.active`/`.lifted`/`.drop-target`, `.is-copy`/`.is-group-passenger` con su criterio, excepción histórica `.btn-cancel`/`.btn-accept`/`.btn-eliminar`, `.btn-<intent>`, `.btn-duplicate`, `.btn-sacar`, IDs reservados para contenedores únicos).
  - `## Component patterns (JS)` = el `§8` completo (función que crea y devuelve `HTMLElement`, `className` una vez en creación, `classList.add/remove/toggle` para estados; un fichero por componente en `src/ui/` camelCase; estados de UI siempre clase, nunca inline style; excepción de transforms dinámicos; el bloque "Color field + associated thickness, same row" con su `[gotcha]` "much larger than expected" → **sustituir "much larger than expected"** por una descripción sin intensificador: el `<input>` con `width:100%` sin ancho explícito en la cadena de ancestros cae a su ancho intrínseco de renderizado del navegador (el `size` por defecto de un `<input>`, ~20 caracteres), fix = el contenedor de la fila fija su propio ancho explícito (`cardEditorModal.js` usa `faceCol.style.width`). **S2**: confirmar contra `src/ui/cardEditorModal.js` que el fix es ese antes de escribirlo; si la cifra exacta no es verificable, dejar la descripción cualitativa sin número (no inventar un px).
  - `## What NOT to do` = el `§13` completo (no segundo sistema de tokens, no inline `style="color:#..."` para colores del catálogo, no clases de un solo uso sin BEM salvo `.btn-*`, no gradientes/animaciones llamativas — sombras y radios sí siguen el sistema).
  - **IMPORTANTE**: las subsecciones extensas de `§13` de `style/INDEX.md` (Bevel/depth, Rounded corners of "Carta", "Mazo" reuses `.carta`, Hexagonal/Triangular clip, Card thumbnail, Color dedicated to `.modal__section` title, die roll flicker, "Lift" effect, Drop-zone highlight, "Carta" flip feedback) **no van todas aquí**: encajan por tema en `001-tokens-visual.md` (elevación/extrusión, `--section-accent`) y `003-modales-menus.md` (biseles/clips de carta, feedback de flip, drop-target). Repartirlas ahí al mover el contenido del índice; en `004-naming-and-patterns.md` dejar solo `§1`/`§7`/`§8` y el `§13` "core" (las 4 viñetas de "qué no hacer"), con un puntero a `001`/`003` para el detalle de biseles/clips/elevación.

### Fase 3 — Poblar `00-namespace.md`

> Aplica S3 (leer cada símbolo, no solo `grep`) y S4 (decisión solo si hay frase original que la respalde) a cada nodo. El árbol de abajo es un **borrador**: cada nodo se confirma contra `/src` antes de escribirlo, y cualquiera cuyo `anchor:` no se pueda verificar baja a `concepto` sin ancla o se omite, anotándolo en el reporte (S8).

- [ ] **`previo-sdd/design/docs/architecture/00-namespace.md` — sustituir el cuerpo semilla.** Reemplazar `<Empty. pv-do populates this over time.>` (y el ejemplo `auth.token.session` si sigue en `## Tree`; las cabeceras `## Notation` y `## Tree` y su texto normativo se **conservan** tal cual). Poblar el árbol respetando el orden de segmentos `<área>.<agregado>.<entidad>.<campo>`:

  ```
  component                                concepto.  anchor: src/core/component.js#createComponent
  component.order = 1 .. n                  afirmación (1 = arriba, n = abajo)
  component.order.rule:                     anchor: src/core/state.js
      addComponent asigna order = 1, desplaza el resto +1
      removeComponent recompacta 1..n (compactOrders)
      reorderComponent(id, raw) clampa raw a [1, n]
  component.copyOf?: string = null          concepto.  anchor: src/core/component.js#createCopy
  component.sincronizado: bool = true       afirmación (solo aplica si copyOf != null)
  component.copy.decision.non-synced-keys   decisión.  sin ancla
      [motivación] x, y, order, groupId, properties.resultadoActual, properties.caraActual nunca se propagan a la copia
  component.groupId?: string = null         concepto.
  component.bloqueado: enum ∈ {ninguno, juego, todos} = ninguno   concepto.
  component.oculto: bool = false            concepto.
  component.subirAlMoverInteractuar: bool = false   concepto.
  component.profundidad: number [0..40] = 0         concepto.  anchor: src/ui/componentRenderer.js#buildExtrusionLayers
  component.colorExtrusion?: string = null          concepto.  anchor: src/ui/componentRenderer.js#resolveExtrusionColor
  component.accionClickDerecho: enum ∈ {ninguno, menuContextual} = ninguno   concepto.
  component.image?: string = null           concepto.
  component.image.decision.unused           decisión.  sin ancla
      [gotcha] component.image no lo usa ningún tipo actual; los fondos de imagen van por properties.imagenResourceId

  group                                     concepto.  anchor: src/core/group.js#createGroup
  group.id: string                          afirmación (mismo valor que el groupId de sus miembros; grupo-N o libre si se renombra)
  group.id.rule:                            anchor: src/core/component.js#nextGroupId
      formato grupo-N, N = primer entero libre
  group.effectiveProps.rule:                anchor: src/core/group.js#getEffectiveGeneralProps
      pre:  component.groupId != null ∧ ∃ g ∈ groups : g.id = component.groupId
      post: bloqueado, oculto, mostrarTooltip, subirAlMoverInteractuar, etiquetaIds efectivos = los del registro g
      fallback: si no hay registro g, se usan los propios del componente
  group.persist.decision.key-componentGroups   decisión.  sin ancla
      [motivación] la colección se persiste bajo la clave componentGroups, no groups, porque groups ya es alias de compatibilidad de tags

  tag                                       concepto.  anchor: src/core/tag.js#createTag
  tag.name.uniqueness.rule:                 anchor: src/core/tag.js#isTagNameTaken
      normalizado (trim, case-insensitive); true si otro tag con id != excludeId tiene el mismo nombre
  tag.persist.decision.compat-chain        decisión.  sin ancla
      [motivación] parseState lee tags/tagPanelState, con fallback a groups/groupPanelState y luego a decks/deckPanelState

  resource                                  concepto.  anchor: src/core/resource.js#createResource
  resource.type: enum ∈ {imagen, tipografia}   concepto.
  resource.usage.rule:                      anchor: src/core/resource.js#isResourceInUse
      recorre component.properties en profundidad (collectDeepValues) buscando el resourceId; getComponentsUsingResource añade component.image
  resource.typeForFileName.rule:            anchor: src/core/resource.js#resourceTypeForFileName
      png/jpg/jpeg/gif/svg/webp -> imagen; ttf/otf/woff/woff2 -> tipografia; else null

  persistence.serializedFields = [components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, appTitle]
                                            afirmación.  anchor: src/core/persistence.js
  persistence.serializedFields.rule:        anchor: src/core/fileExport.js
      autosave y "Guardar a fichero" serializan exactamente esa lista; una colección/campo nuevo debe añadirse en ambos y en la suscripción de autosave

  ui.token.accent-blue = #2c7dd8            afirmación de estilo.  anchor: src/styles/main.css
  ui.token.accent-blue-dark = #123a66       afirmación de estilo.
  ui.token.accent-blue-light = #eaf3fc      afirmación de estilo.
  ui.token.section-accent = #5b5f97         afirmación de estilo.
  ui.token.error = #d32f2f                  afirmación de estilo.
  ui.token.radius-sm = 4px                  afirmación de estilo.
  ui.token.radius-lg = 8px                  afirmación de estilo.
  ui.token.shadow-1                         concepto de estilo.  anchor: src/styles/main.css
  ui.token.shadow-2                         concepto de estilo.
  ui.token.transition-fast = 150ms ease     afirmación de estilo.
  ui.elevation.level0                       concepto de estilo (plano, sin sombra)
  ui.elevation.level1                       concepto de estilo (flotación sutil, box-shadow shadow-1)
  ui.elevation.level2                       concepto de estilo (overlay, box-shadow shadow-2)
  ui.class.is-copy                          concepto de estilo.  anchor: src/ui/componentRenderer.js
  ui.class.is-group-passenger              concepto de estilo.  anchor: src/ui/componentRenderer.js
  ui.class.decision.is-group-passenger-wins-over-is-copy   decisión.  sin ancla
      [motivación] .is-group-passenger se declara después en la cascada CSS, gana a .is-copy sobre el mismo elemento
  ui.class.lifted                           concepto de estilo (estado transitorio, drag en modo juego)
  ui.class.drop-target                      concepto de estilo (mazo resaltado durante drag de carta)
  ui.class.carta--flip-feedback            concepto de estilo (feedback de cambio de cara)
  ```

- [ ] **Verificar cada `anchor:` contra `/src`** antes de dar la fase por buena: para cada `anchor: src/…#símbolo`, comprobar que el fichero existe y contiene ese símbolo (`grep`/`Grep`). Anclas ya verificadas en el análisis: `core/group.js#getEffectiveGeneralProps`, `core/resource.js#isResourceInUse`, `core/resource.js` `collectDeepValues`, `core/component.js#nextGroupId`. Falta verificar: `createComponent`, `createCopy`, `buildExtrusionLayers`, `resolveExtrusionColor`, `createGroup`, `createTag`, `isTagNameTaken`, `createResource`, `resourceTypeForFileName`. Si algún símbolo no existe con ese nombre exacto, ajustar el `anchor:` al nombre real o degradar el nodo a `concepto` sin ancla y anotarlo.

### Fase 4 — Regenerar índices

- [ ] **`python .claude/skills/pv-internal-doc-files/scripts/rebuild-index.py --folder previo-sdd/design/docs/architecture`** (sin `--title`). Debe regenerar `INDEX.md` con H1 `# Architecture`, agrupado por las 8 áreas, una línea por fichero `002`…`009` con enlace y su título. Si el script falla al parsear alguna cabecera, corregir el `# NNN — título` / `**Area**:` del fichero señalado y repetir.
- [ ] **`python .claude/skills/pv-internal-doc-files/scripts/rebuild-index.py --folder previo-sdd/design/docs/style`** (sin `--title`). H1 `# Style`, agrupado por `Tokens` / `Layout & components` / `Modals & menus`, ficheros `001`…`004`.
- [ ] **Revisar el `INDEX.md` regenerado de cada carpeta**: que NO quede ninguna tabla "Sibling files", ningún `§1 Goal and constraints`/`§7`/`§8`/`§13`, ninguna ref `design/docs/...`, ningún H1 libre. Si `rebuild-index.py` genera un one-liner por fichero a partir de algo del propio fichero, comprobar que ese one-liner es correcto; si lo deja vacío, ver si la convención pide añadir una línea de descripción bajo el `**Area**:` (revisar `rebuild-index.py` para saber de dónde saca el texto del enlace).

### Fase 5 — Barrido final de referencias y verificación de contenido

- [ ] **`grep -rn "design/docs/" previo-sdd/design/docs/`** → debe dar 0 resultados. Cualquier resto se corrige a ruta relativa (`../architecture/NNN-slug.md` / `NNN-slug.md`).
- [ ] **`grep -rn -E "\b0[1-9]-[a-z]" previo-sdd/design/docs/architecture previo-sdd/design/docs/style`** (referencias a los nombres antiguos de 2 cifras: `01-`, `02-`, …) → debe dar 0 en el cuerpo de los ficheros (fuera de `INDEX.md`). Cada resto → número nuevo.
- [ ] **`grep -rn -E "much larger|far too big|that key|the former|the above" previo-sdd/design/docs/`** → revisar cada aparición: sustituir por identificador/ruta/cifra o eliminar la frase.
- [ ] **Verificar los `anchor:` de `00-namespace.md` contra `/src` uno a uno** (S3): para cada `anchor: src/…#símbolo`, abrir el fichero y comprobar que el símbolo existe con ese nombre exacto Y que el `pre:`/`post:`/descripción del nodo corresponde a lo que hace la función. Los que no se puedan verificar → bajar a `concepto` sin ancla u omitir, anotándolo.
- [ ] **`git diff` fichero a fichero (arquitectura y estilo), revisado al terminar cada fichero, no en bloque** (S7). Por cada línea eliminada: confirmar que ese hecho sigue presente en el fichero en otra forma. Criterio: solo debe cambiar la forma (numeración, cabeceras, tablas vs. prosa, referencias, traslado de secciones del índice a ficheros nuevos). Ninguna afirmación de hecho puede haber desaparecido sin justificación.
- [ ] **Escribir el reporte de entrega** (S8) con: (a) afirmaciones reformuladas (prosa X → notación Y); (b) frases vagas sustituidas y de dónde salió la cifra/descripción; (c) discrepancias doc↔código encontradas y cómo se resolvieron (código gana); (d) decisiones NO documentadas como `.decision.` y por qué; (e) `anchor:` que quedaron sin ancla y por qué. Este reporte es lo que hay que revisar, no las 1500 líneas.

## (c) Architecture changes

Todos los ficheros de `previo-sdd/design/docs/architecture/` (`architectureDocDir`) se modifican — **pero** el cambio es de forma/organización, no de contenido de arquitectura de código. Detalle por fichero en la sección (b), Fases 1 y 3. Resumen:

- `00-namespace.md`: poblar el árbol `## Tree` con conceptos, contratos y decisiones clave (Fase 3). `## Notation` y `## Tree` (cabeceras normativas) se conservan.
- `01-component-model.md` → `002-component-model.md`: renombrar, cabecera `# 002 — …` + `**Area**: Data model`, quitar intro de relleno.
- `02-component-types.md` → `003-component-types.md`: renombrar, cabecera + `**Area**: Component types`.
- `03-groups-resources.md` → `004-groups-resources.md`: renombrar, cabecera + `**Area**: Groups & resources`, reescritura notation-first de la prosa densa.
- `04-modes.md` → `005-modes.md`: renombrar, cabecera + `**Area**: Modes`, reescritura notation-first + `[gotcha]` en las anti-expectativas.
- `05-ui-layer.md` → `006-ui-layer.md`: renombrar, cabecera + `**Area**: UI layer`, tablas de parámetros para las firmas grandes.
- `06-persistence-build.md` → `007-persistence-build.md`: renombrar, cabecera + `**Area**: Persistence & build`, reescritura notation-first del flujo import/merge y backfill.
- `001-overview.md` (nuevo): objetivos + capas, trasladados desde `INDEX.md`.
- `008-code-conventions.md` (nuevo): convenciones de código, trasladadas desde `INDEX.md §7`.
- `009-cross-cutting-checklist.md` (nuevo): checklist de `INDEX.md §8` como tabla.
- `INDEX.md`: regenerar con `rebuild-index.py`, dejarlo como solo índice.

## (d) Style changes

Todos los ficheros de `previo-sdd/design/docs/style/` (`styleBibleDocDir`) se modifican — de nuevo, cambio de forma/organización, no de convención visual. Detalle en la sección (b), Fase 2. Resumen:

- `01-tokens-visual.md` → `001-tokens-visual.md`: renombrar, cabecera `# 001 — …` + `**Area**: Tokens`, quitar `See INDEX.md …`, despojar de número los encabezados internos. Recibe además parte de las subsecciones de `INDEX.md §13` que van por tema (elevación/extrusión, `--section-accent`).
- `02-componentes-layout.md` → `002-componentes-layout.md`: renombrar, cabecera + `**Area**: Layout & components`.
- `03-modales-menus.md` → `003-modales-menus.md`: renombrar, cabecera + `**Area**: Modals & menus`, **arreglo masivo de referencias cruzadas** (`design/docs/architecture/...` → `../architecture/NNN-…`). Recibe las subsecciones de `INDEX.md §13` de biseles/clips de carta, flip feedback y drop-target.
- `004-naming-and-patterns.md` (nuevo): `INDEX.md §1` (stack), `§7` (BEM), `§8` (patrones JS) y el núcleo de `§13` (4 viñetas de "qué no hacer"). En el bloque "Color field + associated thickness" sustituir "much larger than expected" por la cifra/mecanismo concreto.
- `INDEX.md`: regenerar con `rebuild-index.py`, dejarlo como solo índice.

## (e) Verification

- [ ] `ls previo-sdd/design/docs/architecture/` muestra `00-namespace.md`, `001-overview.md`, `002-component-model.md`, `003-component-types.md`, `004-groups-resources.md`, `005-modes.md`, `006-ui-layer.md`, `007-persistence-build.md`, `008-code-conventions.md`, `009-cross-cutting-checklist.md`, `INDEX.md` — y ningún fichero con prefijo de 2 cifras.
- [ ] `ls previo-sdd/design/docs/style/` muestra `001-tokens-visual.md`, `002-componentes-layout.md`, `003-modales-menus.md`, `004-naming-and-patterns.md`, `INDEX.md` — y ningún fichero con prefijo de 2 cifras.
- [ ] En cada fichero numerado de ambas carpetas, la línea 1 es `# NNN — {título}` (NNN de 3 cifras) y la línea 2 es `**Area**: {área del mapa}`.
- [ ] `python .claude/skills/pv-internal-doc-files/scripts/rebuild-index.py --folder previo-sdd/design/docs/architecture` termina sin error y, tras ejecutarlo, `git diff previo-sdd/design/docs/architecture/INDEX.md` no muestra más cambios (el `INDEX.md` ya estaba en su forma canónica). Lo mismo para `style`.
- [ ] `previo-sdd/design/docs/architecture/INDEX.md` empieza por `# Architecture`, agrupa por las 8 áreas y no contiene "Sibling files", "Goal and constraints", "Code conventions", "Checklist when adding", ni `design/docs/`. `style/INDEX.md` empieza por `# Style`, agrupa por 3 áreas, sin "Sibling files" ni secciones sustantivas.
- [ ] `grep -rn "design/docs/" previo-sdd/design/docs/` → 0 resultados.
- [ ] `grep -rn -E "\bdesign/docs/architecture/0[0-9]-|\bdesign/docs/style/0[0-9]-|\]\(0[0-9]-" previo-sdd/design/docs/` → 0 resultados (ninguna referencia a nombres antiguos de 2 cifras).
- [ ] `previo-sdd/design/docs/architecture/00-namespace.md`: la sección `## Tree` ya no contiene `<Empty. pv-do populates this over time.>` ni el ejemplo `auth.token.session`; contiene los nodos `component.*`, `group.*`, `tag.*`, `resource.*`, `persistence.serializedFields`, `ui.token.*`, `ui.class.*`, `ui.elevation.*`. Las cabeceras `## Notation` y `## Tree` siguen presentes con su texto normativo.
- [ ] Cada línea `anchor: src/…#símbolo` de `00-namespace.md` apunta a un fichero que existe y contiene ese símbolo (comprobado con `grep`).
- [ ] `grep -rn -E "much larger than expected|far too big" previo-sdd/design/docs/` → 0 resultados; cada `[gotcha]` de anti-expectativa (`is-group-passenger` gana a `is-copy`, `component.image` sin uso, carta dentro de mazo no se dibuja en ningún modo, doble clic bloqueado pero botón del panel rehabilitado) aparece con el prefijo `[gotcha]`.
- [ ] `git diff` de los 7 ficheros de arquitectura preexistentes y los 3 de estilo preexistentes: revisado fichero a fichero, no hay ninguna afirmación de hecho eliminada — solo cambios de forma (numeración, cabeceras, tablas, referencias, traslado de secciones del índice a ficheros nuevos).
- [ ] `previo-sdd/design/docs/features/` sin cambios (`git status` no lo lista).
- [ ] `previo-sdd/docs/` (carpeta huérfana) sin cambios.
