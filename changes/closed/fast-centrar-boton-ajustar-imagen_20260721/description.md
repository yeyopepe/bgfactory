- **Nombre**: Centrar el botón "Ajustar imagen…" del editor de cartas
- **Código**: fast-centrar-boton-ajustar-imagen_20260721
- **Tipo**: fast
- **Fecha**: 2026-07-21

## Prompt original del usuario

"el botón de ajustas imagen colócalo en el centro"

## Descripción completa

El botón único "Ajustar imagen…" del editor de cartas (debajo de las dos columnas de caras) aparecía alineado a la izquierda. Ahora se muestra centrado horizontalmente bajo las dos caras.

## Cambios aplicados

- `src/styles/main.css`: nueva regla `.card-editor-modal__adjust-image { display: block; margin: 0 auto; }`, aplicada a la clase que ya llevaba el botón (`src/ui/cardEditorModal.js`, sin cambios en este fichero).
