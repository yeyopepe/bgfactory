# Plan — 00107: Columna "Elementos" en el panel de Grupos

## (a) Anotaciones funcionales

Fuera de alcance: nada adicional — el cambio se limita a mostrar el recuento, sin ordenación, filtro ni interacción sobre la nueva columna (ya confirmado en `description.md`).

Dudas resueltas con el usuario (ver `description.md`): qué cuenta como elemento del grupo (cualquier tipo de componente), posición de la columna (entre "Nombre" y "Acciones"), etiqueta ("Elementos"), grupo vacío (`0`), sin interacción añadida, actualización en vivo sin cableado de eventos nuevo, sin redimensionado de columna.

## (b) Solución técnica

1. **`ui/groupList.js`** — `renderBody(body, groups, { onEdit, onRemove })` pasa a `renderBody(body, groups, components, { onEdit, onRemove })`:
   - Importar `getComponentsUsingGroup` de `../core/group.js`.
   - En la cabecera (`thead`), la lista de labels pasa de `['Nombre', 'Acciones']` a `['Nombre', 'Elementos', 'Acciones']`.
   - En cada fila del `tbody`, entre la celda de nombre y la celda de acciones, insertar una nueva `td` con clase `group-list__count-cell` y `textContent = String(getComponentsUsingGroup(group.id, components).length)`.
   - `renderGroupList(container, groups, { onEdit, onRemove, onAdd, collapsed, onToggleCollapse, onPanelMove, onPanelResize, bodyHeight })` gana un nuevo parámetro `components` (posicional, igual que `groups`, ya que es un dato de entrada tan central como la propia lista de grupos — no una opción del objeto de callbacks): `renderGroupList(container, groups, components, { ... })`. Propagar `components` a la llamada interna de `renderBody`.

2. **`modes/edit/editMode.js`** — en `renderGroupPanel()`, cambiar la llamada `renderGroupList(groupListContainer, getGroups(), {...})` a `renderGroupList(groupListContainer, getGroups(), getComponents(), {...})`. `getComponents` ya está importado y en uso en este módulo (no hace falta añadir ningún import nuevo). Al estar `renderGroupPanel()` dentro de `renderEditMode()`, que se remonta por completo ante cualquier `components:changed` (alta/edición/borrado de componente, incluido cambio de `grupoId`) y ante `groups:changed`, el recuento se recalcula solo, sin ningún listener ni cableado adicional.

3. **`src/styles/main.css`** — añadir la regla `.group-list__count-cell { text-align: center; }` (columna puramente informativa, centrada para diferenciarla visualmente de "Nombre", que es texto alineado a la izquierda — mismo criterio que la maqueta validada). No se toca el ancho de columna: el panel de Grupos no tiene `columnWidths` ni redimensionado por columna, y esta columna no lo incorpora.

Orden de implementación: 1 → 2 (para que `renderGroupList` ya tenga el parámetro nuevo cuando se actualice su único punto de llamada) → 3.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md` sección 3, en el párrafo que describe la tercera ventana flotante "Grupos": actualizar "la tabla, de solo dos columnas Nombre/Acciones, no tiene redimensionado de columna" a "la tabla, de tres columnas Nombre/Elementos/Acciones, no tiene redimensionado de columna", y añadir una frase indicando que "Elementos" es una columna de solo lectura con el recuento de componentes (de cualquier tipo) cuyo `grupoId` apunta a ese grupo (`core/group.js`, `getComponentsUsingGroup`, mismo criterio ya usado por el borrado de un grupo en uso), recalculado en cada repintado del panel sin cableado de eventos propio.
