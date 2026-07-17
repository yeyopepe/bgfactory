# Rediseño de la lista de componentes (modo edición)

- **Nombre**: Lista de componentes en tabla flotante, colapsable, con selección y resaltado
- **Código**: 00005
- **Tipo**: change
- **Prompt original del usuario**: "cómo debe ser la lista de componentes:
- Una lista con tres columnas: id, tipo de componente, un botón para eliminar y un botón para editar
- botón eliminar: elimina elemento, con confirmación previa
- botón editar: abre la ventana de configuración del elemento
- Al hacer clic sobre  la fila del componente, se debe seleccionar la fila y el elemento debe aparecer resaltado en la mesa.
- La lista debe sorportar scroll vertical y debe ser flotante y colapsable"
- **Descripción completa**:

Sustituye el listado actual de componentes del modo edición (hoy un `<ul>` simple en un panel lateral fijo, en [`src/ui/componentList.js`](../../../src/ui/componentList.js) y [`src/modes/edit/editMode.js`](../../../src/modes/edit/editMode.js)) por una lista en formato tabla, flotante sobre la mesa infinita y colapsable, con selección de fila que resalta el componente correspondiente en la mesa.

Comportamiento esperado:

- **Columnas**: tres columnas — Id, Tipo, Acciones. La columna Acciones agrupa los botones "Editar" y "Eliminar" de esa fila.
- **Botón Eliminar**: elimina el componente, pidiendo confirmación previa mediante `confirm()` nativo del navegador antes de aplicar el borrado. Si se cancela, no se elimina nada.
- **Botón Editar**: abre la ventana de configuración del componente (el modal ya existente, mismo comportamiento que hoy).
- **Selección de fila**: al hacer click sobre una fila (fuera de los botones de acciones), esa fila se marca visualmente como seleccionada y el componente correspondiente se resalta en la mesa (ej. contorno/outline visual sobre su representación). Selección única: solo una fila puede estar seleccionada a la vez. Hacer click de nuevo sobre la fila ya seleccionada la deselecciona (toggle), quitando también el resaltado en la mesa. Seleccionar otra fila mueve la selección y el resaltado a esa otra.
- **Scroll**: si el contenido de la lista supera la altura disponible del panel, debe soportar scroll vertical dentro del propio panel (el panel no crece indefinidamente).
- **Flotante**: el panel deja de ser un panel lateral fijo que ocupa espacio en el layout; pasa a flotar sobre la mesa infinita, anclado en la esquina superior derecha.
- **Colapsable**: el panel tiene un control (ej. botón en su cabecera) para colapsar/expandir. Colapsado, se reduce a una cabecera compacta (título + control de expandir), ocultando filas y el botón de añadir; expandido, muestra la tabla completa y el botón de añadir.
- **Botón "+ Añadir componente"**: se mantiene, ahora dentro de este panel flotante (visible solo cuando el panel está expandido), con el mismo comportamiento actual (abre el modal de alta).
- **Estado no persistido**: la selección de fila y el estado colapsado/expandido son solo de la sesión de edición actual en memoria — no se guardan en localStorage ni sobreviven a recargar la página. Dado que hoy el modo edición se remonta por completo ante cualquier cambio de componentes (alta/edición/borrado dispara un re-render completo vía el bus de eventos), la selección y el colapso pueden reiniciarse tras esas acciones; se acepta este comportamiento como parte de este cambio.
- **Alcance**: aplica solo al modo edición (el modo juego no usa hoy esta lista y no se ve afectado).

Dudas de alcance resueltas con el usuario:
- *¿Tres columnas literales o cuatro con los botones separados?* → Tres columnas: Id, Tipo, Acciones (editar+eliminar agrupados en la misma celda).
- *¿Selección única con toggle, o sin deseleccionar?* → Selección única con toggle: clic de nuevo en la fila seleccionada la deselecciona.
- *¿Confirmación de borrado con modal propio o `confirm()` nativo?* → `confirm()` nativo del navegador.
- *¿Dónde flota el panel y qué pasa con el botón de añadir?* → Esquina superior derecha de la mesa; el botón de añadir se mantiene dentro del propio panel flotante.
