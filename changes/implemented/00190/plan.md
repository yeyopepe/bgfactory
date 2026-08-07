- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** el comportamiento no cambia — multi-pertenencia, alta al vuelo, borrado con aviso de uso, selección de miembros desde el panel, filtrado/ordenación, copiar/pegar estilo, etc. se mantienen exactamente igual, solo cambia el nombre del concepto. No se toca el concepto de "Mazo" (`core/deck.js`) ni sus migraciones (`migrateDeckIdToEtiqueta`, ver tarea 1, es un paso de migración que consume campos de "Mazo" pero no forma parte de ese concepto). Tampoco se toca la clase CSS `.element-selection-group*` (y sus variantes `__select-all`/`__title`/`__list`/`__item`) ni la sección "12.10 Grupo de botones icono-solo" de `design/docs/style/03-modales-menus.md`: pese al nombre, ambas usan "grupo" como término genérico de UI (agrupación de checkboxes/botones), no como referencia al concepto de dominio que se renombra aquí.

**Dudas resueltas con el usuario:** (ya recogidas en `description.md`) — (1) es solo terminología, el comportamiento no cambia; (2) se renombra también por dentro (identificadores, nombres de fichero, claves persistidas/exportadas), asumiendo la compatibilidad hacia atrás necesaria para que partidas guardadas/exportadas antes de este cambio se sigan cargando con normalidad.

**Convención de nombres a aplicar** (coherente con el estilo ya usado en el proyecto, donde el concepto tiene identificadores en inglés y el campo de dato en español):
- Identificadores de código (funciones, ficheros, eventos, colecciones) en inglés: `group` → `tag`.
- Nombre de campo de datos en español: `grupo` → `etiqueta` (`grupoIds` → `etiquetaIds`, `grupoNames` → `etiquetaNames`).
- Texto visible: "Grupo"/"Grupos" → "Etiqueta"/"Etiquetas" (y sus formas en minúscula dentro de frases).

## (b) Solución técnica

1. **`src/core/group.js` → renombrar a `src/core/tag.js`.** Renombra el fichero. Dentro: `createGroup`→`createTag`, `updateGroup`→`updateTag`, `isGroupNameTaken`→`isTagNameTaken` (parámetro `groups`→`tags`), `getComponentsUsingGroup`→`getComponentsUsingTag` (filtra por `component.etiquetaIds.includes(tagId)` en vez de `grupoIds`). Actualiza el comentario de cabecera del fichero.

2. **`src/core/component.js` — campo `grupoIds` → `etiquetaIds`, con migración en cascada de 3 niveles.**
   - `createComponent`: parámetro `grupoIds = []` → `etiquetaIds = []`; el objeto devuelto expone `etiquetaIds` (no `grupoIds`).
   - `copyComponent` (o función equivalente que clona un componente, línea ~155 actual): `grupoIds: [...original.grupoIds]` → `etiquetaIds: [...original.etiquetaIds]`.
   - `normalizeComponentGrupoIds` → renombrar a `normalizeComponentEtiquetaIds`. Amplía la lógica actual (que hoy solo migra el escalar antiguo `grupoId` al array `grupoIds`) a 3 niveles: si el componente ya tiene `etiquetaIds` (array), no lo toca; si no, y tiene `grupoIds` (array, formato intermedio ya existente), lo copia a `etiquetaIds` bajo el nuevo nombre de campo; si no, y tiene el escalar antiguo `grupoId`, lo convierte en `etiquetaIds: [grupoId]`; si no tiene ninguno, `etiquetaIds: []`. En los tres casos elimina los campos antiguos (`grupoId`/`grupoIds`) del objeto resultante — mismo patrón `{ ...rest }` que ya usa la función actual.

