- **Name**: Botón "Baraja francesa" del picker aparece azul por defecto en vez de solo en hover
- **Code**: 00270
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

En el modal "Añadir componente" (picker de componentes), el item de acción inmediata "Baraja francesa estándar (54 cartas)" (sección "Conjuntos pre-definidos", introducida en el cambio 00236) aparece con fondo y borde azules **de forma permanente**, incluso sin interactuar con él.

El resto de items del picker (los tipos de componente individuales) solo muestran el acento azul (borde y icono) al pasar el ratón por encima (hover). El comportamiento esperado es que el item de "Baraja francesa" sea consistente con ellos: sin acento azul en su estado normal, y con el acento azul (fondo y borde) únicamente al pasar el ratón por encima.

## Technical notes

- El estilo del item vive en `src/styles/main.css`, regla `.component-type-modal__preset-item` (~línea 1797): actualmente aplica `background: var(--accent-blue-light)` y `border: 1.5px solid var(--accent-blue)` como estado por defecto (no en `:hover`), mientras que `.component-type-modal__item` (items normales) solo aplica su acento en `.component-type-modal__item:hover` (~línea 1737).
- La regla `.component-type-modal__preset-item:hover` (~línea 1809) ya define el estado hover (`background: var(--accent-blue-alpha-15)`, `border-color: var(--accent-blue-dark)`); solo hay que mover el acento azul del estado por defecto al estado `:hover`, replicando el patrón de `.component-type-modal__item`.
- Cambio puramente de estilo (CSS), un único archivo, sin alterar estructura HTML, JS, flujo ni datos.

## Applied changes

- `src/styles/main.css`, regla `.component-type-modal__preset-item` (~línea 1797): el fondo (`background`) y el borde de acento (`border-color`/`border`) dejan de aplicarse en el estado por defecto y pasan a aplicarse solo en `.component-type-modal__preset-item:hover` (~línea 1809), replicando el patrón hover-only de `.component-type-modal__item`. Estado por defecto ahora: `background: transparent` y `border: 1.5px solid var(--border-neutral)`. Estado hover: `background: var(--accent-blue-light)` y `border-color: var(--accent-blue)`.
- No se tocó el icono, título, tags ni chevron del item (siguen en azul de forma permanente, como distinción visual intencional del item de acción inmediata) ya que el reporte del usuario se refería específicamente al fondo/borde del botón, no a esos elementos.
- Verificado con `npm run test:all`: 388/388 tests OK.
