## (a) Anotaciones funcionales

**Fuera de alcance** (confirmado en `description.md`):
- Soporte táctil o drag&drop HTML5 — solo mousedown/mousemove/mouseup sobre `document`, igual que el resto del proyecto.
- Redimensionar columnas individuales de la tabla de componentes del panel.
- Aplicar el redimensionado a tipos de componente distintos de `cuadro-texto` (único tipo existente hoy).
- Persistir en `localStorage` la posición/ancho del panel (solo dura la sesión de edición).
- Reescalar `properties.tamañoFuente` al redimensionar una caja de texto — el redimensionado solo cambia el espacio ocupado.

**Dudas resueltas con el usuario** (ver `description.md` para el detalle completo): zona de arrastre = cabecera del panel; zona de resize = esquina inferior derecha (patrón estándar reutilizable); panel solo redimensiona ancho (290–600px o mitad de viewport), cajas de texto redimensionan ambos ejes (mín. 40×24px, sin máximo); posición/ancho del panel no persisten, tamaño de la caja de texto sí persiste en `state.components`; manejador de la caja de texto visible solo si está seleccionada; manejador del panel visible en ambos estados (colapsado/expandido).

## (b) Solución técnica

1. **Crear `src/ui/resizeHandle.js`** — utilidad genérica y reutilizable que encapsula el manejador de esquina, para no duplicar la lógica mousedown/mousemove/mouseup entre el panel y las cajas de texto (y cualquier futuro elemento redimensionable, tal como pide la ampliación de alcance).
   - Expone `attachResizeHandle(hostEl, { axis = 'both', getSize, clamp, onResize, onResizeEnd })`:
     - Crea y añade a `hostEl` un `div.resize-handle` (requiere que `hostEl` tenga `position: relative/absolute` — responsabilidad de quien lo use).
     - En `mousedown` (botón izquierdo, con `stopPropagation` para no disparar el drag-to-move ni el doble-click de edición): añade `resize-handle--active`, captura `startX/startY` y el tamaño inicial vía `getSize()`.
     - En `mousemove` sobre `document`: calcula el ancho/alto propuesto según `axis` (`'x'` ignora el delta vertical, `'y'` ignora el horizontal, `'both'` usa los dos), lo pasa por `clamp()` y llama a `onResize(size)` con el resultado (aplicación en vivo, visual).
     - En `mouseup`: quita los listeners y `resize-handle--active`, y llama una vez a `onResizeEnd(size)` con el último tamaño (para que el caller decida qué persistir, igual que `onMove` en `componentRenderer.js`).
   - No decide límites ni qué hacer con el resultado — cada caller pasa su propio `clamp`/`getSize`/callbacks, porque panel y caja de texto tienen reglas distintas (ancho vs. ambos ejes, límites distintos, persistencia distinta).

2. **Estilos del manejador en `src/styles/main.css`** (nuevo bloque BEM `.resize-handle`, sección "Patrones reutilizables" o junto a `.text-box`):
   - `.resize-handle`: `position: absolute; right: 0; bottom: 0; width/height` pequeños, `cursor: nwse-resize` (mismo aspecto/cursor en los dos usos, aunque el panel solo aplique el eje horizontal — es el mismo punto de arrastre visual pedido).
   - Grip visual con un pseudo-elemento (`::after`) usando gradientes diagonales, en gris neutro por defecto y `var(--accent-blue)` en `:hover`/`.resize-handle--active`, consistente con la sección 2 (tokens) y 6 (sin sombras/gradientes decorativos, esto es funcional) de `STYLE_BIBLE.md`.

3. **Modificar `src/core/component.js`**:
   - `createComponent({ ..., width = null, height = null } = {})` añade `width`/`height` al objeto devuelto (por defecto `null` = tamaño automático según contenido, comportamiento actual). `updateComponent` no necesita cambios (ya hace spread genérico de `changes`).

4. **Modificar `src/ui/componentRenderer.js`**:
   - Aplicar `component.width`/`component.height` como `textBox.style.width`/`height` solo si no son `null` (si son `null`, sin estilo inline, para mantener el auto-tamaño actual). Añadir `overflow: hidden` siempre (no afecta al caso auto, y recorta el contenido cuando el tamaño es explícito y menor que el contenido).
   - `textBox` pasa a `position: relative` (ya es `position: absolute` respecto al mundo, pero necesita ser contenedor de posicionamiento para el `resize-handle` hijo — ambos son compatibles, `position: absolute` ya establece ese contexto).
   - Nuevo parámetro `onResize` en `renderComponentsOnTable(worldEl, components, { onSelect, selectedId, onMove, onResize })`. Si se pasa `onResize` y `component.id === selectedId`, se llama a `attachResizeHandle(textBox, { axis: 'both', ... })`:
     - `getSize`: mide el tamaño actual renderizado (`textBox.getBoundingClientRect()`, dividido por el zoom de la mesa vía `getWorldZoom`) si `component.width/height` son `null` (para no dar un salto al primer redimensionado), o los valores ya explícitos si existen.
     - `clamp`: aplica mínimos `40` (ancho) y `24` (alto), sin máximo.
     - `onResize` (en vivo): aplica `textBox.style.width/height` directamente para feedback visual durante el arrastre.
     - `onResizeEnd`: llama a `onResize(component, width, height)` (el callback recibido por `renderComponentsOnTable`) una sola vez, igual que ya hace `onMove` al soltar.
   - El manejador solo se crea/añade cuando el componente está seleccionado (mismo criterio que la clase `text-box--selected`), para no saturar visualmente el tablero.