3. **`src/core/state.js` — colección, panelState, eventos y migraciones.**
   - Import de `./component.js`: `normalizeComponentGrupoIds` → `normalizeComponentEtiquetaIds`.
   - Estado interno: `groups: []` → `tags: []`; variable `groupPanelState` → `tagPanelState` (mismo shape `{ collapsed, position, width, height }`).
   - `migrateGrupoIdToGrupoIds(components)` → renombrar a `migrateGrupoIdToEtiquetaIds(components)`, usando `normalizeComponentEtiquetaIds` de la tarea 2. Actualiza el comentario que la precede (referencias a `grupoId`/`grupoIds` → a los tres formatos posibles y al campo final `etiquetaIds`).
   - `migrateDeckIdToGrupo(components)` → renombrar a `migrateDeckIdToEtiqueta(components)`: añade el id del mazo (`properties.deckId`) a `component.etiquetaIds` en vez de a `grupoIds`. Mantiene el orden de ejecución actual (`migrateGrupoIdToEtiquetaIds` antes que `migrateDeckIdToEtiqueta`, ya que esta última asume `etiquetaIds` como array).
   - Llamadas en `loadComponents`: actualiza los dos nombres de función.
   - API pública: `getGroups`→`getTags`, `addGroup`→`addTag`, `replaceGroup`→`replaceTag`, `removeGroup`→`removeTag`, `loadGroups`→`loadTags`, `getGroupPanelState`→`getTagPanelState`, `setGroupPanelState`→`setTagPanelState`, `loadGroupPanelState`→`loadTagPanelState`, todas operando sobre `state.tags`/`tagPanelState`.
   - Eventos emitidos: `'groups:changed'` → `'tags:changed'` (en las 4 funciones que lo emiten), `'groupPanelState:changed'` → `'tagPanelState:changed'`.

4. **`src/core/persistence.js` — claves persistidas/exportadas con compatibilidad de 3 generaciones.**
   - `parseState`: encadena lectura de claves nuevas a antiguas — `const tagPanelStateRaw = parsed.tagPanelState ?? parsed.groupPanelState ?? parsed.deckPanelState;` y `const tags = Array.isArray(parsed.tags) ? parsed.tags : (Array.isArray(parsed.groups) ? parsed.groups : (Array.isArray(parsed.decks) ? parsed.decks : []));`. El objeto devuelto expone `tags`/`tagPanelState` (no `groups`/`groupPanelState`). Actualiza el comentario ("Mazo" → "Grupo") a la nueva cadena de compatibilidad ("Mazo" → "Grupo" → "Etiqueta").
   - `saveState`: parámetros `groups`/`groupPanelState` → `tags`/`tagPanelState`; el objeto serializado a `localStorage` usa las claves nuevas `tags`/`tagPanelState` (deja de escribir `groups`/`groupPanelState`, igual que el patrón ya existente que dejó de escribir `decks`/`deckPanelState`).
   - Función de importación de fichero (segunda función con el mismo patrón `groups`/`decks`, línea ~71-77 actual): mismo encadenado de 3 niveles (`tags`/`groups`/`decks`) y devuelve `tags` en vez de `groups`.
   - `buildComponentsExport`: parámetro `groups`→`tags`; objeto devuelto usa clave `tags`.

5. **`src/core/fileExport.js` — `buildExportHtml`.** Parámetros `groups`/`groupPanelState` → `tags`/`tagPanelState`; el JSON serializado en la semilla usa las claves nuevas `tags`/`tagPanelState`.

6. **`src/core/importMerge.js` — importación/fusión de fichero.**
   - Import de `./tag.js` (renombrado en tarea 1): `createGroup, isGroupNameTaken` → `createTag, isTagNameTaken`.
   - Import de `./component.js`: `normalizeComponentGrupoIds` → `normalizeComponentEtiquetaIds`.
   - `remapComponentRefs`: parámetro `groupIdMap` → `tagIdMap`; variable local `grupoIds` → `etiquetaIds` (lee/escribe `component.etiquetaIds`).
   - `dedupeGroupNames` → `dedupeTagNames`; variable `group`/`groups` → `tag`/`tags` donde referencien esta colección.
   - `mergeImportedGame`: parámetros `existingGroups`, `selectedGroups`, `allImportedGroups` → `existingTags`, `selectedTags`, `allImportedTags`; variables locales `groups`/`groupIdMap`/`groupIds`/`createdGroupIds`/`groupRenames` → equivalentes `tag*`; recorre `component.etiquetaIds` (no `grupoIds`). Objeto devuelto: `groups: result` → `tags: result`.
   - Valores de `tipoError` del informe de importación: `'grupo'` → `'etiqueta'`, `'grupoDuplicado'` → `'etiquetaDuplicada'` (ambos generados en esta función).

7. **`src/core/fichaMigration.js` — migración `'ficha'`→`'carta'`.** `migrateFichaComponent`: el resultado fija `grupoIds: []` → `etiquetaIds: []` (el comentario de la función también menciona `grupoId: null`, que ya no aplica desde que el campo es array — verificar que el código real coincida y usar `etiquetaIds: []`, no un escalar).

