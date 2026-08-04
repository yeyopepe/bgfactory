## (a) Anotaciones funcionales

Fuera de alcance: el resaltado de la fila seleccionada (`component-list__row--selected`), la selección múltiple con Ctrl, y el mecanismo ya existente de recordar `scrollTop` del panel entre remontados por cambios ajenos a la selección (mover/editar/redimensionar un componente) — nada de esto se toca, solo se añade el desplazamiento automático que falta.

Sin preguntas de alcance pendientes: la petición y el `description.md` ya dejan claro el comportamiento esperado y los casos límite (selección múltiple, no romper el recuerdo de scroll, no saltar si ya es visible).

## (b) Solución técnica

1. **`src/ui/componentList.js` — marcar cada fila con su id de componente.** En `renderBody`, añadir `row.dataset.id = component.id;` junto a la creación de `row` (donde ya se le pone la clase `component-list__row` / `--selected`). Es el único cambio dentro de `renderBody`; necesario para poder localizar la fila del elemento recién seleccionado desde `renderComponentList` sin depender de recorrer `displayedComponents` de nuevo.

2. **`src/ui/componentList.js` — recordar la última selección conocida entre renders.** Añadir una variable de módulo `let lastSelectedIds = new Set();`, con el mismo criterio que ya usa `filterText` (comentario arriba explicando que el panel es único en la página, así que el estado de módulo sobrevive a los remontados). Se actualiza al final de cada llamada a `renderComponentList` (ver punto 4), nunca dentro de `renderBody` (que también se invoca desde el listener del filtro, donde no debe alterarse este seguimiento).

3. **`src/ui/componentList.js` — calcular qué id "provocó" la selección actual.** Al principio de `renderComponentList` (antes de reconstruir el DOM), calcular:
   ```js
   const newlySelectedId = [...selectedIds].find((id) => !lastSelectedIds.has(id));
   ```
   Esto cubre ambos casos de `toggleSelect` en `editMode.js`: clic normal (reemplaza toda la selección por un único id, que será "nuevo" salvo que ya fuera el único seleccionado) y Ctrl+clic para añadir uno (el resto de la selección ya estaba en `lastSelectedIds`, así que el único id "nuevo" es justo el que se acaba de tocar). Si no hay ningún id nuevo (deselección, o remontado sin cambio de selección), `newlySelectedId` es `undefined` y no se desplaza nada — así se preserva intacto el comportamiento actual de restaurar `previousScrollTop`.

4. **`src/ui/componentList.js` — aplicar el desplazamiento tras insertar las filas, y actualizar el seguimiento.** Justo después de `body.scrollTop = previousScrollTop;` (para que el desplazamiento nuevo tenga la última palabra sobre la restauración de scroll existente, no al revés), si `newlySelectedId` está definido, buscar la fila con `body.querySelector(`[data-id="${CSS.escape(newlySelectedId)}"]`)` y, si existe, invocar `row.scrollIntoView({ block: 'nearest' })`. `block: 'nearest'` es la parte clave: solo desplaza si la fila no está ya completamente visible dentro de `.component-panel__body` (que es el contenedor con `overflow` propio más cercano), sin producir ningún salto si ya se ve — cubre el caso límite de "no desplazar si ya es visible" sin necesitar calcular manualmente los límites del contenedor. Justo después, actualizar `lastSelectedIds = new Set(selectedIds);` (siempre, no solo cuando hay `newlySelectedId`, para que el seguimiento quede correcto de cara al siguiente render aunque esta vez no hubiera nada que desplazar). Este bloque debe ejecutarse solo cuando el panel no está colapsado (dentro del `if (!collapsed) { ... }` ya existente, después de que `body` esté insertado en el DOM), ya que si está colapsado no hay fila visible que desplazar.

No hace falta tocar `editMode.js` ni `main.js`: `renderComponentList` ya recibe `selectedIds` en cada llamada (`renderList()` en `editMode.js`), así que el nuevo comportamiento queda automáticamente conectado a cualquier cambio de selección, venga de la mesa o de la propia lista.
