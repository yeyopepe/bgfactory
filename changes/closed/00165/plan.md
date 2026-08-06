- **Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

**Fuera de alcance:**
- No se toca el filtro de texto libre ya existente en Componentes/Recursos (comportamiento y clases actuales intactos).
- No se persiste el orden/filtro de columna en `core/state.js` ni en el fichero de guardado — es estado transitorio de sesión, igual que `filterText`.
- No se añade filtro de columna a "Acciones" en ninguna tabla, ni a "Orden" en Componentes (solo ordenar).

**Dudas resueltas con el usuario** (ya recogidas en `description.md`, no se repiten aquí en detalle): toggle de ordenación con estado "apagado" al repulsar la opción activa; una sola ordenación activa por tabla; filtros acumulables entre columnas y con el texto libre; combo de filtro calculado sobre la lista completa; Grupos gana también filtro de texto y redimensionado de columna para quedar a la par.

**Duda técnica resuelta durante este análisis** (no estaba en `description.md`): dónde debe vivir el desplegable en el DOM. `.component-panel`/`.resource-panel`/`.group-panel` tienen `overflow: hidden` y su `__body` interior `overflow: auto` (tabla con scroll). Un desplegable `position: absolute` anclado al `<th>` (como `.resource-add__menu`, sección 12.7 de STYLE_BIBLE) quedaría recortado por esos `overflow` en cuanto el panel esté cerca del borde de la pantalla o la tabla tenga scroll. Se resuelve con el mismo mecanismo que ya usa `ui/contextMenu.js` para el mismo problema: `position: fixed`, insertado en `document.body`, con la posición calculada a partir de `getBoundingClientRect()` del `<th>` pulsado y reajustada para no salirse de la ventana — no `position: absolute` colgando del `<th>`.

## (b) Solución técnica

1. **`core/textSort.js`** — añadir `compareValues(a, b)`: comparador genérico reutilizado por las tres tablas para ordenar por cualquier columna (numérico si ambos son `number`, si no `localeCompare('es', { sensitivity: 'base', numeric: true })`). `sortByName` no se toca.

2. **Nuevo `ui/columnHeaderMenu.js`** (hermano de `ui/contextMenu.js`, mismo mecanismo de apertura/cierre — singleton de módulo, `position: fixed` insertado en `document.body`, cierre por click fuera o Esc, reajuste para no salirse de la ventana — pero contenido y disparo distintos: se ancla bajo un `<th>` en vez de junto al cursor, y no reutiliza el HTML de `contextMenu.js` porque este necesita un `<select>` embebido que ese módulo no contempla).
   - `openColumnHeaderMenu({ anchorEl, sortDirection, filterable, filterValues, activeFilterValue, onToggleSort, onSelectFilter })`:
     - `sortDirection`: `'asc' | 'desc' | null` — el que esté activo ahora mismo en esa columna.
     - Dos filas "Ordenar A..Z" / "Ordenar Z..A", con `.column-header-menu__item--active` en la que coincida con `sortDirection`. Click → `onToggleSort('asc' | 'desc')` (la exclusividad y el apagado al repulsar los decide quien invoca, no este módulo) y cierra el menú.
     - Si `filterable`, separador + bloque "Filtrar" con un `<select>` (`Todos` + `filterValues`, preseleccionado `activeFilterValue ?? 'Todos'`). Al cambiar → `onSelectFilter(value === 'Todos' ? null : value)` y cierra el menú.
     - Si no `filterable`, no se pinta el bloque de filtro en absoluto (columna "Orden").

