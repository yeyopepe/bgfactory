- **Nombre**: Color y grosor del borde en la misma fila en propiedades del tablero
- **Código**: fast-fila-color-grosor-borde-tablero_20260723
- **Tipo**: fast
- **Fecha**: 2026-07-23

## Prompt original del usuario

en las propiedades específicas del tablero, color el color del borde y el grosor en la misma fila. corrije en otras propiedades si pasa lo mismo, para que todas estén igual

## Descripción completa

En la ventana de propiedades específicas del tablero, los campos "Color del borde" y "Grosor" se mostraban en filas separadas, una debajo de la otra. Se han colocado en la misma fila, igual que ya ocurría en las propiedades específicas de la ficha (única otra ventana con estos mismos dos campos). Las propiedades de documento y carta no tienen campos de borde, así que no les afecta.

## Cambios aplicados

- `src/ui/componentModal.js` (función `renderBoardSpecificFields`, en torno a la línea 412) — se ha reestructurado el marcado de los campos de color y grosor del borde para usar el mismo patrón de fila (`div` flex con `gap`) ya empleado en `renderFichaSpecificFields`, en vez de dos `div.modal__field` independientes.
