## (a) Anotaciones funcionales

Fuera de alcance:
- No se toca ningún otro punto de la app: no hay más tablas ni paneles redimensionables fuera de "Lista de componentes" y "Lista de recursos".
- No se añade una forma de "resetear" el ancho de columnas o del panel a sus valores por defecto — no se pidió y no hay precedente de ese tipo de acción en la app.

Dudas resueltas con el usuario (en `ms-new`, recogidas ya en `description.md`):
- Límite máximo del panel → se elimina el tope fijo (600px) y el de "mitad de ventana"; solo queda el límite de no salirse del borde derecho de la pantalla.
- Persistencia del ancho de columnas → sí, junto al resto del estado del panel.
- Columnas afectadas → todas, incluida "Acciones".
- Overflow de la tabla → scroll horizontal interno si la suma de anchos de columna supera el ancho visible del panel.

## (b) Solución técnica

1. **`ui/componentList.js` / `ui/resourceList.js` — quitar el tope máximo de ancho del panel.**
   En el `clamp` de `attachResizeHandle` (bloque final de `renderComponentList`/`renderResourceList`), eliminar `MAX_PANEL_WIDTH` y el cálculo `maxByViewport`. El clamp pasa a `{ width: Math.min(Math.max(width, MIN_PANEL_WIDTH), maxByRightEdge) }`. Se elimina la constante `MAX_PANEL_WIDTH` de ambos ficheros (deja de usarse); `MIN_PANEL_WIDTH` no cambia.

2. **Nuevo módulo `ui/tableColumnResize.js`** — lógica compartida de resize de columna, reutilizada por ambos paneles (mismo criterio que `ui/resizeHandle.js`, módulo de `ui/` sin conocimiento del modelo de datos).
   - Exporta `attachColumnResizing(table, columns, widths, onChange)`:
     - `table`: el `<table>` ya insertado en el DOM (necesario para medir anchos reales).
     - `columns`: array ordenado de claves de columna (deben coincidir con el `data-col` de cada `<th>`, ver punto 3).
     - `widths`: objeto persistido `{ [columna]: pxNumber }` o `null`/`undefined` si no hay nada guardado aún.
     - `onChange(newWidths)`: callback invocado al soltar el arrastre, con el objeto completo de anchos ya actualizado, para que el caller lo persista.
   - Si `widths` trae valores, los aplica como `style.width` en los `<th>` correspondientes y pone `table.style.tableLayout = 'fixed'` (si no hay ninguno guardado, la tabla mantiene su `table-layout` por defecto — sin cambios de aspecto respecto a hoy).
   - Para cada `<th>` de `columns`, engancha un manejador de arrastre horizontal reutilizando `attachResizeHandle` (`ui/resizeHandle.js`, `axis: 'x'`) sobre ese `<th>`, y añade la clase adicional `column-resize-handle` al elemento devuelto (`attachResizeHandle` ya devuelve el nodo `.resize-handle` creado) para diferenciarlo visualmente del manejador de esquina del panel vía CSS, sin duplicar la lógica de arrastre.
   - En el primer movimiento de cualquier columna (el `onResize` del primer evento tras el `mousedown`), si la tabla todavía no tiene anchos fijados explícitamente en esta interacción, captura el ancho real (`getBoundingClientRect().width`) de **todas** las columnas y los fija como `style.width` + `table-layout: fixed`, para que el resto de columnas no salte al fijar solo la que se está arrastrando.
   - `clamp` interno: `Math.max(width, MIN_COLUMN_WIDTH)` (constante local, `60px`) — sin límite máximo, mismo criterio que el panel.
   - Al soltar (`onResizeEnd`), llama a `onChange` con el objeto de anchos resultante completo.

3. **`ui/componentList.js` — cabecera de tabla con claves de columna.**
   Sustituir el `thead.innerHTML = '<tr>...'` actual por construcción con `document.createElement`, añadiendo `th.dataset.col = <clave>` a cada `<th>` (`orden`, `id`, `tipo`, `acciones`), para que `attachColumnResizing` pueda localizarlos. Tras `body.appendChild(table)` (final de `renderBody`), invocar `attachColumnResizing(table, ['orden', 'id', 'tipo', 'acciones'], columnWidths, onColumnResize)` — requiere pasar `columnWidths`/`onColumnResize` como nuevos parámetros de `renderBody` (recibidos a su vez de `renderComponentList`).
   `renderComponentList` acepta dos opciones nuevas: `columnWidths` (objeto o `null`) y `onColumnResize` (callback), y las reenvía a `renderBody`.

