- **Name**: Pulsar un dado no bloqueado en modo juego debe lanzarlo, no arrastrarlo
- **Code**: 00263
- **Type**: fast
- **Creation date**: 2026-09-09

## Full description

En modo juego, al pulsar sobre un dado que **no** está bloqueado, no se ejecuta su interacción de click (lanzar el dado): en su lugar se inicia el gesto de arrastre. Como al soltar el botón el dado no se ha desplazado, vuelve a su sitio y no ocurre nada visible; el efecto para la persona usuaria es que "el dado se selecciona para mover y se vuelve a dejar" sin lanzarse.

Cómo reproducirlo:

1. En modo juego, tener un dado cuyo bloqueo esté en "Ninguno" (valor por defecto).
2. Hacer click sobre el dado.
3. Resultado actual: el dado no se lanza.
4. Si en cambio el dado está bloqueado, un click sí lo lanza correctamente — el fallo solo se da con el dado no bloqueado.

Comportamiento correcto: si un componente tiene una interacción de click activa, al pulsar sobre él debe ejecutarse esa interacción **con independencia de si el componente está bloqueado o no**. El estado de bloqueo solo debe condicionar si el componente se puede arrastrar, nunca su interacción de click. Es el mismo criterio que ya se aplica a los otros componentes con interacción de click en modo juego: la carta (voltear al pulsarla) y el mazo (sacar carta al pulsarlo) responden al click estén bloqueados o no.

## Technical notes

- Archivo único: `src/ui/componentRenderer.js`, rama `component.type === 'dado'` de `renderComponentsOnTable`.
- En modo juego, `playMode.js` pasa `canMove = (component) => getEffectiveGeneralProps(component, groups).bloqueado === 'ninguno'`: un dado **no bloqueado es arrastrable** y entra en el bloque `if (onMove && canMove(component))`; un dado bloqueado no.
- Diagnóstico real (dos partes):
  1. La clase de afordancia `dice--clickable` se añadía en un `} else if (onDiceResult && isInteractionActive(component, 'lanzar')) {` encadenado al bloque del arrastre, así que no se aplicaba nunca al dado arrastrable. (Corregido convirtiéndolo en `if` independiente.)
  2. **Causa principal del síntoma "parpadeo y nada más":** en el `mousedown` del arrastre, el dado llamaba a `beginDragLift(dice, worldEl)`, que hace `worldEl.appendChild(dice)` — reordena el nodo en el DOM. Reordenar el nodo entre `mousedown` y `mouseup` hace que el navegador **no sintetice el evento `click`** posterior, por lo que el listener de `click` que lanza el dado (`if (onDiceResult && isInteractionActive(component, 'lanzar'))`, segundo bloque de la rama, que ya era `if` independiente) nunca se ejecutaba en una pulsación sin desplazamiento. El "parpadeo" es el efecto `.lifted` que se añade en el `mousedown` y se quita en el `mouseup`.
- `'carta'` y `'mazo'` no sufren esto porque difieren `beginDragLift` (y el `worldEl.appendChild`) al **primer `mousemove`** — sólo cuando hay arrastre real —, con un comentario que lo explica literalmente ("reordenar el DOM ya en `mousedown` impide que el navegador sintetice el `click` posterior"). El dado era el único que lo hacía en `mousedown`.
- Corrección: alinear el dado con ese patrón — mover `beginDragLift` al primer `mousemove` mediante una bandera de cierre `lifted`, y quitar el `beginDragLift`/`endDragLift` del par `mousedown`/`mouseup` incondicional.
- Comportamiento documentado en `design/docs/architecture/003-component-types.md` (`'dado'`: "In play mode: click rolls the die"): la corrección alinea el código con la documentación, no la cambia.

## Applied changes

- `src/ui/componentRenderer.js`, rama `component.type === 'dado'` de `renderComponentsOnTable`:
  - El bloque que añade `dice--clickable` pasa de `} else if (onDiceResult && isInteractionActive(component, 'lanzar')) {` (encadenado al `if (onMove && canMove(component))` del arrastre) a un `if` independiente.
  - El efecto "levantar" (`beginDragLift`) deja de ejecutarse en el `mousedown`: se difiere al primer `mousemove` con una bandera `lifted` (mismo patrón que `'carta'`/`'mazo'`), y `handleMouseUp` sólo llama a `endDragLift(dice)` si `lifted` es `true`. Así, una pulsación sin desplazamiento no reordena el nodo en el DOM y el navegador sí sintetiza el `click` que lanza el dado.
- `src/test/functional/dado.test.js`:
  - FT-020-08 · "lanzamiento en modo juego": actualizada la nota de implementación (describía el `else if` antiguo); añadida la aserción `expect(diceEl(content).classList.contains('dice--clickable')).toBe(true)` para el dado no bloqueado en modo juego.
  - Nuevo FT-020-09 · "pulsar (sin arrastrar) un dado no bloqueado lo lanza": regresión que simula `mousedown → mouseup` sin `mousemove` sobre un dado arrastrable, comprueba que el nodo no queda con `.lifted` y que el `click` posterior lanza el dado y persiste el resultado. Verificado que este test falla sin la corrección y pasa con ella.
- `npm test`: 329 OK, 0 fallos. `src/test/TRACEABILITY.md` regenerado sin anomalías.
