- **Name**: Textura discontinua en la cabecera de modo edición
- **Code**: 00287
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

Regresión introducida por el cambio 00283 (mismo día): en modo edición, la cabecera mostraba dos franjas visualmente separadas en vez de una sola tira continua — la del título, con la nueva trama de rayas diagonales, y justo debajo la de "Importar"/"Exportar", con fondo liso sin trama. Además, al crecer la altura de la franja del título para acomodar el nuevo indicador de modo debajo del título, la separación entre esa franja y los botones "Importar"/"Exportar" se hizo más perceptible.

Debía verse todo (título + Importar/Exportar) como una sola franja continua, con la misma trama en toda su superficie.

## Applied changes

- `src/test/functional/top-controls.test.js` — nuevo caso `FT-039-08` (carga la hoja de estilos real con `loadRealStylesheet()`, monta modo edición, comprueba que tanto `h1#app-title` como `.edit-toolbar` tienen `background-image` distinto de `'none'`). Verificado que falla contra el CSS previo a este fix (revertido temporalmente `.edit-toolbar`'s `background-image` para confirmarlo) y pasa con el fix aplicado.
- `src/styles/main.css` — `.edit-toolbar` (la franja de "Importar"/"Exportar", solo visible en modo edición) tenía `background: var(--bg-toolbar)` (color plano), mientras que `h1.app-title-bar--edit` (añadido por 00283) superpone una trama de rayas diagonales sobre su degradado. Antes de 00283 ambas franjas ya eran visualmente distintas (degradado vs. color plano) pero la diferencia pasaba desapercibida al ser ambas oscuras y lisas; la nueva trama solo en una de las dos hizo evidente la costura. Se añadió la misma trama (`background-image: repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 8px)`) a `.edit-toolbar`, manteniendo su `background-color: var(--bg-toolbar)` de base — mismo criterio que `h1.app-title-bar--edit`. Verificado visualmente (captura de pantalla real en Chromium): ambas franjas se ven ahora como una sola tira continua. `npm run test:all` → 402/402 tests pasando, build check OK.
- La mayor altura de la franja del título no se modificó: es un efecto esperado de acomodar el indicador de modo en dos líneas (parte de 00283, no un bug en sí) — el problema real reportado era la discontinuidad visual de la trama, ya corregida; una vez corregida, ambas franjas leen como una única tira coherente pese a la mayor altura.
