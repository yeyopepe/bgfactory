- **Nombre**: Sanitiza espacios en blanco en el ID del componente
- **Código**: fast-sanitiza-espacios-id-componente_20260718
- **Tipo**: fast
- **Fecha**: 2026-07-18

## Prompt original del usuario

ms-fast los identificadores de los elementos no pueden tener espacios en blanco. si el usuario escribe un id con espacios en blanco en la ventana de configuración, sustituye los espacios por "_" automáticamente

## Descripción completa

En la ventana de configuración de un componente (pestaña "Generales"), si el usuario escribe un espacio en blanco dentro del campo "ID del componente", este se sustituye automáticamente por un guion bajo (`_`) mientras escribe, en vez de dejar el espacio en el identificador.

## Cambios aplicados

- `src/ui/componentModal.js`: en el listener `input` del campo `idInput`, antes de asignar el valor a `workingComponent.id`, se reemplaza cualquier secuencia de espacios en blanco (`/\s+/g`) por `_` y se actualiza `idInput.value` con el resultado, para que el usuario vea el cambio reflejado en el propio campo.
