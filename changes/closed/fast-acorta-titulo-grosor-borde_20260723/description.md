- **Nombre**: Acorta el título del campo de grosor del borde
- **Código**: fast-acorta-titulo-grosor-borde_20260723
- **Tipo**: fast
- **Fecha**: 2026-07-23

## Prompt original del usuario

ms-fast en las ventanas dónde se puede configurar el grosor del borde del elemento, el título es demasiado largo. Sustitúyelo por "Grosor"

## Descripción completa

En las ventanas de propiedades donde se configura el grosor del borde de un elemento (tablero y ficha), la etiqueta del campo era demasiado larga ("Grosor del borde (px)" y "Grosor del borde (px, 0 = sin borde)"). Se ha sustituido en ambos casos por el texto corto "Grosor".

## Cambios aplicados

- `src/ui/componentModal.js:431` — etiqueta del campo de grosor de borde del tablero: de `'Grosor del borde (px)'` a `'Grosor'`.
- `src/ui/componentModal.js:875` — etiqueta del campo de grosor de borde de la ficha: de `'Grosor del borde (px, 0 = sin borde)'` a `'Grosor'`.