8. **`src/core/styleClipboard.js` — portapapeles de estilo.**
   - Comentario de cabecera: `grupoIds`/`grupoNames` → `etiquetaIds`/`etiquetaNames`.
   - `validateStyleClipboardForPaste(clip, { groups, resources })`: parámetro `groups`→`tags`; recorre `clip.generales.etiquetaIds` (no `grupoIds`); mensaje de incidencia `referencia: 'Grupo'` → `referencia: 'Etiqueta'`; usa `clip.generales.etiquetaNames`.
   - Cualquier otro punto de este fichero que construya/lea el bloque `generales` con `grupoIds`/`grupoNames` pasa a `etiquetaIds`/`etiquetaNames`.

9. **`src/ui/groupList.js` → renombrar a `src/ui/tagList.js`.**
   - Import de `../core/tag.js` (tarea 1): `getComponentsUsingGroup` → `getComponentsUsingTag`.
   - `buildGroupListColumnDefs` → `buildTagListColumnDefs`.
   - `renderGroupList` → `renderTagList` (export usado por `editMode.js`, actualizar también ahí, tarea 14).
   - Clases CSS: `group-list` → `tag-list`, `group-list__count-cell` → `tag-list__count-cell`, `group-list__empty`/`group-list__empty-filter` → `tag-list__empty`/`tag-list__empty-filter`, `group-list__row` → `tag-list__row`, `group-list__actions-cell` → `tag-list__actions-cell`, `group-list__action-btn`/`group-list__action-btn--danger` → `tag-list__action-btn`/`tag-list__action-btn--danger`, `group-panel-container`/`group-panel`/`group-panel__*` (header, header.grabbing, filter, filter-clear, filter-clear.is-empty, body, footer) → equivalentes `tag-panel*`.
   - Textos visibles: `"Grupos (${…})"` → `"Etiquetas (${…})"`, `"No hay grupos todavía."` → `"No hay etiquetas todavía."`, `` `No hay grupos que coincidan con «${filterText}».` `` → `` `No hay etiquetas que coincidan con «${filterText}».` ``, placeholder `'Filtrar grupos…'` → `'Filtrar etiquetas…'`, botón `'+ Añadir grupo'` → `'+ Añadir etiqueta'`.
   - Nombres de variables/parámetros internos (`group`, `groups`, `onSelectGroup`, `allGroups`, `computeDisplayedGroups`) → equivalentes `tag*` por consistencia (mecánico, sin decisión adicional).

10. **`src/ui/groupModal.js` → renombrar a `src/ui/tagModal.js`.**
    - Import de `../core/tag.js`: `createGroup, updateGroup, isGroupNameTaken, getComponentsUsingGroup` → `createTag, updateTag, isTagNameTaken, getComponentsUsingTag`.
    - Import de `../core/state.js`: `getGroups` → `getTags`.
    - `openGroupModal` → `openTagModal` (parámetro `group`→`tag`, callback `onRemoveFromGroup`→`onRemoveFromTag`); actualizar también en `editMode.js` (tarea 14).
    - Textos: `` `Grupo: ${group.name}` `` → `` `Etiqueta: ${tag.name}` ``, `'Nuevo grupo'` → `'Nueva etiqueta'`, `` `Elementos del grupo (${…})` `` → `` `Elementos de la etiqueta (${…})` ``, `'No hay elementos en este grupo.'` → `'No hay elementos en esta etiqueta.'`, `'Ya existe un grupo con este nombre'` → `'Ya existe una etiqueta con este nombre'`.
    - Clases CSS: `group-modal__elements-label`/`__elements-list`/`__elements-empty`/`__element-item`/`__element-id` → `tag-modal__*` equivalentes.

11. **`src/ui/groupDeleteConfirmModal.js` → renombrar a `src/ui/tagDeleteConfirmModal.js`.**
    - `openGroupDeleteConfirmModal` → `openTagDeleteConfirmModal` (parámetro `groupName`→`tagName`); actualizar también en `editMode.js` (tarea 14).
    - Textos: `'Eliminar grupo en uso'` → `'Eliminar etiqueta en uso'`, mensaje `` `El grupo "${groupName}" está siendo usado por los siguientes elementos. Si continúas, se eliminará el grupo y esos elementos perderán la pertenencia a este grupo.` `` → equivalente con "etiqueta"/"la etiqueta".
    - Clase CSS `group-delete-confirm-modal__list` → `tag-delete-confirm-modal__list`.
    - Comentario de cabecera del fichero actualizado.

