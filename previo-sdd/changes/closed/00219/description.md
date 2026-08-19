- **Name**: La modal de operación en curso sigue sin verse a tiempo al arrastrar cartas sobre un mazo
- **Code**: 00219
- **Type**: fix
- **Creation date**: 2026-08-15

## Full description

El bug de la modal de "operación en curso" (cambio 00214) sigue sin resolverse tras el fix 00218: al arrastrar varias cartas seleccionadas sobre un mazo en modo edición, la modal sigue sin aparecer hasta que la operación ya casi ha terminado, dejando al jugador bloqueado sin ningún aviso durante casi todo el tiempo real de espera — justo el problema que este mecanismo debía evitar.

**Cómo reproducirlo**: en modo edición, con un mazo y varias cartas sueltas en la mesa, seleccionar varias cartas (cuantas más, más perceptible) y arrastrarlas sobre el mazo. El navegador se congela de inmediato; la modal solo llega a verse, si acaso, justo antes de que la operación termine.

**Comportamiento esperado**: la modal debe aparecer primero, completamente visible, y solo entonces debe lanzarse **todo** el trabajo bloqueante de esa operación (no solo su último paso); al terminar, se cierra. Cuando el arrastre de la selección no termina sobre un mazo (movimiento normal de cartas u otro tipo de componente), el comportamiento debe seguir siendo exactamente el mismo que antes de este cambio — sin modal, sin ningún cambio perceptible de flujo o de tiempos.

## Technical notes

- El fix 00218 diagnosticó mal el alcance del problema: sustituyó `setTimeout(work, 0)` por doble `requestAnimationFrame` dentro de `runWithProgressModal` (`ui/progressModal.js`), pero eso solo garantiza pintado antes del trabajo que la modal ya envolvía — que es únicamente lo que hace `attemptDropOnMazo` (`src/modes/edit/editMode.js`, ~línea 167).
- La causa raíz real: antes de que `attemptDropOnMazo` se invoque siquiera, el handler `onMove` (mismo fichero, líneas ~739-758) recorre **todas** las cartas del grupo arrastrado y llama `replaceComponent` una vez por cada una para fijar su posición final sobre la mesa. Cada llamada a `replaceComponent` emite `components:changed` (`core/state.js`), que en `main.js` (líneas 54-55) dispara `renderAll` (re-render completo de la mesa) y `persistState` (autoguardado síncrono en `localStorage`, serializando todo el estado incluidas imágenes en base64) — ambos síncronos y bloqueantes. Con una selección de N cartas, son N re-renders + N guardados completos, todos antes de que `attemptDropOnMazo` (y por tanto la modal) lleguen a ejecutarse.
- La solución debe mover el punto en que se decide mostrar la modal a **antes** del bucle de actualización de posiciones, no solo dentro de `attemptDropOnMazo`: detectar primero si el resultado del arrastre va a caer sobre un mazo (mismo criterio de solape que ya usa `attemptDropOnMazo` — selección compuesta únicamente por cartas + solape de rectángulos con un mazo), y si es así, envolver en `runWithProgressModal` tanto el bucle de `replaceComponent` de posiciones como la llamada final a la inserción en el mazo. Si no cae sobre un mazo, el camino debe seguir siendo el actual (inmediato, sin modal).
