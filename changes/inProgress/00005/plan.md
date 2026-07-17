# Plan: lista de componentes en tabla flotante, colapsable, con selección y resaltado

## (a) Anotaciones funcionales

Fuera de alcance (no se toca):
- Persistencia de la selección de fila o del estado colapsado/expandido — son estado de sesión, en memoria únicamente, tal como se acordó en `description.md`.
- El comportamiento de pan/zoom de la mesa infinita (`ui/table.js`) — no se modifica.
- El modo juego (`modes/play/playMode.js`) — no usa este listado, no se ve afectado.
- Arreglar que hoy el modo edición se remonte por completo (perdiendo pan/zoom de la mesa) ante cualquier alta/edición/borrado — comportamiento preexistente no relacionado con este cambio.

Dudas ya resueltas con el usuario (ver `description.md` para detalle): columnas Id/Tipo/Acciones agrupando editar+eliminar; selección única con toggle; confirmación de borrado con `confirm()` nativo; panel anclado arriba-derecha con el botón de añadir dentro del propio panel.

Referencia visual usada (solo aspecto, no estructura): `design_panel-flotante-lista-componentes.html` (panel expandido/colapsado, tabla, fila seleccionada) y `design_resaltado-componente-en-mesa.html` (contorno discontinuo azul sobre el componente seleccionado en la mesa).

## (b) Solución técnica

1. **`src/ui/componentRenderer.js` — soportar resaltado y re-render idempotente**
   - Al inicio de `renderComponentsOnTable`, limpiar `worldEl.innerHTML = ''` antes de volver a dibujar, para poder invocar la función repetidamente (p.ej. al cambiar la selección) sin duplicar elementos.
   - Añadir un nuevo parámetro de opciones `selectedId` (por defecto `null`). Si `component.id === selectedId`, añadir la clase `text-box--selected` al elemento del componente, además de las clases ya existentes.
   - Se mantiene igual el resto: `onSelect` sigue enlazado a `dblclick` (fix 00004), sin relación con la selección de fila de la lista.

2. **`src/styles/main.css` — estilo de resaltado del componente seleccionado**
   - Añadir regla `.text-box--selected` con un contorno discontinuo en `var(--accent-blue)` y `outline-offset`, siguiendo el aspecto del mockup `design_resaltado-componente-en-mesa.html` (sin copiar su marcado, solo el aspecto).

3. **`src/ui/componentList.js` — reescribir como panel flotante colapsable**
   - Cambiar la firma a `renderComponentList(container, components, { onEdit, onRemove, onSelectRow, onAdd, selectedId = null, collapsed = false, onToggleCollapse } = {})`.
   - Estructura DOM: `container.innerHTML = ''` y construir un panel (`div.component-panel`) con:
     - **Cabecera** (`component-panel__header`): título "Componentes" + botón de colapsar/expandir (▾/▸) que invoca `onToggleCollapse` si se pasa.
     - **Cuerpo** (`component-panel__body`, con `max-height` + `overflow-y: auto` para el scroll vertical), omitido por completo si `collapsed` es `true`:
       - Si `components.length === 0`, el mensaje ya existente ("No hay componentes todavía.").
       - Si no, una `<table class="component-list">` con cabecera de columnas Id/Tipo/Acciones y una fila (`<tr class="component-list__row">`) por componente:
         - Celda Id: `component.id` como texto (el acortamiento visual, si hiciera falta por espacio, se resuelve con CSS `text-overflow: ellipsis`, no truncando el dato).
         - Celda Tipo: `component.type`.
         - Celda Acciones: botón "Editar" (si `onEdit`) y botón "Eliminar" (si `onRemove`), cada uno con `event.stopPropagation()` en su listener de `click` para no disparar también la selección de fila.
         - El botón "Eliminar" pide confirmación con `confirm('¿Eliminar el componente "<id>"?')` antes de invocar `onRemove(component)`; si se cancela, no hace nada.
         - La fila entera tiene un listener de `click` que invoca `onSelectRow(component)` si se pasa (los clics en los botones no llegan aquí gracias al `stopPropagation` anterior).
         - Si `component.id === selectedId`, añadir la clase `component-list__row--selected` a esa fila.
     - **Pie** (`component-panel__footer`), también omitido si `collapsed`: botón "+ Añadir componente" que invoca `onAdd` si se pasa (mismo texto/comportamiento que hoy).

