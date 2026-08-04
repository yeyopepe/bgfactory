## (a) Anotaciones funcionales

- **Fuera de alcance**: `src/core/styleClipboard.js` (`cloneFace`) no clona `formas` en profundidad (solo `textBoxes`) — es un comportamiento preexistente sin relación con este cambio, no se toca.
- **Fuera de alcance**: no se añade ninguna acción de "Duplicar" al nuevo menú contextual — el enunciado solo pide Eliminar/Colocar arriba/Colocar abajo; duplicar sigue disponible solo desde la modal de edición (doble click), como hoy.
- **Decisión técnica tomada sin re-preguntar al usuario** (coherente con lo ya acordado en `description.md`, no es una duda de alcance nueva): los elementos que se crean desde "Añadir elemento" (imagen aparte) y los que se duplican desde la modal de edición se colocan automáticamente por encima de todos los demás de su cara — mismo criterio intuitivo que ya usa el proyecto para componentes nuevos en la mesa (`addComponent` los pone en `order = 1`, el más arriba).
- Dudas de alcance funcional: ninguna adicional a las ya resueltas en `description.md` (orden global mezclado entre texto y figuras, imagen de fondo siempre al fondo, sin confirmación al eliminar, no-op si ya está en el extremo).

## (b) Solución técnica

1. **Nuevo módulo puro `src/core/cardFaceElements.js`** (mismo patrón sin dependencias de otras capas que `core/cardProportions.js`/`core/textBoxLayout.js`), único punto que sabe combinar `cara.formas`+`cara.textBoxes` en un solo orden de apilado. Expone:
   - `getOrderedFaceElements(cara)` → array de `{ kind: 'forma' | 'texto', element }` ordenado de fondo a frente (el último del array es el que se pinta el último, y por tanto queda más arriba visualmente). Cada elemento usa su campo `orden` (number, menor = más adelante, mismo criterio que ya usa el `order` de componente en `core/state.js`) si lo tiene; si no (carta guardada antes de este cambio, campo `orden` inexistente), calcula un valor de fallback **sin mutar los datos ni migrar nada**, replicando exactamente el criterio visual actual: todas las `formas` quedan por detrás de todos los `textBoxes`, y dentro de cada array se respeta su orden de inserción (el último añadido, más arriba). Esto reproduce en el primer render el aspecto exacto que ya tenía cualquier carta existente, sin ningún paso de migración.
   - `bringElementToFront(cara, kind, id)` → recalcula el `orden` efectivo (real o de fallback) de todos los demás elementos de esa cara y fija `element.orden` por debajo del mínimo de ellos (deja al elemento seleccionado como el más adelante de todos). Si el elemento ya era el más adelante, el resultado es indistinguible visualmente (no hace falta detectar el caso aparte).
   - `sendElementToBack(cara, kind, id)` → mismo cálculo pero fijando `element.orden` por encima del máximo del resto (el más atrás de todos los elementos de la cara, siempre por delante de la imagen de fondo, que ni siquiera participa de este cálculo: se sigue pintando aparte, antes que cualquier elemento de esta lista, en los dos puntos de render).
   - Función interna compartida por las tres anteriores para no duplicar el cálculo del `orden` efectivo (real `??` fallback) de la lista combinada.

