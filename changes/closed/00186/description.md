- **Nombre**: El original no muestra el icono de copias cuando una copia está dentro de un mazo
- **Código**: 00186
- **Tipo**: fix
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

cuando una copia está metida en un mazo, la carta original no muestra el icono de que tiene copias. Cuando la copia sale del mazo, sí lo muestra.
La original debería mostrar siempre el icono y cantidad de copias, independientemente de dónde estén esas copias.

## Descripción completa

En modo edición, un elemento Original que tiene una o más Copias vinculadas muestra una píldora roja (esquina inferior izquierda) con el número de copias que tiene. Esa píldora debe verse siempre que el original tenga copias, sin importar dónde estén esas copias.

Actualmente, si una de las copias vinculadas está metida dentro de un mazo, deja de contar para ese número: la píldora del original desaparece por completo si esa era su única copia, o muestra un número más bajo del real si tiene varias copias y solo alguna está en un mazo. En cuanto esa copia se saca del mazo, la píldora vuelve a aparecer (o el número vuelve a subir) inmediatamente.

Comportamiento esperado: la píldora de "tiene copias" del original debe mostrar siempre el número total y correcto de copias vinculadas que existen en la partida, estén sueltas sobre la mesa o metidas dentro de cualquier mazo.

## Apuntes técnicos

- Tanto `src/modes/edit/editMode.js` (`renderTable`, ~línea 527-531) como `src/modes/play/playMode.js` (~línea 141) calculan `cartasEnMazo` (vía `getCartaIdsEnAlgunMazo`) y filtran esas cartas de la lista de componentes ANTES de pasársela a `renderComponentsOnTable` — para no dibujarlas sueltas sobre la mesa mientras están dentro de un mazo, lo cual es correcto.
- El problema es que `ui/componentRenderer.js` (dentro de `renderComponentsOnTable`, ~líneas 525-528) construye el mapa `copyCountByOriginalId` a partir de ese mismo parámetro `components` ya filtrado — por lo que una copia metida en un mazo nunca se cuenta, al no estar en la lista que llega a esa función.
- La solución debe separar ambos usos: qué componentes se dibujan sueltos sobre la mesa (sigue filtrado, sin cambios) vs. qué componentes se usan para calcular cuántas copias tiene cada original (debe ser la lista completa sin filtrar por mazo). Puede resolverse añadiendo un parámetro nuevo a `renderComponentsOnTable` para la lista completa (con fallback a `components` si no se pasa), o de otra forma que `ms-how` decida, pero sin alterar qué se dibuja suelto sobre la mesa.
- Ambos call sites (`editMode.js` y `playMode.js`) ya calculan `getComponents()` (lista completa) antes de filtrar por `cartasEnMazo` — está disponible ahí mismo para pasarla también.
