## (a) Anotaciones funcionales

Fuera de alcance (fix acotado a la causa raíz, sin ampliar):

- Selección/arrastre múltiple de componentes a la vez.
- Snapping a rejilla o guías de alineación.
- Historial/deshacer de movimientos.
- Cualquier tipo de componente futuro distinto de `'cuadro-texto'` (la solución añade `x`/`y` al modelo genérico, así que cualquier tipo futuro los hereda gratis, pero no se diseña nada específico para ellos aquí).

No ha habido dudas técnicas que resolver con el usuario: la causa raíz es clara por inspección directa del código (ver más abajo).

**Causa raíz:** `ui/componentRenderer.js` (línea 12-13) dibuja **todo** componente `'cuadro-texto'` en una posición fija hardcodeada (`top:100px; left:100px`), y el modelo de componente (`core/component.js`) no tiene ningún campo de posición. Por eso todo componente nuevo aparece exactamente encima de los demás, y al no haber ninguna interacción de arrastre implementada, es imposible separarlos visualmente ni operar con el que queda debajo.

## (b) Solución técnica

1. **`src/core/component.js`** — `createComponent()`: añadir `x` e `y` a la forma del componente devuelto (parámetros con defecto `x = 0, y = 0`), como posición en coordenadas del mundo de la mesa. `updateComponent()` no necesita cambios (el spread ya soporta actualizar `x`/`y` como cualquier otro campo).

2. **`src/modes/edit/editMode.js`** — `openAddModal()`: antes de llamar a `addComponent(newComponent)`, asignar una posición inicial que no se solape con los componentes ya existentes. Cálculo mínimo: offset en cascada de 30px por componente ya existente a partir de una base (100,100), con `% ` (módulo) sobre un rango razonable (p.ej. cada 10 componentes se reinicia el offset y se desplaza una fila) para que no se salga indefinidamente de la vista inicial. Ejemplo:
   ```js
   const n = getComponents().length;
   newComponent.x = 100 + (n % 10) * 30;
   newComponent.y = 100 + (n % 10) * 30;
   ```

3. **`src/ui/componentRenderer.js`** — `renderComponentsOnTable(worldEl, components, { onSelect, selectedId, onMove } = {})`:
   - Sustituir los valores fijos `textBox.style.top = '100px'` / `left = '100px'` por `component.y` / `component.x` (con fallback a `100` si son `undefined`, para componentes ya guardados en `localStorage` antes de este fix).
   - Añadir soporte de arrastre individual, activo solo si se recibe `onMove` (igual que `onSelect` ya gatea la selección — en modo juego no se pasa ninguno de los dos):
     - `mousedown` en el `textBox`: `e.stopPropagation()` (para que `ui/table.js` no interprete el gesto como pan de la mesa) y arrancar el seguimiento del arrastre (posición de partida del ratón y posición de partida del componente).
     - `mousemove` (en `document`, igual que hace `ui/table.js` para el pan): si hay arrastre activo, calcular el delta en píxeles de pantalla y dividirlo por el zoom actual de la mesa (leído de `getComputedStyle(worldEl).transform`, matriz `matrix(a, ...)` → `a` es el factor de escala) para obtener el delta en coordenadas del mundo; actualizar `textBox.style.left/top` en vivo.
     - `mouseup`: si había arrastre activo, terminarlo e invocar `onMove(component, finalX, finalY)` con la posición final ya en coordenadas del mundo.

4. **`src/modes/edit/editMode.js`** — `renderTable()`: pasar `onMove: (component, x, y) => replaceComponent(component.id, updateComponent(component, { x, y }))` a `renderComponentsOnTable` (usando `updateComponent` de `core/component.js`, ya importado el resto de helpers de `core/state.js`; añadir el import de `updateComponent` desde `core/component.js`). Esto persiste la nueva posición en el estado y dispara el re-render + autoguardado existentes vía `components:changed`, igual que ya ocurre al editar un componente desde la modal.

5. **`src/modes/play/playMode.js`** — sin cambios de código: al no pasar `onMove` (como ya no pasa `onSelect`), el modo juego sigue sin arrastre, solo lee las posiciones `x`/`y` ya persistidas.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:

- Sección 4 (modelo de datos de componente): añadir `x: number` e `y: number` (posición en el mundo de la mesa, en píxeles) al bloque de forma del modelo, con una nota de que `createComponent()` los inicializa a 0 por defecto y que el modo edición les asigna una posición inicial no solapada al crear el componente.
- Sección 5 (`ui/componentRenderer.js`): actualizar la firma documentada de `renderComponentsOnTable` para incluir el nuevo parámetro `onMove`, y añadir una frase explicando que cada componente es ahora arrastrable de forma individual en modo edición (posición persistida en `x`/`y` del propio componente), gateado igual que `onSelect`.