2. **`src/ui/cardEditorModal.js`**:
   - `renderFace` (líneas ~398-404): sustituir los dos bucles separados (`for (shape of cara.formas)` / `for (textBox of cara.textBoxes)`) por un único bucle sobre `getOrderedFaceElements(cara)`, llamando a `renderShape`/`renderTextBox` según `kind`.
   - `onAddTextBox`/`onAddShape` (líneas ~424-455): tras el `push` del elemento nuevo, llamar a `bringElementToFront(cara, kind, nuevoId)` antes de `renderFaces()`.
   - `onDuplicate` de `renderTextBox`/`renderShape` (líneas ~562-571 y ~660-669): tras el `push` del duplicado, llamar igualmente a `bringElementToFront`.
   - `onDelete` de ambos (líneas ~557-561 y ~655-659): añadir `selected = null` tras filtrar el array (el elemento seleccionado ya no existe).
   - En `renderTextBox` y `renderShape`: añadir un listener `contextmenu` sobre `el` que:
     - `e.preventDefault(); e.stopPropagation();`
     - selecciona el elemento (`selectTextBox`/`selectShape`, mismo criterio que el click izquierdo),
     - abre `openContextMenu` (importado de `./contextMenu.js`) con `x: e.clientX, y: e.clientY` y `generalItems`: "Eliminar" (icono papelera), "Colocar arriba" (icono flecha arriba), "Colocar abajo" (icono flecha abajo) — mismos iconos inline SVG que ya usa el mockup de `design_menu-contextual-elemento.html`, definidos como funciones locales al fichero (mismo patrón que `createLockIcon`/`createShuffleIcon` en `modes/play/playMode.js`, sin módulo de iconos compartido en el proyecto).
       - "Eliminar" → misma lógica que el `onDelete` ya existente (filtrar del array + `selected = null`) + `renderFaces()`.
       - "Colocar arriba" → `bringElementToFront(cara, kind, id)` + `renderFaces()`.
       - "Colocar abajo" → `sendElementToBack(cara, kind, id)` + `renderFaces()`.
     - Sin `description`, `specificItems` ni `interactionItems` (no aplican aquí) y sin `onClose` (la selección se mantiene igual que tras un click izquierdo normal, no se fuerza deselección al cerrar el menú).

3. **`src/ui/componentRenderer.js`** (`paintCartaFace`, líneas ~287-330 aprox.):
   - Extraer el cuerpo de los dos bucles actuales (pintado de una `forma` y de un `textBox`) a dos funciones internas del módulo (`paintShape(contentParent, shape, renderScale)` / `paintTextBox(contentParent, textBox, renderScale)`), sin cambiar su contenido.
   - Sustituir los dos bucles por un único bucle sobre `getOrderedFaceElements(cara)` (importado de `core/cardFaceElements.js`) llamando a la función correspondiente según `kind`. Esto cubre a la vez el pintado en la mesa y la miniatura de `ui/mazoContentModal.js`, que reutiliza `paintCartaFace` tal cual.

4. **Orden de implementación**: paso 1 (módulo puro) primero, por ser la base sin dependencias; paso 3 (`componentRenderer.js`) antes que el paso 2 en la parte de reutilización de `getOrderedFaceElements`, ya que así el render de mesa/miniatura queda ya migrado al nuevo criterio de apilado antes de tocar el editor; el menú contextual (parte de paso 2) se añade al final, una vez el nuevo orden ya se pinta correctamente en ambos sitios.

## (c) Cambios de arquitectura

`design/docs/ARCHITECTURE.md`, sección "Tipos de componente implementados" → `'carta'`:

- Sustituir la frase actual "Orden de apilado dentro de una cara: imagen de fondo → formas → textBoxes (el texto siempre por delante)" por una descripción del nuevo criterio: la imagen de fondo sigue siempre en el extremo inferior; `formas` y `textBoxes` comparten un único orden de apilado por elemento (campo `orden` en cada uno, menor = más adelante, mismo criterio que `order` de componente en `core/state.js`), calculado con fallback (sin migración) para cartas guardadas antes de este cambio mediante `core/cardFaceElements.js` (`getOrderedFaceElements`/`bringElementToFront`/`sendElementToBack`), y editable por el usuario desde el editor de cartas con un menú contextual (click derecho) por elemento: Eliminar / Colocar arriba / Colocar abajo.
- Añadir el campo `orden` (number, opcional, sin valor por defecto — ausente en elementos migrados por fallback) a la definición de `Forma` y de `TextBox` en esa misma sección.
- Anotar que `ui/cardEditorModal.js` reutiliza `ui/contextMenu.js` (ya usado en `modes/play/playMode.js` para el menú contextual de componentes en la mesa) para el nuevo menú contextual de elementos de una cara.