12. **`src/ui/componentModal.js` — sección "Grupos" de la pestaña "Generales".**
    - Imports: `getGroups, addGroup` (de `../core/state.js`) → `getTags, addTag`; `createGroup, isGroupNameTaken` (de `../core/group.js`, ahora `../core/tag.js`) → `createTag, isTagNameTaken`.
    - Comentarios de la sección (líneas ~531-542) actualizados a "Etiquetas".
    - `groupSection`/`groupLegend` → `tagSection`/`tagLegend`; texto del legend `'Grupos'` → `'Etiquetas'`.
    - `groupCheckboxList` → `tagCheckboxList`; clase CSS `group-checkbox-list__scroll` → `tag-checkbox-list__scroll`.
    - `createGroupItem` → `createTagItem`; texto `'+ Crear nuevo grupo…'` → `'+ Crear nueva etiqueta…'`.
    - `newGroupRow`/`newGroupInputRow`/`newGroupInput`/`newGroupCreateBtn`/`newGroupError` → equivalentes `newTag*`; placeholder `'Nombre del grupo nuevo'` → `'Nombre de la etiqueta nueva'`.
    - `populateGroupCheckboxes` → `populateTagCheckboxes`; recorre `sortByName(getTags())`; checkbox marcado según `workingComponent.etiquetaIds.includes(tag.id)`; añade/quita sobre `workingComponent.etiquetaIds` (no `grupoIds`).
    - `validateNewGroupName` → `validateNewTagName`; mensajes `'Ya existe un grupo con este nombre'` → `'Ya existe una etiqueta con este nombre'`.
    - Bloque de "Copiar estilo" (~línea 1484): `grupoIds: [...workingComponent.etiquetaIds]`, `grupoNames:` → `etiquetaNames: workingComponent.etiquetaIds.map((id) => getTags().find((t) => t.id === id)?.name ?? id)` — ambas claves del objeto pasado a `setStyleClipboard` renombradas a `etiquetaIds`/`etiquetaNames` (coherente con `core/styleClipboard.js`, tarea 8).
    - Bloque de "Pegar estilo" (~línea 1511): `validateStyleClipboardForPaste(clip, { groups: getGroups(), resources: getResources() })` → `{ tags: getTags(), resources: getResources() }`; `workingComponent.grupoIds = [...clip.generales.etiquetaIds]` → `workingComponent.etiquetaIds = [...clip.generales.etiquetaIds]`; llamada final a `populateGroupCheckboxes()` → `populateTagCheckboxes()`.
    - Texto de ayuda (~línea 1548): `'Copia/pega solo los elementos que elijas: generales (incluye el grupo), proporción, cara frontal y/o cara trasera.'` → `'...generales (incluye la etiqueta)...'`.

13. **`src/ui/contextMenu.js` — placeholder del `<select>` de "Añadir a grupo".** `options.length === 0 ? 'Sin grupos' : 'Elegir grupo…'` → `'Sin etiquetas'` / `'Elegir etiqueta…'`.