4. **`ui/resourceList.js` — mismo patrón.**
   `thead` con `data-col` en `nombre`/`tipo`/`acciones`; `attachColumnResizing(table, ['nombre', 'tipo', 'acciones'], columnWidths, onColumnResize)` tras `body.appendChild(table)`; `renderResourceList` acepta `columnWidths`/`onColumnResize` y los reenvía a `renderBody`.

5. **`modes/edit/editMode.js` — persistencia.**
   - `renderList()`: leer `columnWidths` de `getPanelState()` (junto a `collapsed`/`panelPosition`/`panelWidth`, ya leídos al principio de `renderEditMode`) y pasarlo a `renderComponentList` como `columnWidths`, con `onColumnResize: (columnWidths) => setPanelState({ columnWidths })`.
   - `renderResourcePanel()`: análogo con `getResourcePanelState()` / `setResourcePanelState({ columnWidths })`.
   - No hace falta tocar `core/state.js`: `setPanelState`/`setResourcePanelState` ya hacen un merge genérico (`{ ...panelState, ...partial }`) y `saveState`/`loadState` (`core/persistence.js`) persisten el objeto completo tal cual, sin validar su forma — el campo `columnWidths` viaja automáticamente con el resto del estado del panel en cuanto se le pase por `setPanelState`/`setResourcePanelState`.
   - Actualizar el comentario de cabecera de `editMode.js` (línea ~22-23, que hoy describe el shape del panel como `{ collapsed, position, width }`) para incluir `columnWidths`.

6. **CSS (`src/styles/main.css`).**
   - `.component-list th`, `.resource-list th`: añadir `position: relative` (host necesario para el manejador `position: absolute` de la columna).
   - Nueva regla `.column-resize-handle` (modificador visual de `.resize-handle`, mismo criterio de "bloque standalone" que ya usa `.resize-handle` en `STYLE_BIBLE.md` sección 11): redefine posición/tamaño/forma para ocupar el borde derecho completo de la celda (`top: 0; bottom: 0; right: -3px; width: 6px; height: auto;`) y cursor `col-resize` en vez de `nwse-resize`. Su pseudo-elemento `::after` pasa de la diagonal heredada de `.resize-handle` a una línea vertical fina centrada, gris neutro en reposo y `var(--accent-blue)` en `:hover`/`.resize-handle--active` (reutilizando la transición de 150ms ya estándar).
   - `.component-panel__body`, `.resource-panel__body`: añadir `overflow-x: auto` (ya tienen `overflow-y: auto`) para el caso de que la suma de anchos de columna supere el ancho del panel.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:
- Sección 5 (capa `ui/`): añadir `ui/tableColumnResize.js` al listado de módulos reutilizables entre modos, con una línea análoga a la de `ui/resizeHandle.js` describiendo `attachColumnResizing(table, columns, widths, onChange)` y su relación de reutilización con `ui/resizeHandle.js`.
- Sección 3 (línea que dice "El colapso del panel y su posición/ancho... viven en `core/state.js` (`panelState`...)"): actualizar para mencionar que también viven ahí los anchos de columna (`columnWidths`).
- Sección 4.2 (donde describe `resourcePanelState`, "mismo shape `{ collapsed, position, width }`"): actualizar el shape a `{ collapsed, position, width, columnWidths }` en ambos paneles (`panelState` y `resourcePanelState`).

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`, sección 11 ("Redimensionado (manejador de esquina)"):
- Añadir un párrafo/bullet documentando la variante `.column-resize-handle`: mismo mecanismo de arrastre (`ui/resizeHandle.js`, reutilizado vía `ui/tableColumnResize.js`), pero orientado a borde vertical de celda de cabecera en vez de esquina de contenedor — posición borde derecho completo de `<th>`, cursor `col-resize` en vez de `nwse-resize`, grafismo de línea vertical (no el grip diagonal de `.resize-handle::after`) con el mismo tratamiento de color/hover (`var(--accent-blue)`, transición 150ms). Dejar explícito que es una variante del mismo patrón, no un segundo sistema de redimensionado distinto (para no chocar con la advertencia de la sección 11 de "no introducir un segundo patrón de redimensionado").
