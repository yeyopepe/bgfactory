- **Nombre**: Cabecera de columna fija al hacer scroll
- **Código**: 00173
- **Tipo**: fix
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

Ahora bien, pero hay otro fix: las cabeceras de esas ventanas siempre deben estar visibles aunque nos movamos arriba y abajo en la lista.

## Descripción completa

En los tres paneles flotantes de modo edición (Componentes, Recursos, Grupos), el cuerpo de cada tabla tiene scroll vertical propio cuando hay más filas de las que caben en el alto disponible del panel. Al hacer scroll hacia abajo dentro de una lista larga, la cabecera de columna se desplaza junto con las filas y sale de la vista, en vez de quedarse fija en la parte superior.

Como consecuencia, tras bajar el scroll ya no se puede saber a qué corresponde cada columna, ni pulsar su cabecera para abrir el menú de ordenar/filtrar sin volver a subir el scroll hasta arriba primero.

Comportamiento esperado: la cabecera de columna debe permanecer siempre visible, fija en la parte superior del cuerpo de la tabla, mientras se hace scroll por las filas — en las tres ventanas (Componentes, Recursos, Grupos) por igual.

## Apuntes técnicos

- Contenedores con scroll: `.component-panel__body`/`.resource-panel__body`/`.group-panel__body` (`src/styles/main.css`), todos con `overflow-y: auto`. La tabla (`<table>`) y su `<thead>` viven dentro de ese contenedor, sin ningún posicionamiento especial hoy.
- No se usa `position: sticky` en ningún sitio de `src/styles/main.css` todavía — sería un patrón visual/de interacción nuevo para el proyecto, no la reutilización de uno ya existente, así que conviene documentarlo en `STYLE_BIBLE.md` al implementarlo.
- Los `<th>` de estas tres tablas ya llevan estilos propios (`.component-list th`/`.resource-list th`/`.group-list th`, fondo `var(--bg-subtle)`) y, desde el cambio 00165, algunos son interactivos (`.column-header--interactive`, con el menú de `ui/columnHeaderMenu.js` anclado mediante `getBoundingClientRect()` del propio `<th>`) — cualquier solución con `position: sticky` debe conservar ese anclaje correcto (la posición del `<th>` que devuelve `getBoundingClientRect()` cuando está "pegado" arriba sigue siendo válida para el `position: fixed` del menú, sin cambios necesarios ahí).
