## (a) Anotaciones funcionales

- Fuera de alcance: cualquier otro comportamiento de cierre de estos modales (botón de cerrar, Escape, aceptar/cancelar) no se toca — solo el cierre por "clic fuera".
- Fuera de alcance: el arrastre de fichas/dados/textos sobre el tablero (`componentRenderer.js`), que usa un patrón de `mousedown`/`mouseup` completamente distinto y no está relacionado con este bug.
- No ha habido dudas de alcance que resolver con el usuario; la descripción ya deja claro que afecta a todas las ventanas/modales equivalentes.

## (b) Solución técnica

Causa raíz: los 10 modales del proyecto cierran su overlay con este patrón idéntico:

```js
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) overlay.remove();
});
```

El evento `click` del DOM no se dispara solo cuando `mousedown` y `mouseup` ocurren en el mismo elemento: si empiezan en un descendiente (p.ej. un `<textarea>` o `<input>` dentro del modal) y el `mouseup` acaba fuera de ese descendiente, el navegador dispara `click` sobre el ancestro común de ambos puntos — que en este árbol es siempre `overlay`, porque el modal es hijo del overlay. Por eso, arrastrar una selección de texto hacia fuera del control (o incluso hacia fuera del propio modal) hace que `e.target === overlay` sea verdadero y el modal se cierre, aunque el gesto empezara dentro.

La solución mínima es dejar de fiarse solo del `click`, y comprobar también dónde se originó el `mousedown`: solo cerrar si tanto el `mousedown` como el `click` han caído directamente sobre el `overlay` (nunca sobre un descendiente).

Aplicar el mismo cambio, idéntico en forma, a cada uno de los 10 sitios que hoy tienen ese patrón (misma causa raíz duplicada, no una refactorización — no se introduce ninguna abstracción nueva, cada modal sigue siendo autocontenido tal cual está hoy):

1. `src/ui/componentModal.js` (líneas ~949-954)
2. `src/ui/boardPatternModal.js` (líneas ~124-126)
3. `src/ui/boardImageModal.js` (líneas ~97-99)
4. `src/ui/componentTypeModal.js` (líneas ~79-81)
5. `src/ui/diceFontModal.js` (líneas ~100-102)
6. `src/ui/diceResultModal.js` (líneas ~38-40)
7. `src/ui/errorModal.js` (líneas ~48-50)
8. `src/ui/helpIcon.js` (líneas ~52-54)
9. `src/ui/imageAdjustModal.js` (líneas ~154-156)
10. `src/ui/resourceModal.js` (líneas ~75-77)

En cada uno, sustituir el bloque `overlay.addEventListener('click', ...)` por:

```js
let mousedownOnOverlay = false;
overlay.addEventListener('mousedown', (e) => {
  mousedownOnOverlay = e.target === overlay;
});
overlay.addEventListener('click', (e) => {
  if (e.target === overlay && mousedownOnOverlay) {
    overlay.remove();
  }
});
```

Con esto, un arrastre que empiece dentro del modal (en cualquier control) y termine soltándose fuera de él ya no cierra la ventana, porque `mousedownOnOverlay` queda en `false`. Un clic (sin arrastre) que empiece y termine directamente sobre el overlay sigue cerrando la ventana como hasta ahora.