3. **Nuevo `ui/tableColumnMenu.js`** (junto a `ui/tableColumnResize.js`, incorporado por cada uno de los tres listados tras construir su `<thead>`, igual que ya hacen con `attachColumnResizing`):
   - `attachColumnMenu(table, columnDefs, items, { sortState, filterState, onToggleSort, onSelectFilter })`.
   - `columnDefs`: `{ key, filterable, getValue(item) }[]` — una entrada por columna interactiva (todas menos "Acciones"; en Componentes, "Orden" con `filterable: false`).
   - Para cada `columnDef`, localiza `table.querySelector('th[data-col="key"]')`, le añade la clase `.column-header--interactive` (cursor pointer, sin usar `style.cursor` inline — sección 8 de STYLE_BIBLE) y un listener de `click` que ignora clicks originados en `.column-resize-handle` (`event.target.closest('.column-resize-handle')`, necesario porque el manejador de arrastre solo hace `stopPropagation` en `mousedown`, no en `click`) y si no, calcula los valores distintos de esa columna sobre `items` (lista completa sin filtrar, vía `getValue` + `compareValues` para el orden de aparición en el combo) y abre `openColumnHeaderMenu`.
   - Tras construir la cabecera, añade también el indicador (`.column-header-menu__indicator`, icono SVG embudo ya usado en la maqueta) dentro del `<th>` de cualquier columna con `sortState?.column === key` o `filterState[key] != null`.

4. **`ui/componentList.js`**:
   - `COMPONENT_LIST_COLUMN_DEFS`: `orden` (`filterable:false`, `getValue: c => c.order`), `id` (`getValue: c => c.id`), `tipo` (`getValue: c => c.type`), `copia` (`getValue: c => c.copyOf ? 'Sí' : 'No'`).
   - Nuevo estado de módulo `columnSort`/`columnFilters` (mismo criterio que `filterText`: transitorio, se resetea junto con `filterText` cuando la lista queda vacía).
   - Extraer la construcción de la lista mostrada (hoy `sortedComponents.filter(matchesFilter)`, duplicada en el handler del `input` y en el cuerpo de `renderComponentList`) a una función interna `computeDisplayedList(components)` que aplica, en orden: filtro de texto existente → filtros de columna (`columnFilters`, AND) → si `columnSort` está activo, `compareValues` sobre `getValue` de esa columna con la dirección correspondiente; si no, el orden por defecto actual (`order`).
   - Los callbacks de `attachColumnMenu` (`onToggleSort`/`onSelectFilter`) actualizan `columnSort`/`columnFilters` con la semántica ya acordada (repulsar la ordenación activa la apaga; activar una ordenación desactiva la de cualquier otra columna de esta tabla; los filtros se acumulan) y vuelven a pintar el cuerpo con `renderBody(body, computeDisplayedList(components), ...)`, igual que ya hace hoy el listener del `input` de texto — sin pasar por `renderComponentList` completo, para no perder scroll/estado del panel.
   - `renderBody` pasa a recibir también la lista completa (`components`, no solo `displayedComponents`) para que `attachColumnMenu` calcule las opciones del combo sobre el universo completo.

5. **`ui/resourceList.js`**: mismo patrón que el punto 4, con `RESOURCE_LIST_COLUMN_DEFS`: `nombre` (`getValue: r => r.name`), `usos` (`getValue: r => getComponentsUsingResource(r.id, components).length`, numérico), `tipo` (`getValue: r => TYPE_LABELS[r.type] ?? r.type`). El orden por defecto (sin `columnSort` activo) sigue siendo `sortByName`.

6. **`ui/groupList.js`** — además de sumarse al mismo patrón (`GROUP_LIST_COLUMN_DEFS`: `nombre` con `getValue: g => g.name`, `elementos` con `getValue: g => getComponentsUsingGroup(g.id, components).length`, numérico), se le añade lo que le falta para quedar a la par de las otras dos ventanas:
   - `GROUP_LIST_COLUMNS = ['nombre', 'elementos', 'acciones']` con `th.dataset.col` (hoy las cabeceras son texto plano sin `data-col`), necesario tanto para `attachColumnResizing` como para `attachColumnMenu`.
   - Cuadro de filtro de texto libre (`filterText`, estado de módulo, misma estructura que `.component-panel__filter`/`.resource-panel__filter` — busca por `group.name`), con su propio bloque CSS `.group-panel__filter` (mismo aspecto, duplicado igual que ya está duplicado entre Componentes y Recursos).
   - Redimensionado de columna: `attachColumnResizing(table, GROUP_LIST_COLUMNS, columnWidths, onColumnResize)`, con `columnWidths`/`onColumnResize` como nuevos parámetros de `renderGroupList` (mismo contrato que ya tienen `renderComponentList`/`renderResourceList`).

