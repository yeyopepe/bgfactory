- **Nombre**: Bajar el tamaño mínimo de redimensión de "Carta"
- **Código**: fast-minimo-redimension-cartas_20260803
- **Tipo**: fast
- **Fecha**: 2026-08-03

## Prompt original del usuario

las cartas deberían poder redimensionarse hasta un mínimo de 5px de lado

## Descripción completa

El componente "Carta" no podía redimensionarse por debajo de 60px de ancho/alto al arrastrar su tirador de esquina. Se pedía bajar ese mínimo a 5px de lado. Ahora, al redimensionar una carta desde el editor, se puede reducir hasta 5px de ancho y 5px de alto (respetando igual que antes la proporción configurada del tipo de carta).

## Cambios aplicados

- `src/ui/componentRenderer.js`: constantes `MIN_CARTA_WIDTH` y `MIN_CARTA_HEIGHT` cambiadas de `60` a `5`. Estas constantes las usa el `clamp` pasado a `attachResizeHandle` en el bloque de renderizado del tipo `'carta'` (línea ~1250) para acotar el tamaño mínimo durante el arrastre del tirador de resize.
