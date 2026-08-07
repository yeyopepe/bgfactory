- **Nombre**: Quitar confirmación al añadir cartas a un mazo en modo edición
- **Código**: 00195
- **Tipo**: fast
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

cuando se añadan cartas a un mazo en el modo edición, ya no pidas confirmación. Que funcione igual que en el modo juego

## Descripción completa

En modo edición, al arrastrar una carta (o varias cartas seleccionadas) hasta soltarlas sobre un mazo para añadirlas a su contenido, aparecía una pregunta de confirmación ("¿Añadir la carta/las cartas... al mazo...?") antes de completar la acción.

En modo juego, la misma acción (soltar una carta sobre un mazo) las añade directamente, sin pedir confirmación.

Se pide que modo edición se comporte igual que modo juego en este punto: al soltar cartas sobre un mazo, se añaden directamente, sin ninguna pregunta de confirmación previa.

## Apuntes técnicos

- `src/modes/edit/editMode.js`, función `attemptDropOnMazo`: eliminado el `confirm()` previo a la inserción de las cartas en `cartaIds` del mazo. El resto de la lógica (detección de solape, filtrado de que todos los elementos arrastrados sean cartas) no cambia.
- `src/modes/play/playMode.js` ya realizaba la misma inserción (`onMove` sobre un componente `carta` que solapa un `mazo`) sin confirmación — comportamiento de referencia usado para alinear modo edición.

## Cambios aplicados

- `src/modes/edit/editMode.js`: eliminada la llamada a `confirm()` y la variable `pregunta` en `attemptDropOnMazo` — ahora añade las cartas al mazo directamente al detectar el solape, igual que `playMode.js`.
