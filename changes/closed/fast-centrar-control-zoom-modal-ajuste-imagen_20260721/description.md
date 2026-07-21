- **Nombre**: Centrar el control de texto del nivel de zoom en el modal "Ajustar imagen"
- **Código**: fast-centrar-control-zoom-modal-ajuste-imagen_20260721
- **Tipo**: fast
- **Fecha**: 2026-07-21

## Prompt original del usuario

"centra horizontalmente el control de texto con la información del nivel de zomm"

## Descripción completa

En el modal "Ajustar imagen" (`src/ui/imageAdjustModal.js`), el control con el valor numérico del zoom y el símbolo "%" (debajo del slider) aparecía alineado a la izquierda en vez de centrado bajo el propio slider. Ahora se muestra centrado horizontalmente.

## Cambios aplicados

- `src/styles/main.css`: en la regla `.image-adjust-modal__zoom-value`, se añade `width: 100%;` y `justify-content: center;` para que el contenedor flex del valor de zoom ocupe todo el ancho disponible del campo y centre su contenido.
