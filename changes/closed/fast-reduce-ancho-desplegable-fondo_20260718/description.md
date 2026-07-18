- **Nombre**: Reduce el ancho del desplegable de tipo de fondo en la ventana de configuración del tablero
- **Código**: fast-reduce-ancho-desplegable-fondo_20260718
- **Tipo**: fast
- **Fecha**: 2026-07-18

## Prompt original del usuario

ajusta el desplegable de la ventana de configuración del tablero porque es demasido ancho. Reduce un poco su ancho para dejar más espacio al botón de configurar fondo

## Descripción completa

En la ventana de configuración de las propiedades del tablero, el desplegable para elegir el tipo de fondo ("Color y patrón" / "Imagen") ocupaba demasiado espacio horizontal junto al botón "Configurar fondo", dejando a este último muy poco sitio. Se ha reducido el ancho del desplegable para que el botón disponga de más espacio.

## Cambios aplicados

- `src/ui/componentModal.js`: en la fila `bgRow` (select de tipo de fondo + botón "Configurar fondo"), se fija `bgTypeSelect.style.flex = '0 1 auto'` y `bgTypeSelect.style.width = '9rem'` en lugar de dejar que el `select` ocupe el 100% del ancho disponible (regla `.modal__field select { width: 100% }` de `main.css`), de forma que el botón `configureBtn` recupera el espacio restante de la fila.