5. **Modificar `src/modes/edit/editMode.js`**:
   - En `renderTable()`, pasar `onResize: (component, width, height) => replaceComponent(component.id, updateComponent(component, { width, height }))` a `renderComponentsOnTable`, igual que ya hace `onMove`.

6. **Modificar `src/ui/componentList.js`** (drag-to-move + resize del panel):
   - **Mover el ancho fijo de `.component-panel` (300px) a `.component-panel-container`** en `main.css`, y que `.component-panel` pase a `width: 100%`. Así el ancho vive en `container` (el nodo persistente entre renders que ya recibe `renderComponentList`), no en el `panel` que se recrea en cada llamada — evita tener que elevar un nuevo estado a `editMode.js` solo para el ancho.
   - **Drag-to-move**: `header.addEventListener('mousedown', ...)` (ignorando clicks sobre `toggleButton`, comprobando `e.target`) que, igual que `table.js`, engancha `mousemove`/`mouseup` en `document`:
     - Al iniciar, lee la posición actual de `container` vía `getBoundingClientRect()` relativa a su ancestro posicionado (`tableContainer`), y la fija como `container.style.left/top` explícitos (sustituyendo el anclaje `top/right` por defecto de la clase).
     - En cada `mousemove`, calcula la nueva posición y la clampa entre `0` y `tableContainer.clientWidth/Height - container.offsetWidth/Height` (restringido al área visible de la mesa, que ocupa todo el viewport de contenido).
     - Añade una clase `grabbing` al `header` mientras se arrastra (cursor), igual que el patrón ya usado en `table.js`.
   - **Resize**: llama a `attachResizeHandle(panel, { axis: 'x', ... })` (o sobre `container`, indistinto ya que `panel` mide 100% de `container`):
     - `getSize`: ancho actual de `container` (`getBoundingClientRect().width`).
     - `clamp`: `Math.min(Math.max(width, 290), Math.min(600, window.innerWidth / 2))`, y además acota para que `container`'s borde derecho (`left + width`) no supere `tableContainer.clientWidth`.
     - `onResize`/`onResizeEnd`: aplican `container.style.width` directamente (no hay callback hacia `editMode.js`: el ancho no se persiste, solo vive en el propio nodo `container` mientras dure la sesión).

## Correcciones tras verificación en navegador

Detectadas y corregidas después de escribir este plan, verificando el cambio en un navegador real:

- **220px cortaba el botón "Eliminar"**: el `MIN_PANEL_WIDTH` acordado (220px) dejaba el botón "Eliminar" completamente fuera del área visible del panel (`overflow: hidden`). Se subió a **290px**, el punto real donde ambos botones ("Editar" y "Eliminar") caben — actualizado también en `description.md` y en la sección (b) de este plan.
- **Selección/colapso/posición del panel se perdían con cualquier cambio de componente**: `main.js` vuelve a invocar `renderEditMode()` por completo ante cualquier `components:changed` (incluido el propio redimensionado de una caja de texto), y `selectedComponentId`/`collapsed`/posición/ancho del panel vivían como `let` locales dentro de esa función — se perdían en cada remontado, no solo al recargar la página. Corregido subiendo ese estado a nivel de módulo en `editMode.js`.
- **No había forma de seleccionar una caja de texto haciendo click directamente sobre ella en la mesa**: el manejador de redimensionado solo se muestra si el componente está seleccionado, pero la única vía de selección era la fila del panel — clicar la caja en la mesa no la seleccionaba (el doble-click abre la modal, un click simple no hacía nada). Añadido `onToggleSelect` en `componentRenderer.js` (click simple = toggle de selección, reutilizando la misma función `toggleSelect` que ya usaba la fila del panel), para que el manejador de redimensionado sea alcanzable directamente desde la mesa.

## (c) Cambios de arquitectura

`ARCHITECTURE.md` necesita actualizarse tras implementar:

- **Sección 4 (modelo de datos de componente)**: añadir `width: number | null` y `height: number | null` al listado de campos del componente, con nota de que `createComponent()` los inicializa a `null` (tamaño automático según contenido) y que se fijan al redimensionar desde modo edición.
- **Sección 5 (capa UI)**:
  - Añadir una entrada para el nuevo módulo `ui/resizeHandle.js`: utilidad genérica que expone `attachResizeHandle(hostEl, { axis, getSize, clamp, onResize, onResizeEnd })`, reutilizada por `componentList.js` (panel) y `componentRenderer.js` (cajas de texto) como patrón estándar de redimensionado de la app.
  - Actualizar la descripción de `ui/componentRenderer.js`: ahora también acepta `onResize`, y cuando `onResize` está presente y el componente está seleccionado, añade un manejador de redimensionado (ambos ejes, persistido en `component.width/height`).
  - Actualizar la descripción de `ui/componentList.js`: el panel flotante ahora es arrastrable (agarrando la cabecera, restringido al área de la mesa) y redimensionable en ancho (manejador de esquina, 290–600px o mitad de viewport) — ambos solo de la sesión de edición en curso, no persistidos.