7. **`modes/edit/editMode.js`** (`renderGroupPanel`): pasar los dos parámetros nuevos de `renderGroupList` — `columnWidths: getGroupPanelState().columnWidths` y `onColumnResize: (columnWidths) => setGroupPanelState({ columnWidths })` — igual que ya hace `renderList`/`renderResourcePanel` con sus respectivos paneles. `core/state.js` no necesita ningún cambio: `setGroupPanelState`/`getGroupPanelState` ya hacen spread de `partial` sobre el objeto existente (igual que `panelState`/`resourcePanelState`, que tampoco declaran `columnWidths` en su valor por defecto), así que el nuevo campo funciona sin tocar esa capa.

8. **`src/styles/main.css`** — nuevas reglas (ver detalle en (d)): `.column-header--interactive`, `.column-header-menu*`, `.column-header-menu__indicator`, `.group-panel__filter*` (duplicando el bloque ya existente de `.resource-panel__filter*`).

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 3 (donde se describe cada uno de los tres paneles flotantes de modo edición), añadir una entrada nueva describiendo:
- El menú de cabecera de columna (`ui/columnHeaderMenu.js` + `ui/tableColumnMenu.js`), común a Componentes/Recursos/Grupos: ordenación excluyente por tabla y filtros de columna acumulables, estado transitorio de módulo (mismo criterio que `filterText`), combo de filtro calculado sobre la lista completa.
- Que a partir de este cambio "Grupos" ya no es la excepción sin filtro de texto ni redimensionado de columna: queda con el mismo comportamiento que Componentes y Recursos en ambos aspectos (matiza/sustituye la frase actual "sin `columnWidths` — la tabla ... no tiene redimensionado de columna").

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`:

- **Sección 12.7 ("Menú desplegable de acciones")**: añadir un tercer uso del patrón, análogo a como ya se documentó el segundo uso (`cardEditorModal.js`) — `ui/columnHeaderMenu.js` reutiliza el mismo lenguaje visual (fondo `var(--accent-blue-light)`, borde `rgba(44, 125, 216, 0.25)`, `border-radius: var(--radius-sm)`, `box-shadow: var(--shadow-2)`, hover `var(--accent-blue)`/texto `var(--text-light)`) con clases propias (`.column-header-menu`/`.column-header-menu__item`/`.column-header-menu__separator`/`.column-header-menu__filter`) en vez de `.resource-add__*`, **con una diferencia técnica explícita a anotar**: a diferencia de `.resource-add__menu` (que sí puede ser `position: absolute` porque cuelga de un footer sin overflow por encima), `.column-header-menu` usa `position: fixed` insertado en `document.body` con reajuste tras medir su tamaño — mismo mecanismo que ya usa `.context-menu` (sección 12.8) — porque su punto de anclaje (`<th>`) vive dentro de un contenedor con `overflow: auto`/`hidden` (`.component-panel__body`/`.component-panel`, y análogos) que lo recortaría.
- **Ítem de ordenación activo** (`.column-header-menu__item--active`): reutiliza la convención ya fijada en la sección 12.10 para "opción activa" (`fondo var(--accent-blue)`, texto `var(--text-light)`) en vez de inventar un tratamiento nuevo — mismo lenguaje que `.align-group__btn.active`/`.modal__tab.active`.
- **Nuevo indicador de columna con orden/filtro activo** (`.column-header-menu__indicator`): icono SVG pequeño (16×16px aprox, `stroke`/`fill: currentColor`, color `var(--accent-blue)`) insertado junto al texto de la cabecera — mismo criterio de icono inline `currentColor` que el resto de iconos de la app (sección 9, botón icono-solo).
- **Sección 10 (Layout/z-index)**: no requiere entrada nueva en la tabla de capas fijas — `.column-header-menu`, aunque usa `position: fixed` como `.context-menu`, es de vida muy corta (un único menú abierto a la vez, igual que `.context-menu`) y puede compartir su mismo nivel (`z-index: 500`), sin necesitar un nivel propio.
