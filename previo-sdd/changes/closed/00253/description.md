- **Name**: Batería de tests para las funcionalidades 3, 4, 6 y 7
- **Code**: 00253
- **Type**: change
- **Creation date**: 2026-09-07

## Full description

Se añade cobertura de tests funcionales para cuatro funcionalidades del producto que hoy no tienen **ningún** test asociado (la lista de trazabilidad las muestra en la sección "funcionalidades sin ningún test"):

- **003 — Panel flotante de componentes, con selección, resaltado, arrastre y redimensionado.**
- **004 — Ordenación y filtrado desde la cabecera de columna.**
- **006 — Panel flotante de recursos, con filtro de texto.**
- **007 — Edición de un recurso Imagen, con vista previa ampliada de zoom y pan.**

Es un trabajo **exclusivamente de tests sobre comportamiento ya implementado**: no cambia nada de lo que el usuario ve o puede hacer en la aplicación, no añade pantallas, ni opciones, ni datos que se guarden. El objetivo es saldar la deuda de la regla del proyecto según la cual toda funcionalidad debe tener sus tests, y que estas cuatro dejen de figurar como no cubiertas.

El cambio no se considera terminado hasta que la batería completa de tests del proyecto pasa correctamente y el mapa de trazabilidad se regenera sin anomalías, mostrando ya las cuatro funcionalidades con tests asociados.

### Qué debe quedar cubierto por cada funcionalidad

**003 — Panel de componentes:**

- El listado muestra una fila por componente con sus datos (posición en el apilado, identificador, tipo, indicador de si es una copia) y los botones de acción por fila.
- Botón "Editar" abre la edición del componente de esa fila.
- Botón "Clonar" crea al instante, sin confirmación, una copia completa e independiente del componente.
- Botón "Copiar" crea al instante una copia vinculada y sincronizada con el original.
- Botón "Eliminar" borra el componente pidiendo confirmación previa.
- En la fila de un componente que **ya es** una copia no aparecen "Clonar" ni "Copiar" (solo "Editar" y "Eliminar"): no se admiten copias de copias.
- Mientras un componente pertenece a un grupo, sus botones "Clonar" y "Copiar" aparecen deshabilitados; "Editar" y "Eliminar" siguen disponibles.
- **Selección desde la fila**: pulsar una fila selecciona ese componente y lo resalta; volver a pulsarlo cuando es el único seleccionado lo deselecciona; con la tecla Ctrl (o Cmd) la pulsación añade o quita ese componente de la selección sin afectar al resto (selección múltiple). Si el componente pertenece a un grupo, la selección actúa sobre el grupo entero como bloque.
- **Borrado de una selección múltiple**: con dos o más componentes seleccionados, pulsar "Eliminar" en la fila de cualquiera de los seleccionados abre una ventana de confirmación que **enumera** todos los que se van a borrar; con un solo elemento seleccionado se mantiene la confirmación simple de siempre.
- **Identificador del clon**: se construye a partir del identificador del original quitándole cualquier sufijo `(n)` previo y añadiéndole `(n)` con el siguiente número libre para esa raíz (p. ej. "abc" → "abc(1)"; si "abc(1)" existe → "abc(2)"; si se borra "abc(1)" y no queda otro clon de esa raíz, ese hueco se reutiliza). El clon nace en el primer puesto del apilado y desplazado respecto al original.
- **Persistencia del panel**: la posición, el tamaño, el estado colapsado/expandido, el ancho de cada columna y qué grupos están desplegados se conservan y se recuperan al volver a montar el panel. La **selección de fila no se conserva**: es estado momentáneo de la sesión de edición.
- **Filas de grupo plegables**: un grupo tiene su propia fila y puede plegarse/desplegarse; los grupos aparecen plegados por defecto.
- **Traer el panel al frente**: al interactuar de cualquier forma con el panel de Componentes, este pasa a mostrarse por encima de los paneles de Recursos y Etiquetas. Es un mecanismo común a los tres paneles flotantes del modo edición y no se conserva entre recargas.

