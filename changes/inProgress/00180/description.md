- **Nombre**: Ocultar/mostrar selección desde el menú contextual de Modo Edición
- **Código**: 00180
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

añade al menú contextual de los elementos en el modo edición una opción des/ocultar los elementos seleccionados

## Descripción completa

En Modo Edición, al hacer clic derecho sobre un elemento de la mesa se abre un menú contextual con acciones generales que ya existen hoy (Clonar, Copiar, Eliminar) aplicadas a todos los elementos seleccionados en ese momento. Se añade a esa misma sección general una nueva acción, en primer lugar (antes de "Clonar"), que permite ocultar o mostrar de golpe todos los elementos afectados (la selección múltiple vigente al abrir el menú, o el propio elemento clicado si no formaba parte de ninguna selección previa). El orden resultante de la sección general queda: Ocultar/Mostrar, Clonar, Copiar, Eliminar.

"Oculto" es un estado que ya existe hoy por elemento: un elemento marcado como oculto no aparece en absoluto durante la partida (Modo Juego), aunque en Modo Edición se sigue viendo con normalidad, señalado con una pequeña insignia. Hasta ahora esa marca solo se podía cambiar de uno en uno, abriendo la ficha de edición del elemento. Este cambio añade una forma rápida de aplicarlo a varios elementos a la vez sin abrir ninguna ficha.

Comportamiento de la nueva opción:
- Si **todos** los elementos afectados ya están ocultos, la opción se muestra como "Mostrar" y, al pulsarla, deja de ocultarlos todos.
- En cualquier otro caso (ninguno está oculto todavía, o hay una mezcla de ocultos y visibles), la opción se muestra como "Ocultar" y, al pulsarla, oculta a todos los afectados (incluidos los que ya lo estaban).
- El efecto es visible al instante en la mesa de Modo Edición: los elementos afectados pasan a mostrar (o dejan de mostrar) la insignia de "Oculto" que ya existe hoy para ese estado. No se muestra ningún aviso ni confirmación adicional aparte de ese cambio visual inmediato, igual que ya ocurre hoy con "Clonar"/"Copiar"/"Eliminar" en ese mismo menú.
- La opción está siempre disponible (nunca aparece deshabilitada), a diferencia de "Clonar"/"Copiar", que sí pueden deshabilitarse según qué se tenga seleccionado.
- Si alguno de los elementos afectados es una copia vinculada a otro elemento "original" con la sincronización activada, este cambio no le da ningún trato especial: se oculta/muestra igual que cualquier otro elemento, con el mismo comportamiento que ya existe hoy al cambiar ese mismo estado desde la ficha de edición individual (si el original cambia su propio estado de oculto más adelante, la copia sincronizada volverá a heredarlo).

### Preguntas de alcance resueltas
- ¿Dónde va la opción dentro del menú? → En la sección general del menú, junto a Clonar/Copiar/Eliminar, en primer lugar (antes que "Clonar").
- ¿Qué etiqueta y comportamiento tiene con una selección mixta (unos ocultos, otros no)? → Etiqueta binaria: "Mostrar" solo si todos están ocultos; "Ocultar" en cualquier otro caso, afectando a todos.
- ¿Hace falta algún aviso o confirmación al aplicarlo? → No; el cambio ya es visible al instante mediante la insignia existente, sin toast ni modal.
- ¿Se deshabilita en algún caso? → No, siempre está disponible para cualquier selección no vacía.
- ¿Trato especial para copias sincronizadas? → No, mismo comportamiento que ya tiene hoy el campo "Oculto" al editarlo desde la ficha individual de un elemento.

## Apuntes técnicos

- Menú contextual de Modo Edición: `ui/contextMenu.js` (`openContextMenu`), cableado desde `modes/edit/editMode.js#handleComponentContextMenu` (cambio 00170) — sección general ya construye ahí mismo las filas "Clonar"/"Copiar"/"Eliminar" sobre `affectedComponents` (derivado de `selectedComponentIds`).
- Campo de datos: `component.oculto` (boolean, `core/component.js`, cambio 00100), actualizado vía `replaceComponent`/`updateComponent` (mismo patrón que usa la fila "Añadir a grupo" del mismo menú para tocar `grupoIds`).
- Icono a reutilizar: el mismo SVG de ojo tachado que ya usa `.component-hidden-badge` (insignia de "Oculto" en Modo Edición, `ui/componentRenderer.js`, Style Bible sección 12.3), para no introducir un icono nuevo.
- Precedente de comportamiento binario sobre estado mixto: `modes/play/playMode.js`, menú contextual de Modo Juego, fila "Bloquear"/"Desbloquear" (aunque ese campo es de 3 valores, no boolean, y actúa sobre un único componente, no sobre una selección múltiple).
- Precedente de que las copias sincronizadas no tienen trato especial al tocar `oculto`: el checkbox "Oculto" de `ui/componentModal.js` (líneas ~444-459) no deshabilita ni restringe nada según `copyOf`/`sincronizado`; la resincronización posterior ocurre vía `core/component.js#syncCopyWithOriginal` cuando el original cambia, no es responsabilidad de esta nueva acción.
