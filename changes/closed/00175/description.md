- **Nombre**: Cabeceras "Orden", "Copia" y "Usos" demasiado estrechas para el icono de filtro
- **Código**: 00175
- **Tipo**: fast
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

el ancho de las cabeceras orden, copia y usos deben ser un poco más anchos, para que quepa el icono del filtro

## Descripción completa

En las tablas de los paneles flotantes de modo edición, las cabeceras de columna que admiten ordenar/filtrar (cambio 00165) muestran siempre un pequeño icono junto al texto del nombre de columna. En tres columnas concretas — "Orden" y "Copia" (panel Componentes) y "Usos" (panel Recursos) — el ancho de la cabecera es demasiado justo para el texto corto más ese icono, por lo que el icono queda cortado o solapado con el texto.

Se ensancha un poco cada una de esas tres cabeceras, lo justo para que el icono quede siempre visible junto al texto sin solaparse ni cortarse, igual que ya ocurre en el resto de columnas. No cambia ningún otro comportamiento de las columnas (ordenación, filtrado, redimensionado manual, etc.), solo su ancho por defecto.

## Apuntes técnicos

- `src/styles/main.css`: cabeceras interactivas con indicador vía `.column-header-menu__indicator` (`ui/tableColumnMenu.js`). Ancho por defecto de columna gestionado por `table-layout: auto` (sin `columnWidths` persistidos) — solo se fuerza `table-layout: fixed` tras un redimensionado manual (`ui/tableColumnResize.js`), así que el fix es puramente CSS sobre el ancho mínimo de esas cabeceras.
- Columna "Orden": `th[data-col="orden"]` en `.component-list` (celda de cuerpo `.component-list__order-cell { width: 3.5rem; }`, línea ~253).
- Columna "Copia": `th[data-col="copia"]` en `.component-list` (sin clase de ancho propia en la celda de cuerpo).
- Columna "Usos": `th[data-col="usos"]` en `.resource-list` (celda de cuerpo `.resource-list__usos-cell`, sin ancho propio, línea ~2531).

## Cambios aplicados

`src/styles/main.css`:
- Tras la regla `.component-list th { ... }`, se añade `.component-list th[data-col="orden"], .component-list th[data-col="copia"] { min-width: 4.5rem; }`.
- Tras la regla `.resource-list th { ... }`, se añade `.resource-list th[data-col="usos"] { min-width: 4.5rem; }`.

Ninguna otra columna ni fichero se ha tocado.
