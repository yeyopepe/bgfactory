## (a) Anotaciones funcionales

- Fuera de alcance: cualquier acción de listado distinta de "Eliminar" (Editar/Clonar/Copiar) no se generaliza a la selección múltiple — se confirmó explícitamente con el usuario en `ms-new` que solo Eliminar pasa a aplicarse en bloque.
- Fuera de alcance: no se introduce ningún atajo para seleccionar/deseleccionar todo, ni selección por arrastre de un rectángulo ("marquee select") — no se ha pedido.
- Dudas resueltas con el usuario durante `ms-new` (ver `description.md`): Ctrl+clic sobre un elemento ya seleccionado lo deselecciona sin tocar el resto; solo Eliminar se aplica en bloque; el listado de Componentes debe reflejar todos los seleccionados; el arrastre mueve todo el bloque manteniendo distancias relativas.

## (b) Solución técnica

1. **`src/ui/componentRenderer.js` — generalizar `selectedId` (string) a `selectedIds` (Set\<string\>)**
   - Cambiar la firma de `renderComponentsOnTable(worldEl, components, { ..., selectedId = null, ... })` a `selectedIds = new Set()`.
   - En cada una de las cinco ramas por tipo (`texto`, `tablero`, `dado`, `documento`, `carta`), sustituir `if (component.id === selectedId) { ...--selected }` por `if (selectedIds.has(component.id)) { ...--selected }`.
   - En cada rama, la condición que activa el manejador de redimensionado (`if (onResize && component.id === selectedId)`) pasa a `if (onResize && selectedIds.size === 1 && selectedIds.has(component.id))` — el resize solo debe ofrecerse con selección de un único elemento, tal como confirma `description.md`.
   - En cada rama, el listener de `click` que hoy invoca `onToggleSelect(component)` pasa a `onToggleSelect(component, e)`, para que quien gestiona la selección (`editMode.js`) pueda leer `e.ctrlKey`/`e.metaKey`.
   - Ninguna otra parte del renderizado cambia.

2. **`src/ui/componentList.js` — mismo cambio de `selectedId` a `selectedIds`**
   - `renderBody`/`renderComponentList` reciben `selectedIds = new Set()` en vez de `selectedId = null`; la fila usa `selectedIds.has(component.id)` para añadir `component-list__row--selected`.
   - El listener de la fila pasa el evento: `row.addEventListener('click', (event) => onSelectRow(component, event))`.
   - Botón "Eliminar" de cada fila: si la fila pertenece a una selección múltiple activa (`selectedIds.size > 1 && selectedIds.has(component.id)`), no muestra el `confirm()` nativo — invoca directamente `onRemove(component, { bulk: true })`, delegando la confirmación (que debe enumerar todos los elementos) en quien la gestiona. Si no (fila fuera de la selección múltiple, o selección de tamaño ≤ 1), mantiene el comportamiento actual sin cambios: `confirm()` de un único elemento y luego `onRemove(component)` (equivalente a `onRemove(component, { bulk: false })`, se puede omitir el segundo argumento en este caso).

3. **`src/ui/bulkDeleteConfirmModal.js` (nuevo fichero)**
   - Mismo patrón que `src/ui/groupDeleteConfirmModal.js`: overlay + modal con cabecera, un `<p>` con el mensaje, una `<ul>` con una entrada por elemento (`${getComponentTypeLabel(component.type)}: ${component.id}`, reutilizando `getComponentTypeLabel` de `ui/componentTypeModal.js`) y pie con "Cancelar"/"Aceptar" (`onConfirm` al aceptar, cierre sin más al cancelar o al hacer click fuera del overlay).
   - Expone `openBulkDeleteConfirmModal({ components, onConfirm })`. Cabecera: `Eliminar ${components.length} componentes`. Mensaje: `Se van a eliminar los siguientes elementos:`.

