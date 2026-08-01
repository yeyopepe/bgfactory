- **Nombre**: Columna "Elementos" en el panel de Grupos
- **Código**: 00107
- **Tipo**: change

## Prompt original del usuario

Añade a la ventana de grupos en el modo edición una columna nueva con el número de elementos que hay en el grupo

## Descripción completa

En el panel flotante "Grupos" del modo edición, la tabla de grupos (hoy con columnas Nombre y Acciones) gana una columna nueva, "Elementos", situada entre "Nombre" y "Acciones", que muestra cuántos elementos pertenecen a cada grupo en cada momento.

Un elemento cuenta como perteneciente a un grupo si tiene ese grupo asignado, sin importar de qué tipo sea (cuadro de texto, tablero, dado, visor de documentos o carta). Si un grupo no tiene ningún elemento asignado, la columna muestra `0`.

Es una columna puramente informativa: no se puede ordenar por ella, no es clicable, y no añade ningún filtro por cantidad — el resto del comportamiento de la tabla (sin fila seleccionable, sin redimensionado de columnas) no cambia. El número se mantiene siempre actualizado: refleja el recuento vigente cada vez que se repinta el panel, sin necesidad de ninguna acción del usuario.

### Preguntas de alcance resueltas con el usuario

- **Qué cuenta como "elemento del grupo"**: se confirmó que es cualquier tipo de componente, no solo cartas.
- **Posición de la columna**: se confirmó que va entre "Nombre" y "Acciones".
- **Etiqueta de la columna**: se confirmó "Elementos".
- **Grupo vacío**: se confirmó que muestra `0`, no un guion ni un espacio en blanco.
- **Interacción**: se confirmó que es solo informativa, sin orden, filtro ni click asociado.

## Apuntes técnicos

- `ui/groupList.js`: `renderBody(body, groups, { onEdit, onRemove })` construye hoy la tabla con cabecera fija `['Nombre', 'Acciones']` y, por fila, una celda de nombre más una celda de acciones; no recibe la lista de componentes. `renderGroupList(container, groups, { onEdit, onRemove, onAdd, collapsed, onToggleCollapse, onPanelMove, onPanelResize, bodyHeight })` es el punto de entrada exportado.
- `modes/edit/editMode.js`: `renderGroupPanel()` invoca `renderGroupList(groupListContainer, getGroups(), {...})` — en ese punto ya tiene disponible `getComponents()` (usado por el resto del módulo), así que puede pasarse sin cableado de eventos nuevo.
- `core/group.js` expone `getComponentsUsingGroup(groupId, components)`, que ya filtra por `component.grupoId === groupId` sin restricción de tipo y devuelve la lista de ids afectados — su `.length` es el recuento a mostrar (mismo criterio ya usado por `ui/groupDeleteConfirmModal.js` al borrar un grupo en uso).
- `design/docs/ARCHITECTURE.md` sección 3 describe hoy el panel "Grupos" como "con el listado de grupos en tabla (columnas Nombre, Acciones)" — habrá que actualizar esa frase para incluir la nueva columna "Elementos".
