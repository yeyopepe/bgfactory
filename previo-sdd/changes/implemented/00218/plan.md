- **Creation date**: 2026-08-15
- **Risk**: [pending recalculation]

## (a) Functional notes

**Out of scope:** ningún otro comportamiento se toca — el fix se limita al mecanismo de temporización interno de `runWithProgressModal`. No se cambia el texto, el aspecto visual, ni el caso de uso (arrastrar cartas sobre un mazo) que ya introdujo el cambio 00214.

**Doubts resolved with the user:** ninguna pregunta abierta — la causa raíz y la solución técnica (doble `requestAnimationFrame` anidado) ya las aportó el propio usuario al reportar el bug.

## (b) Technical solution

- [x] **`src/ui/progressModal.js` — sustituir `setTimeout(work, 0)` por doble `requestAnimationFrame` anidado.** En `runWithProgressModal`, tras `document.body.appendChild(overlay)`, sustituir:
  ```js
  setTimeout(() => {
    try {
      work();
    } finally {
      overlay.remove();
    }
  }, 0);
  ```
  por:
  ```js
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        work();
      } finally {
        overlay.remove();
      }
    });
  });
  ```
  El primer `requestAnimationFrame` se dispara antes del siguiente repintado (todavía no garantiza que el frame con la modal ya insertada se haya pintado); el segundo, anidado dentro del primero, se dispara ya en el frame siguiente, cuando el navegador ha completado el ciclo de pintado que incluye la modal — patrón estándar para esta garantía, más fiable que `setTimeout(fn, 0)` (que solo garantiza orden en la cola de tareas, no que haya habido un repintado real de por medio).
  Actualizar también el comentario de cabecera de la función, que menciona el mecanismo antiguo.

## (d) Style changes

- **`design/docs/style/03-modales-menus.md`**, sección §12.1.2 "Modal de operación en curso" (línea 37): sustituir la frase "`work` se ejecuta en un `setTimeout(fn, 0)` tras insertar la modal en el DOM, para que el spinner llegue a pintarse antes de que empiece el bloqueo síncrono del trabajo real." por una que describa el mecanismo nuevo (doble `requestAnimationFrame` anidado) y por qué sustituye al anterior (el `setTimeout(0)` no garantizaba un ciclo de pintado real antes de bloquear — bug 00218).

## (e) Verification

- [x] Leer `ui/progressModal.js` y confirmar que `runWithProgressModal` ya no usa `setTimeout` en ningún punto, y que `work()`/`overlay.remove()` se ejecutan dentro del segundo `requestAnimationFrame` anidado, con el mismo `try/finally` que antes. Confirmado.
- [x] Confirmar en el build generado (`src/_output/versions/*.html`) que el código transpilado contiene los dos `requestAnimationFrame` anidados y ya no contiene el `setTimeout(work, 0)` original. Confirmado en `index-v00212.html` (líneas 19419-19420), sin ningún `setTimeout` restante en `runWithProgressModal`.
- [x] Confirmar que `attemptDropOnMazo` (`src/modes/edit/editMode.js`) sigue llamando a `runWithProgressModal` exactamente igual que antes (mismos argumentos) — el fix no debe requerir ningún cambio en el caller. Confirmado, sin cambios en la llamada.
