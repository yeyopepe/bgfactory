- **Name**: La carta revelada de un mazo debe verse por encima del marco/texto de la zona de revelado
- **Code**: 00278
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

Al sacar una carta de un mazo en Modo Juego (haciendo clic sobre el mazo), la carta revelada quedaba tapada por el recuadro decorativo y el texto ("Carta revelada") de la zona de revelado, y también por el propio mazo — en vez de aparecer visualmente por encima de ambos, que es el comportamiento esperado.

Ahora, al sacar la carta, esta queda siempre por delante tanto de la zona de revelado como del mazo del que salió.

## Technical notes

Causa raíz: en `modes/play/playMode.js`, el manejador `onMazoDraw` llamaba a `sacarCartaDeMazo(mazo.id, cartaIds[0])` (que en `core/state.js` ya sube la carta revelada al frente vía `reorderComponent(carta.id, 1)`) y **después**, si `subirAlMoverInteractuar` estaba activo, subía también el propio mazo al frente (`reorderComponent(mazo.id, 1)`). Esa segunda llamada pisaba el orden que acababa de fijar la carta, dejando al mazo (y a su zona de revelado, pintada en `ui/componentRenderer.js` en el turno de render del propio mazo) por delante de la carta recién revelada.

Corrección: se invirtió el orden de las dos llamadas en `onMazoDraw` — el mazo sube de order (si aplica) ANTES de sacar la carta, de modo que el ascenso a frente que hace `sacarCartaDeMazo` para la carta revelada queda vigente al final.

Se actualizó el test `FT-013-07` (`src/test/functional/subir-al-interactuar.test.js`) para reflejar el comportamiento correcto: el mazo sube de order, pero la carta revelada queda por delante de él.

## Applied changes

- `src/modes/play/playMode.js`: en `onMazoDraw`, se invirtió el orden de las llamadas — ahora `reorderComponent(mazo.id, 1)` (si `subirAlMoverInteractuar`) se ejecuta antes de `sacarCartaDeMazo(...)`, no después.
- `src/test/functional/subir-al-interactuar.test.js`: actualizado el test `FT-013-07` para verificar que, tras sacar la carta, el mazo sube (order 2) pero la carta revelada queda por delante (order 1), en vez de esperar que el mazo terminara en order 1.
