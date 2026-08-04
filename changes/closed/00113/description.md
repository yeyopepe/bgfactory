- **Nombre**: Ctrl+click deja de funcionar para seleccionar varios elementos en modo edición
- **Código**: 00113
- **Tipo**: fix

## Prompt original del usuario

Bug: Ahora no funciona la tecla ctrl para seleccionar varios elementos.

## Descripción completa

En modo edición, mantener pulsada la tecla Ctrl (o Cmd) y hacer click sobre varios componentes de la mesa debería ir añadiéndolos a la selección múltiple, sin quitar los ya seleccionados (funcionalidad ya existente). Desde el último ajuste aplicado sobre el componente "Mazo" (cambio fast "ajustes visuales del mazo", que hacía que una carta se trajera siempre al frente de la mesa nada más empezar a pulsar sobre ella, para verse por encima de otros elementos al arrastrarla), el Ctrl+click ha dejado de añadir elementos a la selección con normalidad: un simple click (con o sin Ctrl) sobre una carta ya no dispara de forma fiable el cambio de selección esperado.

**Cómo reproducir**: en modo edición, con dos o más componentes tipo "Carta/Ficha" en la mesa, hacer click normal sobre uno (queda seleccionado), y después Ctrl+click sobre otro — se espera que ambos queden seleccionados a la vez (resaltados), pero no ocurre.

**Comportamiento esperado**: Ctrl+click (o Cmd+click) debe seguir añadiendo/quitando el componente pulsado de la selección múltiple sin afectar al resto, exactamente como funcionaba antes del último ajuste del mazo, sin perder el efecto ya pedido de "la carta que se arrastra se ve por encima de los demás mientras dura el arrastre".

## Apuntes técnicos

- Sospecha de causa raíz (a confirmar por `ms-how`): en `ui/componentRenderer.js`, rama `component.type === 'carta'` de `renderComponentsOnTable`, el listener `mousedown` fue modificado en el cambio fast "ajustes visuales del mazo" para hacer `worldEl.appendChild(target.el)`/`worldEl.appendChild(carta)` (reordenar el nodo al final del DOM) de forma incondicional, en cuanto se pulsa el botón del ratón — no solo cuando efectivamente se empieza a arrastrar. Reordenar el nodo en el DOM durante el propio `mousedown` (antes de que se dispare `mouseup`) puede estar impidiendo que el navegador sintetice el evento `click` posterior sobre ese mismo elemento, que es el que dispara `onToggleSelect(component, e)` (y con él, la lectura de `event.ctrlKey`/`metaKey` en `toggleSelect` de `modes/edit/editMode.js`).
- El resto de tipos (`texto`, `tablero`, `dado`, `documento`, `mazo`) no se tocaron en ese cambio y no reordenan el DOM en `mousedown`, solo cuando `liftOnDrag` está activo y se detecta el primer `mousemove` real (`beginDragLift`, dentro de `handleMouseMove`, no en `mousedown`) — ese es el patrón ya existente que evita este problema en el resto de casos.
- Si se confirma esta causa, el fix mínimo sería mover el "traer al frente" del listener `mousedown` al primer `mousemove` real (mismo patrón que ya usa `liftOnDrag`/`beginDragLift`), para que un click simple (sin arrastre) no reordene el DOM y no interfiera con la síntesis del evento `click`.
