- **Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento del menú de ordenar/filtrar por columna (cambio 00165) se toca en este fix — solo la pista visual permanente de las cabeceras interactivas y que la cabecera de la tabla se siga mostrando cuando el filtrado deja la lista vacía. No se cambia el mensaje de "sin resultados" en sí, ni la lógica de qué cuenta como coincidencia.

**Dudas resueltas con el usuario:** ninguna pregunta abierta — la maqueta (`design_pista-visual-cabecera-columna.html`) y la descripción del fix quedaron validadas por el usuario sin cambios.

## (b) Solución técnica

1. **`ui/tableColumnMenu.js` — indicador permanente (bug 1).** En `attachColumnMenu`, la variable `isActive` se sigue calculando igual (`sortState?.column === key || filterState?.[key] != null`), pero deja de decidir si se inserta el indicador (`if (isActive) th.appendChild(buildIndicator())`) y pasa a decidir solo su aspecto: `buildIndicator(active)` se llama siempre, para cualquier columna de `columnDefs` (todas son interactivas por definición — las que no lo son, como "Acciones", ni siquiera están en `columnDefs` y no reciben llamada), añadiendo el modificador `column-header-menu__indicator--active` solo cuando `active` es `true`. El SVG y el resto de la función no cambian.
2. **`src/styles/main.css` — color por defecto vs activo (bug 1).** `.column-header-menu__indicator` pasa de `color: var(--accent-blue)` a `color: var(--text-muted)` (estado por defecto, "disponible pero no activo"). Se añade `.column-header-menu__indicator--active { color: var(--accent-blue); }` para el estado activo — mismo criterio de modificador que ya usa `.column-header-menu__item--active`.
3. **`ui/componentList.js`, `ui/resourceList.js`, `ui/groupList.js` — cabecera siempre visible (bug 2).** Las tres funciones `renderBody` construyen hoy la `<table>` (con su `<thead>`) después de un `if (lista.length === 0) { ...; return; }` que corta antes de llegar a construirla. Hay que invertir el orden en las tres, de forma idéntica:
   - Construir siempre `<table>` + `<thead>` (con las cabeceras, el redimensionado de columna y el menú de ordenar/filtrar ya cableados — así el bug 1 y este quedan resueltos a la vez para cualquier estado de la tabla).
   - Construir siempre `<tbody>`: si la lista está vacía, añadir una única fila con una celda `colspan` igual al número de columnas (`COMPONENT_LIST_COLUMNS.length`/`RESOURCE_LIST_COLUMNS.length`/`GROUP_LIST_COLUMNS.length`) con el mismo texto y la misma clase (`*__empty`/`*__empty-filter`, según `hasActiveFilter`) que hoy lleva el `<p>` que se elimina; si no, construir las filas de datos como hasta ahora.
   - El `return` anticipado desaparece: el flujo llega siempre hasta el final de la función, donde ya están las llamadas a `attachColumnResizing`/`attachColumnMenu` (sin cambios en ellas).

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`, en la entrada ya existente sobre `.column-header-menu__indicator` (añadida al documentar el cambio 00165, dentro de la sección 12.7), anotar la corrección de este fix: el indicador se muestra siempre en cualquier cabecera interactiva (antes solo aparecía si había algo activo), con dos estados — `var(--text-muted)` por defecto y `var(--accent-blue)` (modificador `--active`) cuando la columna tiene un orden y/o un filtro aplicados — en vez de aparecer/desaparecer del todo.
