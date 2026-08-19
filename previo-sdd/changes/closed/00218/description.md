- **Name**: La modal de operación en curso no llega a verse antes del bloqueo
- **Code**: 00218
- **Type**: fix
- **Creation date**: 2026-08-15

## Full description

La modal de "operación en curso" (cambio 00214) no cumple su propósito: al arrastrar cartas sobre un mazo en modo edición, el navegador se bloquea antes de que la modal llegue a pintarse en pantalla, así que solo se hace visible justo al final de la operación (si es que llega a verse) — el usuario sigue sin ningún aviso durante casi todo el tiempo real de bloqueo, que es exactamente lo que este mecanismo debía evitar.

**Cómo reproducirlo**: en modo edición, con un mazo y varias cartas sueltas en la mesa, seleccionar varias cartas y arrastrarlas sobre el mazo. El navegador se congela de inmediato; la modal solo aparece (si acaso) justo antes de que la operación termine, en vez de al empezar.

**Comportamiento esperado**: la modal debe aparecer primero, completamente pintada y visible (spinner ya girando), y solo entonces debe lanzarse la operación que bloquea; al terminar la operación, la modal se cierra. El orden percibido por el jugador debe ser siempre: ventana visible → operación → ventana cerrada, nunca al revés ni solapado.

## Technical notes

- Causa raíz: `ui/progressModal.js` (`runWithProgressModal`) difiere hoy el trabajo pesado con `setTimeout(work, 0)` tras insertar el overlay en el DOM, asumiendo que basta para ceder un frame al navegador. En la práctica `setTimeout(0)` no garantiza que se haya completado un ciclo de render antes de ejecutarse — el navegador puede no haber pintado el frame anterior, así que el bloqueo síncrono de `work` puede empezar antes de que la modal se pinte.
- Solución técnica ya identificada por el usuario: sustituir `setTimeout(work, 0)` por doble `requestAnimationFrame` anidado (patrón estándar para garantizar que el navegador ha completado un ciclo de pintado antes de continuar).
- Único caller de `runWithProgressModal`: `attemptDropOnMazo` en `src/modes/edit/editMode.js`. Ningún otro sitio del código depende del mecanismo interno ni de su timing exacto.
- El mecanismo (`setTimeout(fn, 0)`) está documentado explícitamente en `design/docs/style/03-modales-menus.md` §12.1.2 (línea 37, "work se ejecuta en un setTimeout(fn, 0)..."), añadida por el cambio 00214 — hay que actualizar esa frase para reflejar el mecanismo nuevo. Esto es lo que descarta la vía rápida ("fast") de `pv-fix`, aunque el cambio de código en sí sea mínimo (una función, un fichero).
