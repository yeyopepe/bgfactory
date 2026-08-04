- **Nombre**: Ajustes visuales del mazo
- **Código**: fast-ajustes-visuales-del-mazo_20260801
- **Tipo**: fast
- **Fecha**: 2026-08-01

## Prompt original del usuario

Ajustes y pequeños cambios:
- Al mover una o varias cartas y meterlas en el mazo, las cartas que estoy moviendo siempre deben aparecer por encima de otros elementos, incluido el mazo.
- en todos los modos debe aparecer encima del mazo una etiqueta con el número de cartas que tiene ("x cartas")
- en el modo de juego, al colocar el cursos encima del mazo, debe aparecer una tooltip: "pulsa para sacar la primera carta"

## Descripción completa

Tres retoques sobre el componente "Mazo" (cambio 00106), ya implementado:

1. **Arrastre siempre por encima**: al arrastrar una carta (sola o como parte de una selección múltiple en modo edición), la carta arrastrada — y el resto de la selección que se mueve con ella — pasan a verse por encima de cualquier otro elemento de la mesa, incluido un mazo con el que se solapen, durante todo el arrastre. Antes esto solo pasaba en modo juego (donde ya existía el efecto de "levantar" al arrastrar); ahora también se ve en modo edición, sin añadir ningún efecto de sombra nuevo allí.
2. **Etiqueta de número de cartas**: la caja de un mazo muestra siempre, justo encima, una pequeña etiqueta con el número de cartas que contiene ("N cartas") — visible de forma permanente en los dos modos, no solo al pasar el ratón o seleccionarlo.
3. **Tooltip de ayuda en modo juego**: al dejar el cursor sobre un mazo en modo juego aparece el tooltip nativo "Pulsa para sacar la primera carta.", explicando la interacción de click sin necesidad de abrir el menú contextual.

## Cambios aplicados

- `src/ui/componentRenderer.js`:
  - Rama `component.type === 'mazo'` de `renderComponentsOnTable`: sustituido el `title` condicionado a `mostrarTooltip` por uno fijo ("Pulsa para sacar la primera carta.") cuando `identifyMode === 'tooltip'` (modo juego); añadida una etiqueta `.mazo-count-label` con `${cartaIds.length} cartas`, siempre presente (no ligada a `identifyMode`/hover/selección).
  - Rama `component.type === 'carta'`, listener `mousedown` del arrastre: además de calcular `blockDragTargets`, ahora hace `worldEl.appendChild` de cada target y de la propia carta al empezar a arrastrar, con independencia de `liftOnDrag` (que sigue siendo el único que añade la clase `.lifted`, exclusiva de modo juego).
- `src/styles/main.css`: nueva clase `.mazo-count-label` (mismo aspecto que `.component-id-label` — fondo `var(--accent-blue-dark)`, texto `var(--text-light)`, `font-size: 0.72rem` — anclada encima de la caja del mazo en vez de en su esquina interior, `pointer-events: none`).
