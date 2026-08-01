## (a) Anotaciones funcionales

- Fuera de alcance: cualquier otro comportamiento del cambio 00108 (Ctrl+clic, borrado en bloque, resize gating) no se toca — el fix se limita al feedback visual durante el arrastre en bloque.

## (b) Solución técnica

**Causa raíz**: en `src/ui/componentRenderer.js`, `onMove(component, x, y)` solo se invoca una vez, al soltar el ratón (`handleMouseUp`), y en `modes/edit/editMode.js` es ese único callback el que aplica el delta al resto de componentes seleccionados (vía `replaceComponent`, que dispara un remontado completo de `editMode`). Durante el propio arrastre (`handleMouseMove`), cada una de las cinco ramas por tipo de `renderComponentsOnTable` solo actualiza el `style.left`/`style.top` de su propio elemento DOM — el resto de elementos seleccionados no tenían ningún código que los moviera en vivo, de ahí que solo se vieran actualizados de golpe al soltar (cuando se re-renderiza toda la mesa con las posiciones finales).

**Corrección**, íntegra en `src/ui/componentRenderer.js` (sin tocar `editMode.js`, cuya lógica de aplicar el delta a todos los seleccionados al soltar ya es correcta y se mantiene tal cual):

1. Añadir, en el cuerpo de `renderComponentsOnTable` (antes del bucle que dibuja cada componente), un registro `elementsById` (`Map<string, HTMLElement>`) que se va rellenando con el elemento DOM de cada componente a medida que se crea, en las cinco ramas por tipo.
2. Añadir una función local `getBlockDragTargets(component)`: si la selección no tiene más de un elemento o no incluye a `component`, devuelve `[]`; si no, devuelve, para cada otro id de `selectedIds`, `{ el, startX, startY }` (su elemento DOM vía `elementsById` y su posición `x`/`y` de partida, tomada de `components`).
3. En cada una de las cinco ramas de arrastre (texto, tablero, dado, documento, carta): en el `mousedown`, calcular `blockDragTargets = getBlockDragTargets(component)`; en el `mousemove`, además de mover el propio elemento arrastrado, calcular el delta (`dx`/`dy`) respecto a su posición de partida y aplicar ese mismo delta al `style.left`/`style.top` de cada elemento de `blockDragTargets`, para que se muevan en tiempo real junto con el elemento arrastrado.
4. Al soltar (`mouseup`), el flujo no cambia: se sigue invocando `onMove(component, x, y)` una única vez con la posición final del elemento arrastrado, y `editMode.js` sigue siendo quien persiste el delta en el resto de la selección (`replaceComponent`) — el remontado posterior de la mesa ya coincide con lo que se veía en vivo durante el arrastre, sin salto visual.

## (c) Cambios de arquitectura

Ninguno: `renderComponentsOnTable` no cambia su firma pública ni su contrato documentado en `ARCHITECTURE.md` (cambio 00108) — `elementsById`/`getBlockDragTargets` son detalle interno de la función, no un parámetro ni un comportamiento observable nuevo distinto del ya documentado ("arrastrar uno de varios elementos seleccionados los mueve a todos en bloque, manteniendo sus distancias relativas"), solo corrige cuándo se ve reflejado ese movimiento.
