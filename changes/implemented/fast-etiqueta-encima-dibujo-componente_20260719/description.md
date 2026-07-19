- **Nombre**: Etiqueta de identificación siempre por encima del dibujo del componente
- **Código**: fast-etiqueta-encima-dibujo-componente_20260719
- **Tipo**: fast
- **Fecha**: 2026-07-19

## Prompt original del usuario

al menos asegúrate de que la etiqueta en modo edición aparece siempre encima. Ahora mismo, cuando añado un dado, el dibujo del dado queda por encima y no se puede leer

## Descripción completa

La etiqueta de identificación de componente en modo edición (cambio 00032, ajustada en 00035) quedaba tapada por el propio dibujo del componente en el caso del "dado": su silueta (SVG) y el resultado se pintaban por encima de la etiqueta, dejándola ilegible. Ahora la etiqueta se dibuja siempre por encima del contenido del componente, en los tres tipos.

## Cambios aplicados

- `src/styles/main.css`: añadido `z-index: 1` a la regla `.component-id-label`, para que se pinte por encima de los demás elementos internos del componente (que no tienen `z-index` explícito), sin tocar su posición ni el resto de propiedades.
