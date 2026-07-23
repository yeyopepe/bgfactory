## (a) Anotaciones funcionales

- Fuera de alcance: los demás componentes arrastrables con `liftOnDrag` (tablero, dado, ficha, texto, documento) usan exactamente el mismo patrón de "levantar en `mousedown`" y podrían compartir la misma causa raíz para sus propias interacciones de clic (p. ej. tirar el dado). El bug reportado es solo sobre cartas, así que el fix se limita a `carta`; si se confirma el mismo problema en otro componente, sería un fix aparte.
- No ha habido dudas de alcance que resolver con el usuario: el bug y el comportamiento esperado ya quedaban inequívocos en `description.md`.

## (b) Solución técnica

Causa raíz (confirmada leyendo `src/ui/componentRenderer.js`, bloque `carta`, líneas ~1043-1080): el listener de `mousedown` de la carta llama a `beginDragLift(carta, worldEl)` de forma incondicional en cuanto se pulsa, y `beginDragLift` (línea ~251) hace `worldEl.appendChild(el)` — es decir, desengancha y vuelve a enganchar el nodo `carta` en el DOM de forma síncrona, **antes** de que se produzca el `mouseup`. Reinsertar un elemento en el DOM entre su `mousedown` y su `mouseup` hace que el navegador no dispare el evento `click` sintético sobre ese elemento, aunque el usuario no haya movido el ratón. Como el volteo de la carta (líneas ~1116-1122) depende enteramente de ese `click`, el volteo nunca llega a dispararse — solo se aprecia el efecto visual de "levantar" (clase `.lifted`, añadida directamente vía `classList.add`, sin pasar por `click`).

1. En `src/ui/componentRenderer.js`, dentro del bloque `if (onMove && canMove(component))` de `carta` (mismo bloque de las líneas ~1043-1080):
   - Añadir una variable de cierre local `lifted` (booleana, `false` al declarar `startMouseX`/`startMouseY`/etc.).
   - En `handleMouseMove`, tras actualizar `currentX`/`currentY` y la posición en pantalla, si `liftOnDrag` es `true` y `lifted` es `false`, poner `lifted = true` y llamar a `beginDragLift(carta, worldEl)` ahí (no en `mousedown`). Así el reenganche en el DOM solo ocurre cuando ya hay un movimiento real de ratón (arrastre), nunca en un simple clic sin desplazamiento.
   - En `handleMouseUp`, sustituir `if (liftOnDrag) endDragLift(carta);` por `if (lifted) endDragLift(carta);` (y resetear `lifted = false` tras eso), para no depender de `liftOnDrag` sino del estado real de si se llegó a levantar.
   - En el listener de `mousedown`, quitar la línea `if (liftOnDrag) beginDragLift(carta, worldEl);` — el levantamiento deja de dispararse ahí.
2. No tocar el listener de `click` de la carta (líneas ~1116-1122, volteo) ni `onCartaFlip`/`playMode.js`: una vez que `mousedown` deja de reenganchar el nodo en un clic simple, el `click` nativo vuelve a dispararse con normalidad y el volteo funciona sin más cambios.
3. No tocar `beginDragLift`/`endDragLift` (líneas ~251-258) ni ningún otro tipo de componente (`textBox`, `board`, `dice`, `documentViewer`, `ficha`): siguen levantando en `mousedown` como hasta ahora, fuera del alcance de este fix.

No hay cambios de arquitectura ni de estilo: la clase `.lifted` y su CSS (`main.css`) no cambian, solo el momento en que se añade/quita esa clase; `STYLE_BIBLE.md` ya describe el efecto como aplicado "mientras se arrastra", descripción que sigue siendo cierta (y ahora más exacta) tras este fix.
