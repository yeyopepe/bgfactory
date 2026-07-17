# Plan — 00003: Corrección de mesa infinita, listado en modo juego y visibilidad de componentes en modo edición

## (a) Anotaciones funcionales

**Fuera de alcance** (fix acotado, no se toca nada más):
- Posicionamiento libre/arrastre de componentes sobre la mesa (sigue fuera de alcance, como en 00002).
- Cualquier rediseño visual adicional del panel lateral de edición o de los estilos generales más allá de lo estrictamente necesario para corregir el dimensionado de la mesa.
- Borrado de un componente haciendo click sobre su representación en la mesa (el borrado sigue siendo solo desde el listado lateral, como hoy).

**Preguntas ya resueltas con el usuario** (recogidas en `description.md`):
- Eliminar el listado de modo juego pese a que 00002 decía "sin cambios de comportamiento" → confirmado, se elimina.
- Mostrar el cuadro de texto también en modo edición pese a la decisión explícita de 00002 de solo mostrarlo en juego → confirmado: en modo edición se ve la mesa entera con todos sus componentes, para poder seleccionarlos y editarlos directamente ahí.

## (b) Solución técnica

1. **Causa raíz del bug de dimensionado (`src/styles/main.css`)**: `#content` hoy solo tiene `min-height: calc(100vh - 3.5rem)`, sin una altura definida. Como resultado, cuando `playMode.js`/`editMode.js` ponen `layout.style.height = '100%'`, ese porcentaje no tiene una altura de referencia contra la que resolverse (el spec CSS trata `height:100%` de un hijo como `auto` cuando el padre no tiene altura explícita), así que `layout` colapsa a la altura de su contenido, y en cascada `tableContainer` (`flex:1`), `.infinite-table` y `.infinite-table__world` (todos `height:100%`) también colapsan — de ahí que la mesa solo ocupe "una pequeña fracción" (la altura mínima que ocupan sus hijos posicionados, ya que el `text-box` está en `position:absolute` y no aporta altura al flujo).
   - Reestructurar el layout de `body` como flex-column con altura de viewport fija, para que cada bloque tenga una altura definida en cascada:
     - `body`: `display:flex; flex-direction:column; height:100vh; margin:0;` (ya tiene `margin:0`).
     - `h1` y `.edit-toolbar`: pasan de `position:fixed` a formar parte normal del flujo (`position:static`, sin `top`/`left`/`right`), con `flex-shrink:0` para no encogerse.
     - `#content`: `flex:1 1 auto; min-height:0;` (el `min-height:0` es necesario para que un hijo flex con contenido interno grande no fuerce el crecimiento del contenedor más allá del espacio disponible). Esto le da a `#content` una altura *definida* (la calcula el propio flex layout), resolviendo el problema de raíz para todo el árbol de `height:100%` que cuelga de él.
   - Este cambio también corrige de paso el solape que hoy existe entre `.edit-toolbar` (fija en `top:3.5rem`) y el `#content` (que empieza en `margin-top:3.5rem`, sin dejar hueco para la barra) — al pasar todo a flujo normal, cada bloque ocupa su espacio real sin solaparse.
   - `#mode-switcher` se mantiene con `position:fixed` (no forma parte del flujo del layout de la mesa, es un botón flotante sobre la esquina superior).

2. **Quitar el listado de modo juego (`src/modes/play/playMode.js`)**: eliminar el bloque del `panel`/`listContainer`/`renderComponentList` y su importación; el `layout` deja de necesitar `display:flex` con dos columnas — la mesa (`tableContainer`) pasa a ocupar el 100% del ancho de `#content` directamente (ya no hace falta el contenedor `layout` en este fichero, se puede montar `createInfiniteTable` directamente sobre `container`).

3. **Extraer el renderizado de componentes sobre la mesa a un módulo compartido (`src/ui/componentRenderer.js`, nuevo)**: la lógica que hoy vive solo en `playMode.js` (recorrer `getComponents()`, filtrar `type === 'cuadro-texto'`, crear el `div.text-box` con sus estilos) se mueve a una función `renderComponentsOnTable(worldEl, components, { onSelect } = {})`, reutilizable por ambos modos. Si se pasa `onSelect`, añade un listener `click` a cada elemento renderizado que invoca `onSelect(component)` (usado por modo edición para abrir el modal); si no se pasa (modo juego), el elemento no es interactivo. Este módulo sí conoce el modelo de componente (a diferencia de `ui/table.js`, que sigue siendo agnóstico), por eso es un módulo distinto.
   - `playMode.js` pasa a llamar `renderComponentsOnTable(table.worldEl, getComponents())` (sin `onSelect`).
   - `editMode.js` pasa a llamar `renderComponentsOnTable(table.worldEl, getComponents(), { onSelect: openEditModalFor })`, reutilizando la misma función `openEditModalFor(component)` que ya usa el botón "Editar" del listado lateral (se extrae esa lógica a una función local en `editMode.js` para no duplicarla entre el listener del listado y el de la mesa).
   - Se añade un estilo mínimo (`.text-box--selectable { cursor: pointer; }`) aplicado solo cuando hay `onSelect`, para dar affordance visual de que es clicable en modo edición.

4. **Modo edición sigue mostrando la mesa completa con todos los componentes (`src/modes/edit/editMode.js`)**: se mantiene el panel lateral con el listado editable (alta/edición/borrado) tal cual está hoy — el fix no pide quitarlo, solo añadir el renderizado directo sobre la mesa como vía adicional de edición. Al abrir el modal desde cualquiera de las dos vías (listado o click en la mesa) y aceptar cambios, el re-render (`components:changed` → `renderAll()`) ya vuelve a pintar tanto el listado como los componentes sobre la mesa, sin lógica adicional de sincronización.

Orden de implementación: 1 (CSS, corrige la causa raíz del dimensionado) → 3 (extraer `componentRenderer.js`) → 2 y 4 (adaptar ambos modos para usarlo).

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`, sección 3 (Modo juego vs modo edición) y sección 5 (Capa UI):
- Sustituir la mención de que `modes/play/playMode.js` incluye "un listado de solo lectura en el panel lateral" — ya no lo tiene; solo muestra la mesa con los componentes renderizados.
- Añadir que `modes/edit/editMode.js` ahora también renderiza los componentes directamente sobre la mesa (además del listado lateral), permitiendo abrir el modal de edición tanto desde el listado como haciendo click sobre la representación del componente en la mesa.
- Documentar el nuevo módulo `ui/componentRenderer.js` en la sección de capa UI: a diferencia de `ui/table.js` (agnóstico), este sí conoce el modelo de componente — reutilizado por ambos modos para pintar los componentes sobre la superficie de la mesa, con soporte opcional de selección por click.