14. **`src/modes/edit/editMode.js` — panel "Grupos", menú contextual y arrastre.**
    - Imports de `../../core/state.js`: `getGroups, addGroup, replaceGroup, removeGroup, getGroupPanelState, setGroupPanelState` → `getTags, addTag, replaceTag, removeTag, getTagPanelState, setTagPanelState`.
    - Import de `../../core/group.js` (ahora `../../core/tag.js`): `getComponentsUsingGroup` → `getComponentsUsingTag`.
    - Imports de UI renombrados (tareas 9-11): `renderGroupList`→`renderTagList` (de `../../ui/tagList.js`), `openGroupModal`→`openTagModal` (de `../../ui/tagModal.js`), `openGroupDeleteConfirmModal`→`openTagDeleteConfirmModal` (de `../../ui/tagDeleteConfirmModal.js`).
    - `panelStackOrder`: `['component', 'resource', 'group']` → `['component', 'resource', 'tag']`; `panelsByKey`: clave `group`→`tag`.
    - `groupListContainer` → `tagListContainer`; clase CSS `group-panel-container` → `tag-panel-container`.
    - `groupPanelPosition`/`groupPanelWidth`/`groupCollapsed` → equivalentes `tagPanel*`/`tagCollapsed`, leídos de `getTagPanelState()`.
    - `attemptDeleteGroup` → `attemptDeleteTag` (parámetro `group`→`tag`): usa `getComponentsUsingTag`, `openTagDeleteConfirmModal`, `tagName: tag.name`, actualiza `component.etiquetaIds` (no `grupoIds`) al desvincular, llama a `removeTag`. Texto de `confirm()`: `` `¿Eliminar el grupo "${group.name}"?` `` → `` `¿Eliminar la etiqueta "${tag.name}"?` ``.
    - `selectGroup` → `selectTag`: usa `getComponentsUsingTag`. Comentario de cabecera (~línea 458) actualizado a "etiqueta"/"panel de Etiquetas".
    - Item de menú contextual "Añadir a grupo" (~línea 532): `label: 'Añadir a grupo'` → `'Añadir a etiqueta'`; `options: sortByName(getTags())...`; `onChange`: variable `groupId`→`tagId`, recorre/actualiza `c.etiquetaIds`; `showToast('Grupo añadido')` → `showToast('Etiqueta añadida')`. Comentario de la línea anterior (~477) actualizado.
    - `renderGroupPanel` → `renderTagPanel`: llama a `renderTagList(tagListContainer, getTags(), getComponents(), { onEdit: (tag) => openTagModal({ tag, onAccept: (updated) => replaceTag(tag.id, updated), onDelete: (t, closeModal) => attemptDeleteTag(t, { onDeleted: closeModal }), onRemoveFromTag: (t, componentId) => { ...actualiza etiquetaIds... } }), onRemove: attemptDeleteTag, ..., onSelectGroup: selectTag → onSelectTag: selectTag, collapsed: tagCollapsed, ...setTagPanelState(...), bodyHeight/columnWidths desde getTagPanelState() })`. Nombre de la llamada `renderGroupPanel()` final → `renderTagPanel()`.
    - Nota: `attemptDropOnMazo(groupIds, draggedRect)` (~línea 124) y variables `groupComponents`/`group` de esa zona (drag&drop sobre un mazo) **no forman parte del concepto "Grupo" de dominio** — ahí "grupo" significa "conjunto de elementos seleccionados arrastrados a la vez" (uso genérico del español, no la entidad `Tag`). Dejar tal cual, no renombrar.

15. **`src/ui/elementSelectionModal.js` — bloque "Grupos" de selección de exportación/importación.** `createElementSelectionGroups(container, { components, resources, groups }, …)`: parámetro `groups`→`tags`; `groupIds: new Set(groups.map(…))` → `tagIds: new Set(tags.map(…))`; entrada de la lista de bloques `{ key: 'groupIds', title: 'Grupos', items: groups, … }` → `{ key: 'tagIds', title: 'Etiquetas', items: tags, … }`; objeto de selección devuelto `groupIds: Array.from(selected.groupIds)` → `tagIds: Array.from(selected.tagIds)`. Las clases `element-selection-group*` (contenedor genérico, ver anotación de alcance) no se tocan — solo las variables/keys de datos.

16. **`src/ui/exportSelectionModal.js` — bloque de selección al exportar.** `openExportSelectionModal({ components, resources, groups, … })`: parámetro `groups`→`tags`; `groupsContainer`→`tagsContainer` (clase `element-selection-modal__groups` → `element-selection-modal__tags`, esta sí es específica de este bloque de datos, no genérica); llamada a `createElementSelectionGroups(tagsContainer, { components, resources, tags }, …)`; `selection.groupIds.length` → `selection.tagIds.length`.

17. **`src/ui/importReportModal.js` — textos de incidencias de importación.** Objeto de mapeo de `tipoError` a texto: `grupo: 'Grupo no incluido'` → `etiqueta: 'Etiqueta no incluida'`; `grupoDuplicado: 'Nombre de grupo duplicado'` → `etiquetaDuplicada: 'Nombre de etiqueta duplicado'` (coherente con los valores de `tipoError` renombrados en `core/importMerge.js`, tarea 6).

18. **`src/ui/styleClipboardSelectionModal.js` — hint del bloque "Generales".** `hint: 'Bloqueado, tooltip, subir al interactuar, grupo'` → `'...etiqueta'`.

