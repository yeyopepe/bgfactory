- **Nombre**: Separar hacia abajo el botón "Ajustar imagen…" del editor de cartas
- **Código**: fast-separar-boton-ajustar-imagen_20260721
- **Tipo**: fast
- **Fecha**: 2026-07-21

## Prompt original del usuario

"Sepáralo un poco hacia abajo"

## Descripción completa

El botón único "Ajustar imagen…" del editor de cartas, ya centrado (ver `fast-centrar-boton-ajustar-imagen_20260721`), quedaba pegado justo debajo de las dos caras. Ahora tiene un pequeño margen superior que lo separa de ellas.

## Cambios aplicados

- `src/styles/main.css`: en `.card-editor-modal__adjust-image`, `margin` pasa de `0 auto` a `1rem auto 0` (añade separación superior, mantiene el centrado horizontal).
