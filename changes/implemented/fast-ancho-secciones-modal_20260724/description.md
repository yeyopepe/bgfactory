- **Nombre**: Ajuste de ancho de las secciones encuadradas en las modales
- **Código**: fast-ancho-secciones-modal_20260724
- **Tipo**: fast
- **Fecha**: 2026-07-24

## Prompt original del usuario

"Ajusta el ancho de las secciones para aprovechar más el ancho de la modal en la que están. Hay demasiado margen lateral entre la linea lateral de las secciones y el borde de la modal"

## Descripción completa

Las secciones encuadradas (`.modal__section`, patrón introducido en el cambio 00072: bloques "Borde"/"Fondo" del cuadro de texto de carta, y "Borde"/"Fondo"/"Forma" de "Tablero"/"Ficha") dejaban demasiado espacio en blanco entre el marco de la sección y el borde de la modal, en comparación con el resto de campos. Se ha reducido ese margen lateral para que las secciones aprovechen más el ancho disponible de la modal, sin tocar el resto de campos ni el resto de la maquetación.

## Cambios aplicados

- `src/styles/main.css`, regla `fieldset.modal__section`: el margen horizontal pasa de `0` a `-0.75rem` (se extiende hacia el borde de la modal, reduciendo a la mitad el hueco lateral respecto al resto de campos) y el padding interior pasa de `1rem` (uniforme) a `1rem 1.25rem` (horizontal algo mayor, para compensar visualmente el margen negativo y mantener los campos de dentro con una indentación similar a la de antes).
