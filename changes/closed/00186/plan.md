- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. La lista de componentes que se dibujan sueltos sobre la mesa (filtrada, sin las cartas metidas en un mazo) no cambia en ningún modo.

**Dudas resueltas con el usuario:** ninguna pregunta abierta — el propio `description.md` ya trae la causa raíz identificada y la vía de solución sugerida, confirmadas al analizar el código real.

## (b) Solución técnica

1. **`src/ui/componentRenderer.js` — separar la lista para "qué se dibuja" de la lista para "contar copias".** En `renderComponentsOnTable` (línea 514), añadir un nuevo parámetro opcional `allComponents` a la firma de opciones, con fallback al propio `components` si no se pasa: `allComponents = components`. En la construcción de `copyCountByOriginalId` (líneas 525-528), iterar sobre `allComponents` en vez de sobre `components`. El resto de la función (orden de dibujo, `stackedComponents`, `elementsById`, `getBlockDragTargets`, etc.) sigue usando `components` sin cambios — solo el conteo de copias pasa a la lista completa.
2. **`src/modes/edit/editMode.js` — pasar la lista completa en `renderTable` (línea 527-533).** La función ya calcula `getComponents()` dos veces (línea 528 para `cartasEnMazo`, línea 529 para filtrar). Guardar esa lista completa en una variable (p.ej. `const allComponents = getComponents();`) y reutilizarla tanto para `getCartaIdsEnAlgunMazo` como para el filtrado, añadiendo `allComponents` al objeto de opciones pasado a `renderComponentsOnTable`.
3. **`src/modes/play/playMode.js` — pasar la lista completa en `renderTable` (línea 139-141).** Mismo patrón: `getComponents()` ya se calcula en la línea 140 para `cartasEnMazo`; extraerla a variable `allComponents` y reutilizarla en el filtro de la línea 141, añadiendo `allComponents` al objeto de opciones pasado a `renderComponentsOnTable`. Nota: en este modo el filtro también excluye `component.oculto` — esa exclusión sigue afectando solo a qué se dibuja suelto, no a `allComponents` (un original oculto no debería dejar de contar sus copias tampoco, y esto ya lo garantiza no tocar `allComponents`).

Ordenar la implementación en este mismo orden (primero el parámetro nuevo en `componentRenderer.js`, luego cada call site).

## (e) Verificación

1. En modo edición, crear un original con una copia vinculada suelta sobre la mesa: la píldora roja del original muestra "1". Meter esa copia dentro de un mazo: la píldora del original sigue mostrando "1" (antes desaparecía).
2. Con el original con dos copias vinculadas, una suelta y otra dentro de un mazo: la píldora del original muestra "2" (antes mostraba "1", solo contando la suelta).
3. Sacar la copia del mazo de vuelta a la mesa: la píldora sigue mostrando el mismo número correcto (sin duplicar ni perder el conteo).
4. Repetir la comprobación 1 en Modo Juego (no solo en modo edición): la píldora del original también se mantiene correcta ahí con la copia dentro de un mazo.
5. Confirmar que la copia metida en el mazo sigue sin dibujarse suelta sobre la mesa en ambos modos (el fix no debe hacer que reaparezca fuera del mazo).