19. **`src/ui/styleClipboardErrorModal.js` — comentario de cabecera.** Referencia a "grupo" en el comentario (~línea 2, lista de tipos de referencia que pueden faltar al pegar estilo) → "etiqueta".

20. **`src/ui/columnHeaderMenu.js` — comentario de cabecera.** Referencia a "Grupos" en la lista de paneles que usan este menú (~línea 2) → "Etiquetas".

21. **`src/main.js` — bootstrap.**
    - Import de `./core/state.js`: `getGroups, loadGroups, getGroupPanelState, loadGroupPanelState` → `getTags, loadTags, getTagPanelState, loadTagPanelState`.
    - Llamada a `saveState(...)`: argumentos `getGroups(), getGroupPanelState()` → `getTags(), getTagPanelState()`.
    - Suscripciones de eventos: `on('groups:changed', …)` → `on('tags:changed', …)` (dos suscripciones), `on('groupPanelState:changed', persistState)` → `on('tagPanelState:changed', persistState)`.
    - Carga inicial: `if (saved.groupPanelState) loadGroupPanelState(saved.groupPanelState);` → `saved.tagPanelState`/`loadTagPanelState`; `loadGroups(saved.groups ?? [])` → `loadTags(saved.tags ?? [])`; `loadGroups(seed.groups ?? [])` → `loadTags(seed.tags ?? [])`. Estos leen ya el resultado de `parseState`/equivalente de semilla (tarea 4), que expone `tags`/`tagPanelState` con la compatibilidad de 3 niveles ya resuelta — `main.js` no necesita conocer las claves antiguas.

22. **`src/styles/main.css` — clases CSS.** Renombrar todas las reglas `.group-*` cubiertas por las tareas 9-12 y 14 (`group-checkbox-list__scroll`, `group-modal__*`, `group-panel-container`, `group-panel`, `group-panel__*`, `group-list`, `group-list__*`, `group-delete-confirm-modal__list`) a sus equivalentes `.tag-*`. No tocar `.element-selection-group*` (ver anotación de alcance).

23. **`src/test/errantes-componentes.json`.** No requiere cambio: sigue siendo un fichero de prueba en formato *antiguo* (`"groups": […]`), y la compatibilidad hacia atrás de la tarea 4 garantiza que se siga cargando con normalidad. Opcionalmente (no bloqueante), añadir o adaptar un fichero de prueba con el formato nuevo (`"tags"`) para tener también un ejemplo del formato actual — a criterio de quien implemente.

## (c) Cambios de arquitectura

- **`design/docs/architecture/03-groups-resources.md`**: renombrar la sección "Modelo de datos de grupo" a "Modelo de datos de etiqueta" y su contenido (`core/group.js`→`core/tag.js`, `createGroup`/`updateGroup`/`getComponentsUsingGroup`/`isGroupNameTaken`→equivalentes `Tag`, `grupoIds`→`etiquetaIds`, `groups`/`groupPanelState`→`tags`/`tagPanelState`, `ui/groupList.js`/`ui/groupModal.js`→`ui/tagList.js`/`ui/tagModal.js`, sección "Grupos" de "Generales"→"Etiquetas"). Actualizar el párrafo "Compatibilidad hacia atrás" para describir la cadena de 3 niveles (`decks`/`deckPanelState` → `groups`/`groupPanelState` → `tags`/`tagPanelState`). Actualizar también el título del fichero (primera línea `# Grupos, recursos, ...` → `# Etiquetas, recursos, ...`) y la entrada correspondiente en `design/docs/architecture/INDEX.md` (tabla de "Ficheros hermanos", fila de `03-groups-resources.md`) si describe el contenido con la palabra "grupo".
- **`design/docs/architecture/01-component-model.md`**: tabla de campos del componente — fila `grupoIds` → `etiquetaIds` (tipo, valor por defecto, descripción actualizada a "etiquetas"/`getTags()`); apartado de migraciones (~línea 55) actualizado a `migrateGrupoIdToEtiquetaIds`/`normalizeComponentEtiquetaIds`; lista de campos siempre propagados en copia (~línea 79) `grupoIds`→`etiquetaIds`.
- **`design/docs/architecture/04-modes.md`**: apartado "Sección específica" del menú contextual (~línea 42) y "Panel 'Grupos' (modo edición)" (~línea 72 en adelante, título incluido) — actualizar íntegramente a "etiqueta(s)"/"Panel 'Etiquetas'", incluidas referencias a `ui/groupList.js`/`ui/groupModal.js`/`ui/groupDeleteConfirmModal.js`, `groupPanelState`, `getComponentsUsingGroup`, `attemptDeleteGroup`, `.group-list__row`, `grupoIds`. También la mención en "Ordenación/filtrado de cabecera" (~línea 84, 89) que dice "Grupos"/"Recursos".
- **`design/docs/architecture/05-ui-layer.md`**: referencia a `grupoIds` en `workingComponent` (~línea 30); descripción de `ui/elementSelectionModal.js` (~línea 56) — `groups`→`tags`, "Grupos"→"Etiquetas", `groupIds`→`tagIds`.
- **`design/docs/architecture/06-persistence-build.md`**: apartado de fusión de importación (~líneas 48-49) — "componentes/recursos/grupos"→"componentes/recursos/etiquetas", `grupoId`/`grupoIds`→`etiquetaIds`, "se autocrea un grupo"→"se autocrea una etiqueta".
- Revisar `design/docs/architecture/INDEX.md` §8 (checklist al añadir un tipo/colección nuevo) por si alguna referencia a "grupo" queda desactualizada tras el renombrado (no se ha detectado ninguna explícita en el análisis, pero conviene confirmarlo al tocar el resto de ficheros hermanos).

