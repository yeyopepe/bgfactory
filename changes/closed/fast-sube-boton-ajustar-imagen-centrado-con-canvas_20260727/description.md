- **Nombre**: Sube el botón "Ajustar imagen…" del editor de cartas para centrarlo con el lienzo
- **Código**: fast-sube-boton-ajustar-imagen-centrado-con-canvas_20260727
- **Tipo**: fast
- **Fecha**: 2026-07-27

## Prompt original del usuario

sube el botón de ajustar imagen más arriba, que quede centrado

## Descripción completa

En el editor de cartas, el botón "Ajustar imagen…" (situado entre la cara frontal y la cara trasera) se mostraba centrado verticalmente respecto a toda la columna de cada cara — es decir, contando también la fila "Borde" (Color/Grosor) y el botón "+ Texto" que quedan debajo del lienzo. Eso lo dejaba visualmente más abajo del centro real de las dos cartas. Ahora se sube y queda centrado verticalmente respecto al lienzo de la carta (la parte que realmente se ve como "cara" frontal/trasera), en vez de respecto al bloque completo de controles.

## Cambios aplicados

- **`src/styles/main.css`**, regla `.card-editor-modal__adjust-image`: sustituido `align-self: center;` (centraba el botón en toda la altura de la fila flex, incluida la fila de Borde y "+ Texto") por `align-self: flex-start; margin-top: 8.75rem;` — desplazamiento fijo calculado para que el centro vertical del botón coincida con el centro vertical del lienzo (etiqueta "Cara frontal/trasera" + lienzo de 260px de alto, el caso más común entre las proporciones de carta disponibles).
- Verificado en navegador (Playwright) midiendo `getBoundingClientRect()`: centro del botón a 402px, centro del lienzo a 403px (proporción por defecto `5:7`); comprobado visualmente también en `circular` (mismo alto de lienzo, 260px) y en `7:5` (lienzo más bajo, ~186px), donde el botón queda ligeramente por debajo del centro exacto pero claramente más arriba que antes y dentro de la zona del lienzo.