**004 — Ordenación y filtrado desde la cabecera de columna** (se comprueba sobre los paneles de Componentes y de Recursos):

- Pulsar el nombre de una columna abre un menú con "Ordenar A..Z", "Ordenar Z..A" y, si la columna admite filtro, un desplegable "Filtrar".
- Cada opción de ordenar funciona como interruptor: al activarla queda marcada; al volver a pulsarla se desactiva y la tabla vuelve a su orden por defecto. Solo puede haber una columna ordenada a la vez por tabla: activar la ordenación de una columna desactiva la de cualquier otra.
- El desplegable "Filtrar" ofrece "Todos" más los valores distintos que existen en esa columna, calculados sobre la lista completa (no sobre lo ya filtrado). Elegir un valor muestra solo las filas que lo tienen.
- Los filtros de columna **sí son acumulables** entre columnas distintas (una fila debe cumplirlos todos) y conviven con el cuadro de filtro de texto libre de la misma tabla.
- Toda columna que admite el menú muestra siempre un pequeño indicador junto a su nombre: apagado mientras no hay orden ni filtro en ella, destacado cuando sí los tiene.
- La ordenación y los filtros de columna son estado transitorio: no se guardan y se pierden al recargar, pero sobreviven a que la tabla se vuelva a pintar por altas/bajas/ediciones o por colapsar y expandir el panel.
- Excepción: la columna de posición en el apilado ("Orden") del panel de Componentes solo ofrece ordenar, sin filtro.
- Si un filtro deja la tabla sin ninguna fila, la cabecera de columna sigue mostrándose y solo se sustituye el cuerpo por un mensaje de "sin resultados", de modo que aún se puede abrir el menú de la columna para quitar ese filtro.

**006 — Panel de recursos:**

- El listado muestra una fila por recurso (imagen o tipografía) con nombre, número de usos, tipo y acciones, ordenado alfabéticamente por nombre de forma insensible a mayúsculas y tildes.
- Cuando hay al menos un recurso, la cabecera muestra un cuadro de filtro de texto. Al escribir, la tabla se actualiza en vivo mostrando solo los recursos cuyo nombre, tipo mostrado ("Imagen"/"Tipografía") o identificador interno coincidan parcialmente con lo escrito, de forma insensible a mayúsculas y tildes. Si no hay coincidencias, la tabla se sustituye por un mensaje indicándolo. Ese texto de filtro es transitorio: no se guarda y se resetea al recargar.
- La columna "Usos" indica, para cada recurso, en cuántos componentes distintos del proyecto se está usando en ese momento (un recurso sin ningún uso muestra `0`). No es editable y se recalcula sola cada vez que el panel se repinta. La columna "Usos" no participa en el filtro de texto.
- El panel de Recursos comparte con el de Componentes el comportamiento de redimensionado y de traerse al frente al interactuar con él.

**007 — Edición de un recurso Imagen:**

- El botón "Editar" de un recurso de tipo Imagen abre una ventana más ancha que el resto, con el campo "Nombre del recurso", una vista previa grande y el botón "Cambiar imagen...".
- Dentro de la vista previa: zoom con la rueda del ratón centrado en el punto del cursor (entre el 100 % y el 500 %); botones `+` / `-` para acercar y alejar de forma centrada; un botón que restablece la vista a su tamaño inicial (100 %, centrada); y un indicador que muestra siempre el nivel de zoom actual.
- Con la imagen ampliada (zoom por encima del 100 %) se puede arrastrar con el botón izquierdo para desplazarla dentro del marco.
- El zoom y la posición son solo ayuda visual de inspección: no se guardan en ningún sitio y se reinician cada vez que se abre la ventana y también al reemplazar la imagen.
- La ventana de edición de un recurso de tipo Tipografía no ofrece ninguno de esos controles de zoom/pan: conserva su vista previa habitual.

### Alcance de la cobertura y decisiones acordadas

