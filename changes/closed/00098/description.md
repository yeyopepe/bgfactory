- **Nombre**: Redimensionado de ventanas de modo edición se pierde al seleccionar un objeto
- **Código**: 00098
- **Tipo**: fix

## Prompt original del usuario

cuando el usuario redimensiona la ventana de componentes en el modo edición y luego selecciona cualquier objeto, la ventana de componentes vuelve a su tamaño inicial. Cuando las ventanas del modo edición (componentes, recursos, mazos) se redimensionan, deben que darse así

## Descripción completa

En el modo edición, las tres ventanas flotantes (Componentes, Recursos, Mazos) se pueden redimensionar arrastrando su borde. Ese nuevo tamaño se guarda y normalmente se mantiene aunque se recargue la página o se realicen otras acciones.

Sin embargo, hay un caso en el que el tamaño elegido se pierde: si justo después de redimensionar una de estas ventanas el usuario selecciona cualquier objeto — una fila del listado de esa ventana, o un componente dibujado sobre la mesa — la ventana vuelve a mostrarse con el tamaño (alto) que tenía antes de ese redimensionado, en vez de mantener el que se acaba de fijar.

Comportamiento esperado: una vez que el usuario redimensiona cualquiera de las tres ventanas del modo edición, ese tamaño debe permanecer estable ante cualquier interacción posterior que no sea un redimensionado explícito o una recarga de la página — en particular, seleccionar un objeto no debe revertir el tamaño recién elegido. Esto debe cumplirse por igual en las tres ventanas (Componentes, Recursos, Mazos), aunque el usuario solo lo haya detectado en la de Componentes.

## Apuntes técnicos

- Causa raíz localizada en `src/modes/edit/editMode.js`: `renderEditMode()` lee `getPanelState()`/`getResourcePanelState()`/`getDeckPanelState()` una sola vez al montar, guardando el alto de cada panel en variables `const` (`panelHeight`, `resourcePanelHeight`, `deckPanelHeight`).
- `toggleSelect()` (disparado al seleccionar una fila de cualquiera de los listados o un componente sobre la mesa) no vuelve a invocar `renderEditMode()` completo — solo `renderList()`/`renderTable()`, para preservar `selectedComponentId`. Pero `renderList()` sigue pasando esas `const` obsoletas como `bodyHeight` a `renderComponentList`/`renderResourceList`/`renderDeckList` (`ui/componentList.js`, `ui/resourceList.js`, `ui/deckList.js`), que hacen `container.innerHTML = ''` y reconstruyen el cuerpo del panel desde cero con ese alto obsoleto.
- El ancho no se ve afectado porque se fija imperativamente sobre el propio nodo contenedor (`container.style.width`), que no se destruye en ese re-render; solo el alto del cuerpo (`body.style.height`), fijado en un nodo hijo que sí se recrea, se pierde.
- Mismo patrón y mismo bug en los tres paneles (Componentes/Recursos/Mazos) — no es exclusivo de "Componentes", aunque el usuario solo lo haya reportado ahí.
- No hay incongruencia entre `design/docs/ARCHITECTURE.md` (sección 3) y el código: la documentación ya describe el comportamiento esperado (tamaño persistido en `panelState`/`resourcePanelState`/`deckPanelState` precisamente para sobrevivir a re-renders); es un bug de implementación puro, no una discrepancia documental que requiera actualizar el documento.