4. **`src/modes/edit/editMode.js` — generalizar el estado de selección y las acciones**
   - Sustituir `let selectedComponentId = null;` por `let selectedComponentIds = new Set();` (mismo criterio de vivir fuera de `renderEditMode` que ya se documenta para `selectedComponentId`).
   - `toggleSelect(component, event)`: si `event?.ctrlKey || event?.metaKey` es `true`, añade o quita `component.id` del `Set` (según si ya estaba) sin tocar el resto; si no, reemplaza la selección completa por `{component.id}` — salvo que la selección ya fuera exactamente ese único elemento, en cuyo caso la vacía (mismo comportamiento de toggle que ya existía en selección única). Termina igual que ahora, con `renderList(); renderTable();`.
   - Nueva función interna `attemptDeleteComponents(components)`: si `components.length === 0` no hace nada; si es `1`, mantiene el `confirm()` nativo actual (`¿Eliminar el componente "${component.id}"?`) y, si se confirma, `removeComponent(component.id)` + `selectedComponentIds.delete(component.id)`; si es `2` o más, invoca `openBulkDeleteConfirmModal({ components, onConfirm: () => { for (const c of components) removeComponent(c.id); selectedComponentIds.clear(); } })`.
   - `deleteSelectedComponent()` (export usado por `main.js`/`ui/globalShortcuts.js`, sin cambiar su firma pública): pasa a construir `const components = getComponents().filter((c) => selectedComponentIds.has(c.id));` y delega en `attemptDeleteComponents(components)`.
   - Los tres puntos que hoy resetean `selectedComponentId` al borrar desde la modal de edición (`openEditModalFor` ×2 y `openAddModal`, callback `onDelete`) pasan de `if (selectedComponentId === deletedComponent.id) selectedComponentId = null;` a `selectedComponentIds.delete(deletedComponent.id);` (incondicional, `Set.delete` ya no-op si no estaba).
   - `renderTable()`: pasa `selectedIds: selectedComponentIds` en vez de `selectedId`. El callback `onMove(component, x, y)` se generaliza para mover en bloque: si `selectedComponentIds.size > 1 && selectedComponentIds.has(component.id)`, calcula `dx = x - (component.x ?? 0)` / `dy = y - (component.y ?? 0)` a partir del propio componente arrastrado (su posición previa a este movimiento, todavía la que tiene en `getComponents()` en este punto) y por cada id de `selectedComponentIds` llama a `replaceComponent(id, updateComponent(c, { x: nuevaX, y: nuevaY }))`, usando `x`/`y` directamente para el componente arrastrado y `(c.x ?? 0) + dx` / `(c.y ?? 0) + dy` para el resto. Si la selección no tiene más de un elemento, mantiene el `replaceComponent(component.id, updateComponent(component, { x, y }))` de siempre.
   - `renderList()`: pasa `selectedIds: selectedComponentIds` en vez de `selectedId`, y el callback `onRemove` pasa a aceptar `(component, { bulk } = {})`: si `bulk` es `true`, `attemptDeleteComponents(getComponents().filter((c) => selectedComponentIds.has(c.id)))`; si no, comportamiento actual (`removeComponent(component.id)`), añadiendo `selectedComponentIds.delete(component.id)` para no dejar un id de selección apuntando a un componente ya borrado.
   - Importar `openBulkDeleteConfirmModal` desde el nuevo fichero.

5. **`src/modes/play/playMode.js` — adaptar la única llamada que queda con selección de un solo id**
   - En la línea donde pasa `selectedId: selectedComponentId` a `renderComponentsOnTable`, cambia a `selectedIds: selectedComponentId ? new Set([selectedComponentId]) : new Set()` — sin más cambios: el modo juego sigue con selección de un único componente ligada al menú contextual, sin `onToggleSelect` ni selección múltiple.

6. **`src/styles/main.css` — nueva clase para la lista del modal de borrado múltiple**
   - Añadir `.bulk-delete-confirm-modal__list` junto a `.group-delete-confirm-modal__list` (sección "Group delete confirmation modal"), con las mismas reglas (`max-height: 200px; overflow-y: auto; margin: 0.5rem 0; padding-left: 1.5rem; font-size: 0.875rem;`) — mismo patrón visual, bloque BEM propio del nuevo modal, sin tocar la clase existente.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:

- **Sección 3** (párrafo de `modes/edit/editMode.js`): actualizar la frase "Al hacer click sobre una fila de la tabla (selección única con toggle, estado en memoria, no persistido)..." para reflejar que la selección pasa a ser múltiple (`selectedComponentIds`, `Set<string>` de módulo, mismo motivo de no persistirse que `selectedComponentId` hoy) con Ctrl+clic añadiendo/quitando elementos individuales, y que el listado y la mesa resaltan a la vez todos los elementos seleccionados.
- **Sección 5**, entrada de `ui/componentRenderer.js`: actualizar la firma documentada de `renderComponentsOnTable(...)` (`selectedId = null` → `selectedIds = new Set()`) y la frase sobre `onToggleSelect`/`selectedId`/resize para reflejar que ahora opera sobre un conjunto, que el resize solo se ofrece con selección de tamaño 1, y que `onToggleSelect(component, event)` recibe también el evento para poder leer `ctrlKey`/`metaKey`.
- **Sección 5**, entrada de `ui/componentList.js`: actualizar la firma documentada (`selectedId = null` → `selectedIds = new Set()`), y añadir que el botón "Eliminar" de una fila que forma parte de una selección múltiple activa delega el borrado en bloque en el caller (`onRemove(component, { bulk: true })`) en vez de confirmar y borrar solo esa fila.
- **Sección 5**: añadir una entrada nueva para `ui/bulkDeleteConfirmModal.js`, análoga a la ya existente para `ui/groupDeleteConfirmModal.js` (mismo patrón de modal que enumera afectados, aquí para el borrado en bloque de componentes de una selección múltiple en modo edición).
- **Sección 5**, entrada de `ui/globalShortcuts.js`/`deleteSelectedComponent`: actualizar la frase final para reflejar que SUPR ahora dispara el borrado de toda la selección (uno o varios elementos), reutilizando confirmación simple o la nueva modal de borrado en bloque según el tamaño de la selección.