- **Un fichero de test por funcionalidad.** Cuatro ficheros nuevos, cada uno declarando qué funcionalidad valida. El fichero del menú de cabecera de columna declara la 004 como funcionalidad principal y las 003 y 006 como secundarias, porque se ejercita sobre esos dos paneles.
- **Se reutiliza la infraestructura de test existente**: el montaje del modo edición ya disponible y la localización de los paneles en el DOM ya montado. No se añaden utilidades nuevas de montaje a la infraestructura común; como mucho, si varios ficheros repiten la apertura del menú de una columna, se extrae una pequeña utilidad compartida para ello (decisión de la fase de planificación técnica).
- **Nivel de cada comprobación**: se prioriza el nivel "de estado" (llamar directamente a la lógica y comprobar el resultado) para las reglas puras — identificador del clon y reutilización de huecos, cálculo de la columna "Usos", orden por defecto y comparador de ordenación, orden alfabético insensible a mayúsculas/tildes. Se usa el nivel "de interfaz" (con DOM real) para lo que lo requiere: resaltado de fila seleccionada, botones deshabilitados o ausentes según sea copia o grupo, menú de columna, indicador de cabecera apagado/destacado, mensaje de "sin resultados" con cabecera visible, filtro de texto en vivo del panel de recursos, confirmación enumerada del borrado múltiple, presencia del manejador de redimensionado solo con exactamente un elemento seleccionado, y el zoom/pan del modal de imagen (leyendo la transformación aplicada a la vista previa), el botón de reset, el indicador de nivel de zoom y la ausencia de esos controles en el modal de Tipografía.
- **Persistencia del panel (003): se valida por el contrato de avisos**, no reproduciendo un arrastre real. Es decir: que al mover/redimensionar/colapsar el panel o ajustar el ancho de una columna se avisa para persistir el nuevo valor con la forma correcta, y que un estado de panel ya guardado se relee al montar (posición, tamaño, colapsado, anchos de columna, grupos desplegados). Y que la selección de fila **no** se persiste.
- **Fuera de alcance**: el arrastre real del panel por su cabecera y del manejador de redimensionado con gestos de ratón píxel a píxel (en el entorno de test sin estilos cargados las cajas no tienen dimensiones y el gesto no es fiable); el efecto de cabecera fija al hacer scroll (es puramente visual, sin lógica que comprobar); y la conversión real de la imagen al pulsar "Cambiar imagen..." (ya es competencia de otra funcionalidad y necesita un fichero real).
- **Fixtures**: se reutilizan los juegos de datos de prueba existentes donde encajen; se crea como mucho uno nuevo si sembrar los datos directamente en el propio test resulta demasiado verboso.
- **Sin componente visual**: esta entrada no dibuja nada ni cambia comportamiento observable, así que no lleva mockups, ni diagrama de navegación, ni tabla de datos, ni diagrama de flujo (el flujo de ejecución de la batería ya está documentado en la arquitectura del proyecto).

## Technical notes

- **Framework de test** (`design/docs/architecture/011-functional-test-framework.md`): ficheros `src/test/functional/*.test.js`, engine propio `src/test/harness.js` (`describe`/`it`/`expect`/`registerFeature`), ejecutados por `src/test/run.js` con Playwright/Chromium headless, una navegación de página por **fichero** (aísla el grafo de módulos ES). `npm test` regenera `src/test/TRACEABILITY.md`; una funcionalidad `NNN` inexistente en un `registerFeature` hace fallar la batería (exit 1). Convención de nombres: prefijo `FT-<NNN>-<nn>` en el nombre de cada `it`.
- **Ficheros de test a crear** y su `registerFeature`:
  - `src/test/functional/component-panel.test.js` → `registerFeature({ primary: 3 })`
  - `src/test/functional/column-header-menu.test.js` → `registerFeature({ primary: 4, secondary: [3, 6] })`
  - `src/test/functional/resource-panel.test.js` → `registerFeature({ primary: 6 })`
  - `src/test/functional/resource-image-modal.test.js` → `registerFeature({ primary: 7 })`