## (d) Cambios en estilo

- **`design/docs/style/03-modales-menus.md`**: línea ~185, referencia a `.group-checkbox-list__scroll` en "sección 'Grupos' de `ui/componentModal.js`" → `.tag-checkbox-list__scroll` / "sección 'Etiquetas'". Línea ~202, mención "Componentes/Recursos/Grupos" → "Componentes/Recursos/Etiquetas". **No tocar** la sección "12.10 Grupo de botones icono-solo" (~línea 270): es terminología genérica de UI no relacionada con el concepto renombrado (ver anotación de alcance en (a)).

## (e) Verificación

1. Al abrir la modal de cualquier componente (pestaña "Generales"), la sección se titula "Etiquetas", permite marcar/desmarcar checkboxes de las etiquetas existentes y crear una nueva con "+ Crear nueva etiqueta…", sin ningún rastro visible de "Grupo".
2. El panel flotante de modo edición (antes "Grupos") se titula "Etiquetas (N)", con botón "+ Añadir etiqueta", placeholder de filtro "Filtrar etiquetas…" y mensaje vacío "No hay etiquetas todavía." cuando no hay ninguna.
3. Crear, editar (incluye validación de nombre duplicado) y eliminar una etiqueta (sin uso y en uso, comprobando el modal de confirmación con la lista de elementos afectados) funciona igual que antes con "Grupo".
4. Click en una fila del panel de Etiquetas selecciona en la mesa y en Componentes exactamente los elementos con esa etiqueta, igual que antes.
5. Menú contextual de selección múltiple muestra "Añadir a etiqueta" con el desplegable de etiquetas existentes; al elegir una, se añade a los elementos seleccionados y aparece el toast "Etiqueta añadida".
6. Exportar/importar con selección (`ui/exportSelectionModal.js`) muestra el bloque "Etiquetas" correctamente, y una importación con conflicto de nombre o etiqueta ausente genera el informe con los textos "Etiqueta no incluida"/"Nombre de etiqueta duplicado".
7. Copiar estilo de una carta con etiquetas asignadas y pegarlo en otra aplica las mismas etiquetas; si alguna etiqueta copiada ya no existe al pegar, el error mostrado dice "Etiqueta" en vez de "Grupo".
8. Cargar (en local o pegando en `#initial-state`) un guardado/exportado en cada uno de los tres formatos históricos (`decks`/`deckPanelState`, `groups`/`groupPanelState`, y el nuevo `tags`/`tagPanelState`) recupera correctamente las etiquetas y su panel, sin perder datos.
9. Un guardado nuevo hecho tras este cambio usa las claves `tags`/`tagPanelState` en `localStorage` y en el fichero exportado (comprobar con "Guardar a fichero" o inspeccionando `localStorage['errantes:state']`).
10. Ningún texto visible de la aplicación (paneles, modales, menús contextuales, mensajes de error/confirmación, toasts, tooltips) sigue diciendo "Grupo"/"Grupos" salvo la sección de estilo "Grupo de botones icono-solo" (que no es parte de este concepto y no tiene texto visible en la app).
