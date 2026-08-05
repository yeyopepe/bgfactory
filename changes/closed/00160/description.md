- **Nombre**: Columna "Usos" en el listado de recursos
- **Código**: 00160
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

en el modo edición, listado de recursos, añade una columna nueva (posición 2) llamada Usos y en el que cada recurso indique en cuántos elemenos diferentes está siendo utilizada

## Descripción completa

En el modo edición, el panel flotante "Recursos" muestra el listado de recursos (imágenes y tipografías) de la galería en una tabla. Se añade una columna nueva, "Usos", en la segunda posición de esa tabla (entre "Nombre" y "Tipo"). Orden final de columnas: Nombre, Usos, Tipo, Acciones.

Para cada recurso, la columna "Usos" muestra el número de elementos distintos del proyecto en los que ese recurso está siendo utilizado en este momento — cualquier tipo de elemento, no solo los que usan una imagen como fondo principal (por ejemplo, también cuenta si el recurso se usa en cualquiera de las dos caras de una carta o de un tablero personalizado). Un recurso que no se está usando en ningún elemento muestra `0`.

Un elemento que use el mismo recurso más de una vez (por ejemplo, la misma imagen en el anverso y el reverso de una carta) cuenta como un único uso, no como dos.

Es una columna puramente informativa: no se puede ordenar por ella, no es clicable y no añade ningún filtro por cantidad — mismo criterio que ya sigue la columna "Elementos" del panel de Grupos, que resuelve el mismo tipo de necesidad (contar cuántos elementos usan una entidad) y es el precedente directo de este cambio. El número se mantiene siempre actualizado sin ninguna acción del usuario, recalculándose automáticamente cada vez que cambia algo relevante (se añade, edita o borra un elemento).

El cuadro de filtro de texto del panel ("Filtrar recursos…") no cambia: sigue comparando solo el nombre, el tipo y el identificador del recurso, sin tener en cuenta el número de usos.

La columna es redimensionable manualmente, igual que el resto de columnas de esta tabla.

### Preguntas de alcance resueltas

- **Qué cuenta como "uso"**: cualquier elemento que referencie el recurso, ya sea como imagen principal o desde cualquier parte de su configuración específica (por tipo). Confirmado por el usuario.
- **Elementos que repiten el mismo recurso varias veces internamente**: cuentan una sola vez. Confirmado por el usuario.
- **Posición**: 2ª columna, entre "Nombre" y "Tipo". Confirmado por el usuario.
- **Interacción de la columna** (orden/filtro/click): ninguna, es de solo lectura informativa, igual que "Elementos" en Grupos. Confirmado por el usuario.
- **Relación con el filtro de texto existente**: no participa en él. Confirmado por el usuario.

## Apuntes técnicos

- Precedente directo: columna "Elementos" del panel de Grupos (`ui/groupList.js`, cambio 00107), que ya cuenta cuántos componentes usan una entidad con `getComponentsUsingGroup(group.id, components)` — de solo lectura, recalculada en cada repintado, sin orden ni filtro.
- Para Recursos ya existe el equivalente exacto: `getComponentsUsingResource(resourceId, components)` en `core/resource.js`, usada hoy solo para el aviso al bloquear el borrado de un recurso en uso (`modes/edit/editMode.js`, alrededor de la línea 289, función que arma `usedByIds`). No hace falta crear ninguna función de cálculo nueva, solo reutilizarla desde `ui/resourceList.js`.
- `ui/resourceList.js` (`renderResourceList`/`renderBody`) no recibe hoy la lista de componentes — hay que propagarla desde `modes/edit/editMode.js` (`renderResourcePanel()`, que hoy llama a `renderResourceList(resourceListContainer, getResources(), {...})` sin pasar `getComponents()`), análogo a como `renderGroupList(groupListContainer, getGroups(), getComponents(), {...})` ya recibe `components` como tercer argumento posicional para su propia columna "Elementos".
- El array `RESOURCE_LIST_COLUMNS` y el objeto `headLabels` de `ui/resourceList.js` ya controlan el orden/etiquetas de columnas; añadir la clave nueva en la posición 2 y su celda correspondiente en `renderBody` es suficiente. El redimensionado de columnas (`ui/tableColumnResize.js`, `attachColumnResizing`) es genérico y no necesita cambios, solo que la nueva clave forme parte del array de columnas.
- No se ha detectado ninguna incongruencia entre `ARCHITECTURE.md`/`FEATURES.md` y el código real durante este análisis.
