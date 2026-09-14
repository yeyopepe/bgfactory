- **Creation date**: 2026-09-14

## (a) Functional notes

**Out of scope:** no se toca ningún otro aspecto del mecanismo de extrusión (`profundidad`/`colorExtrusion`) ni de `.lifted` más allá de esta interacción puntual entre ambos. No se introduce ningún nuevo estado ni clase con significado propio.

**Doubts resolved with the user:** ninguna — la causa raíz y la solución se identificaron y validaron directamente (tests automatizados + verificación visual con Playwright) durante el análisis de esta regresión.

## (b) Technical solution

- [x] **`src/ui/componentRenderer.js` — `beginDragLift`/`endDragLift` retiran y restauran el `style.filter`/`style.boxShadow` inline de extrusión.** Causa raíz: un componente con `profundidad > 0` (efecto de extrusión, `core/component.js`) fija su sombra de reposo directamente como estilo inline (`buildExtrusionLayers`/`resolveExtrusionColor`, aplicado sobre `board`, `tablero`, `dice`, `documentViewer`, `carta` y `mazo` según el tipo). Un estilo inline tiene siempre prioridad sobre cualquier regla de una hoja de estilos, así que las reglas `.lifted`/`.dice.lifted`/`.carta--hex.lifted`/`.carta--triangle.lifted` (fix 00264) no podían cambiar `filter`/`box-shadow` mientras ese inline siguiera puesto — el componente se quedaba visualmente igual que en reposo al levantarlo. `beginDragLift(el, worldEl)` ahora guarda `el.style.filter`/`el.style.boxShadow` (si tienen algún valor) en `el.dataset.liftInlineFilter`/`el.dataset.liftInlineBoxShadow` y los vacía (`el.style.filter = ''`/`el.style.boxShadow = ''`) justo antes de añadir la clase `.lifted`, dejando que las reglas CSS tomen el control durante el arrastre. `endDragLift(el)` los restaura tal cual (y limpia el `dataset`) al quitar la clase. Solución genérica: no depende de conocer la extrusión de cada tipo concreto, cubre los 6 tipos que usan `beginDragLift`/`endDragLift` (`board`, `tablero`, `dice`, `documentViewer`, `carta`, `mazo`) sin lógica específica por tipo.
- [x] **`src/test/helpers.js` — nuevo helper `loadRealStylesheet()`.** `runner-page.html` no carga `styles/main.css` a propósito (la mayoría de tests no lo necesita); este helper lo inyecta bajo demanda vía un `<link>` idempotente, para los tests que sí verifican un aspecto visual computado (`getComputedStyle`).
- [x] **`src/test/functional/lift-shadow.test.js` — tests que reproducen la regresión y validan la corrección.** Casos: carta cuadrada (control, sigue usando `box-shadow`), carta circular (control, sigue usando `box-shadow`), carta triangular (usa `filter`, sigue la silueta — fix 00264), y el caso real de esta regresión: un `'dado'` con su `profundidad = 4` por defecto (extrusión activada), verificando que el `filter` computado al levantarlo es distinto del de reposo (antes del fix de 00265 quedaba fijo al de reposo).

## (d) Style changes

- **`design/docs/style/001-tokens-visual.md`**, sección "Elevation, shadow and transition": añadir una nota `[gotcha]` junto a la entrada de `.lifted` explicando que un componente con extrusión (`profundidad > 0`) fija su sombra de reposo como estilo inline, que `beginDragLift`/`endDragLift` retiran y restauran temporalmente para que las reglas de `.lifted` puedan tomar el control durante el arrastre — de lo contrario el inline bloquearía cualquier cambio de `filter`/`box-shadow` vía CSS, sea cual sea la regla.

## (e) Verification

- [x] Los 4 casos de `lift-shadow.test.js` pasan tras aplicar la corrección (carta cuadrada, carta circular, carta triangular, dado con extrusión). Antes de la corrección, únicamente fallaba el caso del dado con extrusión (verificado deliberadamente, dejando el bug reproducido antes de arreglarlo).
- [x] Batería completa (`npm run test:all`): 333/333 tests OK, sin regresiones en el resto de tipos/funcionalidades.
- [x] Verificación visual con Playwright en la app real: una carta triangular y un dado con extrusión por defecto (`profundidad: 4`), al arrastrarse en Modo Juego, muestran la sombra de "levantado" siguiendo su silueta real (capturas de pantalla revisadas manualmente) — ya no se quedan "planos" como con la regresión.
