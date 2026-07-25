- **Nombre**: Sección de interacciones en el menú contextual de modo juego
- **Código**: 00091
- **Tipo**: change

## Prompt original del usuario

añade al menú contextual de los elementos en modo juego una nueva sección (separada de la general y la específica) para informar de las intereacciones que tiene cada elemento:
- Clic izquierdo: <efecto | ninguno>
- Doble Clic izquierdo: <efecto | ninguno>
- Clic derecho: <efecto | ninguno>

## Descripción completa

Al abrir con el botón derecho el menú contextual de un componente en modo juego, además de la sección general de acciones ya existente ("Bloquear"/"Desbloquear") y de la sección específica por tipo (todavía vacía, reservada para el futuro), el menú incorpora una tercera sección de solo información, separada de las anteriores, que explica qué hace cada tipo de click sobre ese componente:

- **Clic izquierdo**: su efecto, o "Ninguno" si no tiene ninguno.
- **Doble clic izquierdo**: su efecto, o "Ninguno" si no tiene ninguno.
- **Clic derecho**: su efecto.

Esta sección se muestra siempre, para cualquier tipo de componente, aunque las tres líneas digan "Ninguno" — el objetivo es que el jugador pueda consultar de un vistazo, sobre cualquier pieza de la mesa, qué hace cada click sin tener que probarlo o recordarlo.

Contenido de cada línea según el tipo de componente:

- **Cuadro de texto, Tablero, Visor de documentos, Ficha**: Clic izquierdo: Ninguno · Doble clic izquierdo: Ninguno · Clic derecho: Abrir este menú.
- **Dado**: Clic izquierdo: Lanzar el dado · Doble clic izquierdo: Ver el resultado en grande · Clic derecho: Abrir este menú.
- **Carta**: Clic izquierdo: Voltear la carta · Doble clic izquierdo: Ninguno · Clic derecho: Abrir este menú.

### Puntos de alcance resueltos con el usuario

- **¿Se muestra en todos los tipos o solo en los que tienen alguna interacción propia?** Se muestra siempre, en los seis tipos de componente, con sus tres líneas completas (aunque sea todo "Ninguno"), para dar una respuesta consistente y completa en cualquier componente.
- **¿Se menciona el arrastre (mover el componente por la mesa) en "Clic izquierdo"?** No. El arrastre es un gesto de mantener pulsado y mover, no un click puntual, y su disponibilidad depende del estado "Bloqueado" de cada componente concreto (ver [Posición independiente, arrastre y redimensionado de componentes](../../../design/docs/FEATURES.md)) — mezclarlo aquí haría que el texto cambiara según el estado del componente y complicaría el mensaje. Esta sección describe únicamente el efecto fijo de cada tipo de click, igual para cualquier instancia de ese tipo.
- **¿Dónde se ubica dentro del menú?** Al final, después de la sección general y de la específica por tipo (si la hubiera), separada de ellas por su propia línea divisoria — es información de consulta, no una acción a ejecutar, así que las acciones disponibles quedan siempre arriba, antes que esta sección informativa.
- **¿Es interactiva, como el resto de filas del menú?** No. Es texto puramente informativo: no reacciona al pasar el ratón ni ejecuta ninguna acción al pulsar sobre ella, y se distingue visualmente de las filas de acción (tipografía más pequeña/tenue, sin iconos), con un pequeño encabezado ("Interacciones") que dejar claro que ese bloque es solo lectura.

## Apuntes técnicos

- El menú contextual actual vive en `ui/contextMenu.js` (`openContextMenu`), invocado desde `modes/play/playMode.js` (`onContextMenu`), con `generalItems` (ya usado para "Bloquear"/"Desbloquear") y un hueco preparado para `specificItems` (todavía sin usar por ningún tipo). Habrá que añadir un tercer bloque de contenido puramente informativo, independiente de `generalItems`/`specificItems`.
- El efecto de cada tipo de click está codificado en `ui/componentRenderer.js`, dentro de `renderComponentsOnTable`, por tipo de componente:
  - `'dado'`: `click` dispara el lanzamiento (bloque que llama a `onDiceResult` tras la animación); `dblclick` invoca `onDiceOpenResult` (abre `ui/diceResultModal.js` desde `modes/play/playMode.js`).
  - `'carta'`: `click` invoca `onCartaFlip` siempre (independiente de `bloqueado`); `dblclick` solo está cableado a `onSelect`, que en modo juego no se pasa (`modes/play/playMode.js` no lo incluye en los parámetros de `renderComponentsOnTable`), así que no tiene efecto ahí.
  - `'texto'`, `'tablero'`, `'documento'`, `'ficha'`: no tienen ningún listener de `click`/`dblclick` propio en modo juego más allá del arrastre (`mousedown`/`mousemove`/`mouseup`, condicionado a `onMove` y `canMove(component)`, es decir a `bloqueado !== true`) y del propio `contextmenu` que abre este menú — de ahí que su "Clic izquierdo"/"Doble clic izquierdo" sea "Ninguno".
- Esta información no se guarda en el modelo de datos del componente: es texto fijo derivado del `type` del componente, calculable en el propio menú contextual (o en `playMode.js` al construir sus parámetros) sin tocar `core/component.js` ni `core/state.js`.
