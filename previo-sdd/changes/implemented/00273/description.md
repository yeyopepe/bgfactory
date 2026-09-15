- **Name**: El mazo del conjunto "Baraja francesa" aparece a la derecha de las cartas, no a la izquierda
- **Code**: 00273
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

Al generar el conjunto pre-definido "Baraja francesa estándar (54 cartas)" desde el picker de componentes, el componente mazo resultante se coloca en la mesa a la **derecha** de la cuadrícula de las 54 cartas. El comportamiento esperado es que el mazo aparezca a la **izquierda** de la cuadrícula de cartas, en vez de a la derecha.

## Technical notes

- La posición se calcula en `src/core/presets/frenchDeck.js`, función `createFrenchDeckPreset()`. Actualmente el origen de la cuadrícula de cartas es `(100, 100)` (`computeGridPosition`, ~línea 27-28) y el mazo se coloca aparte, a la derecha de la última columna: `mazo.x = 100 + 13 * cardWidth * 1.1 + cardWidth * 2` (línea 86), `mazo.y = 100`.
- Para que el mazo quede a la izquierda sin solaparse con las cartas, la cuadrícula de cartas debe desplazarse hacia la derecha (nuevo origen X = `100 + cardWidth * 2` o equivalente) y el mazo pasar a ocupar la posición base `(100, 100)`.

## Applied changes

- `src/core/presets/frenchDeck.js`, `computeGridPosition()`: el origen X de la cuadrícula de cartas pasa de `100` a `100 + cardWidth * 2`, dejando hueco a la izquierda para el mazo.
- `src/core/presets/frenchDeck.js`, asignación de posición del `mazo`: pasa de `x = 100 + 13 * cardWidth * 1.1 + cardWidth * 2` (a la derecha de la última columna) a `x = 100` (posición base, a la izquierda de la cuadrícula de cartas). `y` se mantiene en `100` en ambos.
- Verificado con `npm test`: 391/391 OK.
