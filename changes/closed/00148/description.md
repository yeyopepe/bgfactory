- **Nombre**: Icono de ayuda de "Bloqueado" mal colocado en la sección General
- **Código**: 00148
- **Tipo**: fast
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

el icono de ayuda de la propiedad bloqueado debe estar al lado del título como en el resto de opciones, y ahora aparece después del combo

## Descripción completa

En la nueva sección "General" del panel de propiedades de un componente (introducida en el cambio 00146), el icono de ayuda (?) del campo "Bloqueado" aparecía en su propia línea, debajo del selector, en vez de al lado del título "Bloqueado" — a diferencia de los otros tres controles de esa misma sección (Oculto, Mostrar tooltip, Subir al mover/interactuar), donde el icono de ayuda va pegado al texto del control.

Se confirmó con el usuario que el ajuste debe aplicarse únicamente al campo "Bloqueado" dentro de la sección "General" — no es una convención nueva a extender a otros campos con selector del modal (p.ej. "Interacciones" o "Click derecho" en la pestaña "Comportamiento" siguen igual, sin tocar).

Ahora el título "Bloqueado" y su icono de ayuda quedan en la misma línea, y el selector se muestra debajo, igual que antes.

## Cambios aplicados

- `src/ui/componentModal.js`: en la construcción del campo `moveField` (control "Bloqueado" dentro de `infoSection`, sección "General"), se creó una fila (`moveLabelRow`, `display: flex`) que agrupa `moveLabel` y el icono de ayuda (`createHelpIcon`), colocada antes de `moveSelect`. Antes, los tres se añadían como hijos sueltos de `moveField` (label, select, icono), lo que dejaba el icono en su propia línea al no ser `moveField` un contenedor flex. Cambio aislado a este campo, sin tocar `interactionField`/`rightClickField` (pestaña "Comportamiento"), que siguen con el mismo patrón que tenían.
