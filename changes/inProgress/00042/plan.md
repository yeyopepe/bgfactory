## (a) Anotaciones funcionales

- Fuera de alcance: no se añade ningún tipo de resaltado del texto coincidente en la fila (el `design_filtro-panel-recursos.html` lo ilustra con `<mark>`, pero `description.md` no lo pide explícitamente en "Definición visual de alto nivel" ni en el comportamiento — se deja fuera para no ampliar el alcance ya confirmado con el usuario). Si se quiere en el futuro, sería una ampliación aparte.
- No hay dudas técnicas adicionales que resolver con el usuario: `description.md` ya deja claro contra qué campos comparar (nombre, tipo mostrado, id) y que la coincidencia es parcial, insensible a mayúsculas/minúsculas y a tildes.

## (b) Solución técnica

1. **`src/ui/resourceList.js` — estado del filtro**
   - Añadir una variable de módulo `let filterText = '';` (fuera de `renderResourceList`). Es un panel único en la página (montado una sola vez desde `editMode.js`), así que basta con estado de módulo para que el texto sobreviva a los re-renders provocados por `resources:changed`, `onToggleCollapse`, etc., y se resetee solo al recargar la página — igual que pide `description.md`.
   - Añadir una función `normalize(str)` que pase a minúsculas y elimine diacríticos (`str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')`), usada tanto para el texto del filtro como para los campos comparados.
   - Añadir una función `matchesFilter(resource, query)` que compare `query` normalizado contra `resource.name`, `TYPE_LABELS[resource.type]` y `resource.id`, normalizados igual, usando `includes`.

2. **`src/ui/resourceList.js` — cuadro de filtro**
   - Justo debajo de `header` y antes del bloque `if (!collapsed)` actual, cuando el panel no está colapsado, insertar un `div.resource-panel__filter` con un `input[type="text"]` (`placeholder="Filtrar recursos…"`, `value = filterText`) al inicio de `body`, antes de la tabla — igual que indica "Apuntes técnicos" de `description.md`.
   - El filtro solo tiene sentido si hay recursos que filtrar: si `resources.length === 0`, no mostrar el cuadro de filtro (se sigue mostrando el mensaje "No hay recursos todavía.").

3. **`src/ui/resourceList.js` — filtrado en vivo sin perder el foco**
   - Extraer a una función interna `renderBody(container, filteredResources)` la parte que hoy construye la tabla o el mensaje de vacío dentro de `body`, para poder volver a invocarla solo sobre el contenedor de la tabla sin tocar el `input` del filtro.
   - En el listener `input` del cuadro de filtro: actualizar `filterText = e.target.value`, recalcular `resources.filter(r => matchesFilter(r, filterText))` y volver a pintar únicamente la zona de la tabla (vía `renderBody`), dejando el `input` intacto para no perder el foco ni la posición del cursor mientras se escribe.
   - Si el resultado filtrado está vacío y `filterText` no está vacío, mostrar en la zona de la tabla un mensaje "No hay recursos que coincidan con «{filterText}»." (clase `resource-list__empty-filter`, reutilizando el texto visto en el design). Si `filterText` está vacío, comportamiento actual (todos los recursos, o "No hay recursos todavía." si no hay ninguno).
   - En el render inicial de `renderResourceList` (cuando se reconstruye todo el panel, p.ej. al añadir/editar/eliminar un recurso), aplicar el mismo filtrado con el `filterText` ya guardado en la variable de módulo, para que el filtro no se pierda al re-renderizar por cambios externos.

4. **`src/styles/main.css` — estilos nuevos**
   - Añadir `.resource-panel__filter` (padding `0.5rem 1rem`, `border-bottom: 1px solid #ddd`) siguiendo el patrón visual del `design_filtro-panel-recursos.html`.
   - Añadir estilos para el `input` del filtro reutilizando la convención ya existente en `.modal__field input[type="text"]` (línea 320 de `main.css`): `padding: 0.5rem`, `border: 1px solid #ddd`, `border-radius: 4px`, `font-size: 0.875rem`, `width: 100%`, `box-sizing: border-box`; añadir un estado `:focus` con `border-color: var(--accent-blue)` para consistencia con el resto de controles interactivos del panel.
   - Añadir `.resource-list__empty-filter` (mismo tratamiento que `.resource-list__empty` ya existente: padding, texto centrado, color atenuado).

## (d) Cambios en estilo

- `design/docs/stylebible/STYLE_BIBLE.md` ya cubre el tamaño de fuente (`0.875rem`) y el radio de borde (`4px`) usados aquí, y no se introduce ningún patrón nuevo (el cuadro de texto reutiliza la convención ya documentada para inputs de `.modal__field`) — no hace falta actualizar la guía de estilo.
