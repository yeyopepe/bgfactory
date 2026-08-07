- **Nombre**: Texto "Copias: XXX" en la pestaña "Copias"
- **Código**: 00198
- **Tipo**: fast
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

en la pestaña de copias, la linea con las copias vinculadas debe poner "Copias: XXX"

## Descripción completa

En la pestaña "Copias" de la ventana de propiedades de un componente, la fila que muestra el número de copias vinculadas al objeto pasa a mostrar un único texto con el formato "Copias: XXX" (por ejemplo, "Copias: 5"), sustituyendo a la etiqueta "Copias vinculadas" seguida del número en una columna separada que se mostraba hasta ahora.

## Apuntes técnicos

- `src/ui/componentModal.js`, pestaña "Copias": fila `.component-copies-summary__row` con `.component-copies-summary__label` ("Copias vinculadas") y `.component-copies-summary__value` (número) en columnas separadas — pasa a un único `<span>` con el texto combinado.

## Cambios aplicados

- `src/ui/componentModal.js`: en la construcción de la pestaña "Copias", el `<span class="component-copies-summary__label">` ahora contiene el texto `` `Copias: ${linkedCopies.length}` `` en vez de "Copias vinculadas"; se elimina el `<span class="component-copies-summary__value">` (ya no hace falta, el número queda incluido en el label).