- **Helpers existentes** (`src/test/helpers.js`): `resetState`, `mountEditMode`, `mountPlayMode`, `mountChrome`, `loadFixture`, `mockRandom`, `captureDownload`/`getLastDownload`, `injectFileImport`, `restoreAllMocks`, `dispatchContextMenu`, `getOpenContextMenu`. Montaje de los paneles: `mountEditMode()` y localizar en el DOM vivo `.component-panel-container` / `.resource-panel-container` (`renderComponentList`/`renderResourceList` solo se invocan desde `renderEditMode`). Patrón ya usado por `component-transform.test.js` (`.carta`) y por `edit-context-menu.test.js`. Si se repite la apertura del menú de columna, valorar exponer `openColumnMenuOn(th)` en `helpers.js`.
- **API real de los módulos implicados**:
  - `ui/componentList.js` → `renderComponentList(container, components, { onEdit, onEditGroup, onClone, onCopy, onRemove, onUngroup, onSelectRow, onAdd, onReorder, onReorderGroup, expandedGroupIds, onToggleGroupExpand, onPruneExpandedGroups, selectedIds, collapsed, onToggleCollapse, onPanelMove, onPanelResize, columnWidths, onColumnResize, bodyHeight })`. Filas `.component-list__row`, `--selected`, `--group`, `--member`; botones `.component-list__action-btn` (+ `--danger` para eliminar); `cloneButton.disabled` / `copyButton.disabled` gobernados por `component.groupId != null`; "Clonar"/"Copiar" no se pintan si `component.copyOf`. Borrado de fila: si `selectedIds.size > 1 && selectedIds.has(id)` → `onRemove(component, { bulk: true })` sin `confirm()`; si no, `confirm(t('confirm.deleteComponent'))`. Columna "Orden": `<input type="number">` `.component-list__order-input`. Estado de módulo: `filterText`, `columnSort`, `columnFilters` (se resetean solos cuando `components.length === 0`).
  - `ui/resourceList.js` → `renderResourceList(container, resources, { onEdit, onRemove, onAddFile, onAddMultiple, onAddFolder, collapsed, onToggleCollapse, onPanelMove, onPanelResize, columnWidths, onColumnResize, bodyHeight, components })`. Columnas `['nombre','usos','tipo','acciones']`, tabla `.resource-list`; `.resource-list__empty` / `.resource-list__empty-filter`; filtro de texto `.resource-panel__filter input` (`matchesFilter` normaliza con `toLowerCase().normalize('NFD')` y compara `name`, etiqueta de tipo y `id`). Orden por defecto `sortByName`. Estado de módulo propio `filterText`/`columnSort`/`columnFilters`.
  - `ui/tableColumnMenu.js` → `attachColumnMenu(table, columnDefs, items, { sortState, filterState, onToggleSort, onSelectFilter })`. Añade `buildIndicator` (`.column-header-menu__indicator`, `--active` si `sortState?.column === key || filterState?.[key] != null`) a cada `<th data-col>`, marca `.column-header--interactive` y escucha `click`.
  - `ui/columnHeaderMenu.js` → `openColumnHeaderMenu({ anchorEl, sortDirection, filterable, filterValues, activeFilterValue, onToggleSort, onSelectFilter, formatFilterLabel })`. Singleton de módulo, `div.column-header-menu` en `document.body` con `position: fixed`; filas `.column-header-menu__item` (+ `--active`); bloque `.column-header-menu__filter` con `<select>` (`<option value="">` = "Todos") solo si `filterable`; cierra por `mousedown` fuera o Esc.
  - `ui/resourceModal.js` → `openResourceModal({ resource, onAccept, onDelete })`. Imagen: `modal.className = 'modal resource-modal--image'`; `renderImageContent` monta `.resource-modal__image-preview` con `.resource-modal__image-preview__img`, `.resource-modal__zoom-level` (texto `${Math.round(view.zoom*100)}%`), `.resource-modal__zoom-controls` con tres `.resource-modal__zoom-btn` (in/out/reset). `view = { zoom: 1, offsetX: 0, offsetY: 0 }`, `ZOOM_MIN = 1`, `ZOOM_MAX = 5`. `updateTransform()` fija `previewImg.style.transform = \`translate(${offsetX}px, ${offsetY}px) scale(${zoom})\`` y togglea `--zoomed` si `zoom > 1`. `wheel` sobre `previewBox` con `e.preventDefault()` y factor `1.15` / `1/1.15`; `zoomInBtn` = `zoomAt(0,0,1.2)`, `zoomOutBtn` = `zoomAt(0,0,1/1.2)`, `resetBtn` = `resetView()`. Pan: `previewImg` `mousedown` con `e.button === 0 && view.zoom > 1`. `renderFontContent` solo pinta `.resource-modal__font-preview`, sin controles de zoom. Parseo del `transform` análogo a `infinite-table.test.js` con `worldEl.style.transform`.
  - `core/component.js` → `cloneComponent(component, components)` (copia + `properties`/`id` propios, offset +30/+30, `order: null` → resuelto a `order = 1` en `addComponent`, `groupId: null`), `nextCloneId(baseComponentId, components)` (quita sufijo `(n)`, añade el siguiente entero libre para esa raíz), `createCopy(component, components)`, `nextCopyId(originalId, components)` (sufijo `-COPY-XXX`, filtra por `copyOf`).
  - `core/state.js` → `getPanelState`/`setPanelState`/`loadPanelState`, `getResourcePanelState`/`setResourcePanelState`/`loadResourcePanelState`, `getResources`/`addResource`/`replaceResource`/`removeResource`/`loadResources`, `getResourcesSeeded`/`loadResourcesSeeded`. `panelState` guarda `position`/`width`/`height`/`collapsed`/`columnWidths`/`expandedGroupIds`; `resourcePanelState` es independiente (sin `expandedGroupIds`).
  - `core/resource.js` → `RESOURCE_TYPES = { IMAGE: 'imagen', FONT: 'tipografia' }`, `getComponentsUsingResource(resourceId, components)` (recorre `component.image` y valores hoja de `component.properties` en profundidad → array de ids), `resourceTypeForFileName`, `createResource`/`updateResource`.
  - `core/textSort.js` → `sortByName(items)` (por `.name`, `localeCompare` con `sensitivity: 'base'`, locale del idioma activo), `compareValues(a, b)` (`a - b` si ambos `number`; si no `localeCompare` con `sensitivity: 'base'`, `numeric: true`).
  - `modes/edit/editMode.js` → `selectedComponentIds` (Set de módulo que `resetState()` **no** limpia), `primarySelectedIds`, `toggleSelect(component, event)` (lee `event.ctrlKey`/`event.metaKey`; grupo tratado como unidad vía `getSelectionUnit`), `panelStackOrder` + `bringPanelToFront`/`applyPanelStackOrder` (`zIndex = 15 + index` sobre `.component-panel-container`/`.resource-panel-container`/`.tag-panel-container`; listeners `mousedown` en fase de captura), `attemptDeleteComponents` (1 → `confirm()` nativo; 2+ → `openBulkDeleteConfirmModal` de `ui/bulkDeleteConfirmModal.js`, enumera afectados). Exporta `moveSelectedComponent(dx, dy)`.
- **Gotcha de aislamiento** (ya conocido por `edit-context-menu.test.js` / `component-transform.test.js`): `selectedComponentIds` y `panelStackOrder` de `editMode.js`, y `filterText`/`columnSort`/`columnFilters` de `componentList.js` y `resourceList.js` por separado, son estado de módulo que `resetState()` no toca. Mitigación por caso: ids distintos por caso, y limpiar el filtro explícitamente (`''` en el input + `input`) o partir de lista vacía (que resetea `filterText`/`columnSort`/`columnFilters`).
- **Cierre**: `npm test` en verde + `TRACEABILITY.md` regenerado sin anomalías, con 003/004/006/007 ya con tests. Actualizar la tabla "Test files" de `design/docs/architecture/011-functional-test-framework.md` con las cuatro entradas nuevas (fichero, feature link, nivel).
- **Seguridad**: sin puntos pendientes. Código de test dev-only bajo `src/test/`, fuera del bundle (`build.py` recorre imports desde `src/main.js`). Playwright ya es `devDependency` pineada.