4. **`src/modes/edit/editMode.js` — orquestar selección y colapso como estado local**
   - La selección de fila y el colapso del panel son interacciones puramente de UI que no pasan por `core/state.js` (no disparan `components:changed`), así que se gestionan con variables locales dentro de `renderEditMode`: `let selectedComponentId = null;` y `let collapsed = false;`.
   - Sustituir las llamadas actuales a `renderComponentsOnTable(...)` y `renderComponentList(...)` por dos funciones locales, `renderTable()` y `renderList()`, que reconstruyen respectivamente el contenido de la mesa y el panel usando el estado local vigente (`selectedComponentId`, `collapsed`) y `getComponents()` actual. Se llaman una vez al montar (estado inicial) y de nuevo cada vez que cambia `selectedComponentId` o `collapsed`.
   - `renderList()` pasa a `renderComponentList`: `onEdit: openEditModalFor`, `onRemove: (component) => removeComponent(component.id)` (el borrado ya emite `components:changed`, que dispara el remontado completo vía `main.js`; no hace falta gestionar aquí la limpieza de selección), `onAdd` con la misma modal de alta que ya existe, `selectedId: selectedComponentId`, `collapsed`, y `onSelectRow: (component) => { selectedComponentId = selectedComponentId === component.id ? null : component.id; renderList(); renderTable(); }`, y `onToggleCollapse: () => { collapsed = !collapsed; renderList(); }`.
   - `renderTable()` pasa a `renderComponentsOnTable`: `onSelect: openEditModalFor` (sin cambios) y `selectedId: selectedComponentId`.
   - Cambiar el layout: eliminar el panel lateral fijo (`flex` en el layout de dos columnas) y en su lugar montar el contenedor del panel (`listContainer`) como flotante, anclado arriba-derecha, como hermano de `table.el` dentro de `tableContainer` (no como hijo de la superficie de la mesa `table.el`/`.infinite-table`, para que los clics dentro del panel no hagan bubbling hacia el listener de `mousedown` que arrastra la cámara en `ui/table.js`). Para ello: dar a `tableContainer` `position: relative` (inline, igual que ya se hace con `flex`), y al `listContainer` la clase CSS `component-panel-container` (posicionamiento flotante).
   - El `layout` de flexbox pasa a contener solo `tableContainer` (que ya incluye la mesa y, flotando encima, el panel) — se retira `panel` como segunda columna del `layout`.

5. **`src/styles/main.css` — estilos del panel flotante**
   - Sustituir las reglas de `.edit-mode-panel` (panel lateral fijo, que deja de usarse) y `.component-list__item` (fila antigua en `<li>`) por reglas nuevas para la nueva estructura:
     - `.component-panel-container`: `position: absolute; top: 1rem; right: 1rem; z-index: 10;` (flota sobre la mesa).
     - `.component-panel`: contenedor visual (fondo `var(--bg-card)`, `border-radius`, sombra, ancho fijo razonable, `overflow: hidden` para que la cabecera/cuerpo/pie respeten el `border-radius`).
     - `.component-panel__header`: cabecera con fondo `var(--bg-toolbar)`/texto `var(--text-light)`, `display:flex; justify-content:space-between; align-items:center`, y el botón de colapsar sin fondo propio.
     - `.component-panel__body`: `max-height` acotada (p.ej. `320px`) y `overflow-y: auto` (scroll vertical).
     - `.component-list` (ahora `<table>`): `width:100%; border-collapse: collapse; font-size` acorde al resto de la UI; celdas con `padding`; celda Id con `max-width` + `text-overflow: ellipsis; white-space: nowrap; overflow: hidden` para IDs largos (son UUID).
     - `.component-list__row`: `cursor: pointer`, hover sutil.
     - `.component-list__row--selected`: fondo distinguible (tono de `var(--accent-blue)` en baja opacidad, o similar).
     - Los botones de la celda Acciones reutilizan el estilo ya existente de botón pequeño (el que hoy usa `.component-list__item button`), adaptado al nuevo selector de celda.
     - `.component-panel__footer`: separador superior y el botón "+ Añadir componente" ocupando el ancho del panel.

No se modifica `src/core/*`, `src/data/*` ni `src/modes/play/playMode.js`: el cambio queda contenido en la capa `ui` y en el módulo `modes/edit/editMode.js` que la orquesta.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:
- Sección 3 (párrafo del modo edición): actualizar la frase que describe `modes/edit/editMode.js` — ya no hay "panel lateral"; ahora es un panel flotante, colapsable, en formato tabla (Id/Tipo/Acciones), con selección de fila que resalta el componente en la mesa.
- Sección 5 (`ui/componentList.js`): actualizar su descripción para reflejar la nueva firma (`onSelectRow`, `onAdd`, `selectedId`, `collapsed`, `onToggleCollapse`) y que ahora renderiza el panel completo (cabecera colapsable, tabla con scroll, botón de añadir), no solo un `<ul>`.
- Sección 5 (`ui/componentRenderer.js`): mencionar el nuevo parámetro `selectedId` y el resaltado visual del componente seleccionado.
