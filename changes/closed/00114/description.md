- **Nombre**: La zona de revelado del mazo no se mueve en vivo al arrastrar el mazo
- **Código**: 00114
- **Tipo**: fix

## Prompt original del usuario

al mover el mazo, la parte de la carta revelada no se mueve ni actualiza hasta que termino de mover el mazo.

## Descripción completa

El mazo muestra siempre, junto a él, una "zona de revelado" (recuadro marcado con el texto "Carta revelada") que indica dónde aparecerán las cartas al sacarlas. Al arrastrar el propio mazo por la mesa (en modo edición), esa zona de revelado debería moverse en tiempo real junto con el mazo, pegada a su lado derecho, igual que ya se mueve la propia caja del mazo mientras se arrastra. En su lugar, la zona de revelado se queda quieta en su posición original durante todo el arrastre, y solo salta a la posición correcta (junto al mazo) cuando se suelta el botón del ratón y termina el movimiento.

**Cómo reproducir**: en modo edición, arrastrar un mazo por la mesa mientras se observa el recuadro de "Carta revelada" — se queda atrás, desincronizado del mazo, hasta soltar el ratón.

**Comportamiento esperado**: la zona de revelado debe seguir al mazo en tiempo real durante todo el arrastre, manteniendo siempre la misma posición relativa (pegada a su lado derecho, misma altura), igual que ocurre con el resto de elementos que se mueven junto a un componente arrastrado (p. ej. los componentes de una selección múltiple que se mueven en bloque).

## Apuntes técnicos

- La zona de revelado se pinta en `ui/componentRenderer.js` mediante `renderMazoRevealZone(worldEl, component)`, un elemento `.mazo-reveal-zone` añadido a `worldEl` como hermano del propio mazo (no hijo), calculado una única vez por render a partir de `core/deck.js` → `getMazoRevealZoneRect(component)`.
- El arrastre del mazo (rama `component.type === 'mazo'` de `renderComponentsOnTable`) actualiza en vivo `mazo.style.left/top` dentro de `handleMouseMove`, y también reposiciona en vivo los elementos de `blockDragTargets` (selección múltiple) — pero no reposiciona el elemento de la zona de revelado, que no está registrado en ningún sitio accesible desde ese `handleMouseMove`.
- El fix probablemente pase por guardar una referencia al nodo de la zona de revelado (devuelto por `renderMazoRevealZone`, o localizado de otra forma) y actualizar su `left`/`top` en cada `handleMouseMove` del arrastre del mazo, con el mismo cálculo que ya usa `getMazoRevealZoneRect` (mismo `MAZO_REVEAL_GAP`), a confirmar por `ms-how`.
