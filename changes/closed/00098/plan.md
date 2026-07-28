## (a) Anotaciones funcionales

- Fuera de alcance: cualquier otro comportamiento de las tres ventanas (posición, colapso, ancho de columnas al redimensionar la columna en sí) no se toca — ya funciona correctamente porque no depende de los valores obsoletos identificados en la causa raíz.
- Sin dudas de alcance pendientes con el usuario: la causa raíz y el comportamiento esperado ya estaban acotados en `description.md` (Apuntes técnicos, fruto del análisis de `ms-internal-tech-analysis` hecho por `ms-fix`).

## (b) Solución técnica

Causa raíz confirmada en `src/modes/edit/editMode.js`: `renderEditMode()` destructura `getPanelState()`, `getResourcePanelState()` y `getDeckPanelState()` **una sola vez**, al montar, guardando el alto (`panelHeight`, `resourcePanelHeight`, `deckPanelHeight`) y el ancho de columnas (`panelColumnWidths`, `resourcePanelColumnWidths`) en variables `const`. Esos valores se pasan como `bodyHeight`/`columnWidths` a `renderList()`, `renderResourcePanel()` y `renderDeckPanel()` — funciones que se vuelven a invocar de forma aislada (sin pasar por `renderEditMode()` completo) desde varios sitios: `toggleSelect()` (selección de un objeto, el caso reportado) y los propios `onToggleCollapse` de cada panel. Cuando eso ocurre después de un redimensionado, `ui/componentList.js` / `ui/resourceList.js` / `ui/deckList.js` reconstruyen el cuerpo del panel (`container.innerHTML = ''` + nuevo `body`) con el alto/columnas **obsoletos** de esas `const`, en vez del valor ya persistido en `core/state.js` tras el redimensionado. El ancho del panel no se ve afectado porque se fija imperativamente sobre `container.style.width`, que no se destruye en ese re-render.

Tareas:

1. En `renderList()` (dentro de `renderEditMode`, `src/modes/edit/editMode.js`): sustituir `bodyHeight: panelHeight` y `columnWidths: panelColumnWidths` por lecturas frescas en el momento de la llamada — `bodyHeight: getPanelState().height` y `columnWidths: getPanelState().columnWidths` — en vez de los valores capturados una sola vez al montar.
2. En `renderResourcePanel()`: mismo cambio, sustituyendo `bodyHeight: resourcePanelHeight` y `columnWidths: resourcePanelColumnWidths` por `getResourcePanelState().height` / `getResourcePanelState().columnWidths` leídos en cada llamada.
3. En `renderDeckPanel()`: mismo cambio, sustituyendo `bodyHeight: deckPanelHeight` por `getDeckPanelState().height` leído en cada llamada (este panel no tiene `columnWidths`, según ya documenta `ARCHITECTURE.md`).
4. Eliminar de la destructuración inicial de `renderEditMode()` las variables que quedan sin uso tras los cambios anteriores (`panelHeight`, `panelColumnWidths`, `resourcePanelHeight`, `resourcePanelColumnWidths`, `deckPanelHeight`) — se mantienen `panelPosition`/`panelWidth`, `resourcePanelPosition`/`resourcePanelWidth`, `deckPanelPosition`/`deckPanelWidth` y los `collapsed` de cada panel, que sí siguen usándose tal cual (no tienen el mismo problema: la posición y el ancho del contenedor no se destruyen en estos re-renders parciales, y el colapso ya se gestiona con variables `let` correctamente actualizadas).

Con esto, cualquier re-render parcial (selección de objeto, colapso de cualquiera de los tres paneles) siempre refleja el tamaño/columnas realmente persistidos en `core/state.js`, sin depender de si hubo o no un montaje completo de por medio.

No aplica (c) Cambios de arquitectura ni (d) Cambios en estilo: `design/docs/ARCHITECTURE.md` ya describe el comportamiento esperado (tamaño persistido en `panelState`/`resourcePanelState`/`deckPanelState` para sobrevivir a re-renders); este fix corrige una implementación que no cumplía aún ese comportamiento documentado, sin cambiar la arquitectura ni el estilo visual.
