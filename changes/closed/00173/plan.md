- **Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento de las tres tablas (orden, filtros, redimensionado de columna, selección de fila) se toca en este fix — solo que la cabecera quede fija al hacer scroll vertical dentro del cuerpo del panel.

**Dudas resueltas con el usuario:** ninguna — la petición es directa (cabecera siempre visible al hacer scroll) y no tiene ambigüedad de alcance.

## (b) Solución técnica

1. **`src/styles/main.css` — cabecera fija con `position: sticky`.** Las tres reglas `.component-list th`/`.resource-list th`/`.group-list th` ya tienen `background: var(--bg-subtle)` (opaco, necesario para que el contenido de las filas no se transparente al quedar debajo) y `position: relative`. Cambiar `position: relative` por `position: sticky; top: 0;` en las tres — `position: sticky` sigue siendo un elemento posicionado (seguirá funcionando como contenedor de referencia para `.column-resize-handle`, que hoy depende de que su `<th>` padre tenga `position` distinto de `static`, sin ningún cambio necesario ahí). El contenedor de scroll (`.component-panel__body`/`.resource-panel__body`/`.group-panel__body`, `overflow-y: auto`) ya envuelve directamente la tabla, así que `top: 0` sitúa la cabecera pegada arriba del propio cuerpo con scroll — no de todo el panel — sin tocar la barra de filtro ni el pie, que quedan fuera de esa zona de scroll.
2. **`z-index` local para quedar por encima de las filas.** Añadir `z-index: 2` a las mismas tres reglas, para que la cabecera fija quede siempre por encima de las filas que pasan por debajo al hacer scroll (las filas no tienen `z-index` propio, así que basta cualquier valor positivo). Es un `z-index` interno a la tabla, sin relación con los niveles fijos de la sección 10 de STYLE_BIBLE (paneles, modal, menús `position: fixed`).
3. **Verificar visualmente en las tres ventanas** con listas más largas que el alto del panel (Componentes, Recursos, Grupos) que la cabecera queda fija, que el menú de ordenar/filtrar (`ui/columnHeaderMenu.js`) se sigue anclando en el sitio correcto tras hacer scroll (usa `getBoundingClientRect()` del propio `<th>` en el momento del click, así que ya refleja su posición "pegada" sin cambios de código), y que el redimensionado de columna (`.column-resize-handle`) se sigue viendo y arrastrando con normalidad.

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`, añadir una entrada nueva (primer uso de `position: sticky` en el proyecto) documentando el patrón: cabecera de tabla fija (`position: sticky; top: 0; z-index: 2`) dentro de un contenedor con `overflow-y: auto`, condicionado a que la propia cabecera tenga un fondo opaco (ya lo tenían las tres, `var(--bg-subtle)`) para no dejar ver el contenido que pasa por debajo. Referenciar los tres usos (`.component-list th`/`.resource-list th`/`.group-list th`) como aplicación del mismo patrón, para que cualquier tabla con scroll interno futura lo reutilice en vez de crear uno ad-hoc.
