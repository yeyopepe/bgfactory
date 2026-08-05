- **Nombre**: Nueva proporción de carta "Libre" con redimensionamiento libre
- **Código**: 00135
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

añade los tipos de cartas existentes una proporción llamada Libre: rectangular que permite redimensionamiento libre, sin ajustarse a ninguna proporción.

## Descripción completa

Se añade una nueva proporción de carta, "Libre", a la lista de proporciones ya disponibles (Poker vertical/horizontal, Tarot vertical/horizontal, Cuadrada, Circular, Hexagonal vertical/horizontal, Triángulo, Triángulo invertido) tanto en el editor de cartas como en la configuración del componente "Carta".

- Es una proporción **rectangular**, con el mismo aspecto (silueta, sombra, esquinas) que las demás proporciones rectangulares del catálogo (Poker, Tarot, Cuadrada), incluyendo la opción de esquinas redondeadas.
- Su diferencia respecto a todas las demás proporciones es que, al redimensionar la carta arrastrando su manejador de esquina sobre la mesa (en modo edición), el ancho y el alto pueden cambiar de forma completamente independiente — sin que ningún ratio fijo fuerce uno en función del otro, como sí ocurre con el resto de proporciones.
- Al diseñar las caras de una carta "Libre" en el editor de cartas, el lienzo de diseño arranca con la proporción por defecto del catálogo (vertical, relación 5:7) simplemente como punto de partida para colocar los elementos de cada cara. Esa proporción de partida no se vuelve a imponer después: una vez la carta está en la mesa, se puede redimensionar libremente sin restricción de ratio.
- El valor por defecto al crear una carta nueva no cambia: sigue siendo la proporción Poker vertical (5:7); "Libre" es una opción más que hay que elegir explícitamente.
- Las cartas ya existentes no se ven afectadas ni requieren ninguna migración: "Libre" es únicamente una opción nueva del catálogo, no sustituye ni reinterpreta ninguna proporción existente.

### Preguntas de alcance resueltas

- ¿Debe forzar algún ratio mínimo o el redimensionado es completamente libre en ambos ejes? → Completamente libre, mismo criterio que ya tiene hoy la proporción "Circular" al redimensionarse (solo respeta el tamaño mínimo general de una carta, sin forzar relación de aspecto).
- ¿Con qué proporción arranca el lienzo del editor de cartas al elegir "Libre", si no tiene una proporción propia? → Con la proporción por defecto del catálogo (5:7), solo como punto de partida de diseño.
- ¿Dónde aparece en el desplegable de selección? → Al final de la lista, tras "Triángulo invertido".
- ¿Necesita maqueta visual o diagrama de navegación? → No: es una opción más en un desplegable ya existente y un cambio de comportamiento en un redimensionado ya existente, sin ningún elemento visual nuevo que maquetar.

## Apuntes técnicos

- Catálogo de proporciones: `src/core/cardProportions.js` (`CARD_PROPORTIONS`), consumido por `ui/cardEditorModal.js` y `ui/componentModal.js` (desplegable "Proporción" en ambos) y por `ui/componentRenderer.js` (renderizado y redimensionado en mesa).
- `isRectShape(value)` ya devuelve `true` para `shape: 'rect'`, por lo que una entrada de catálogo con `shape: 'rect'` ya activa sin cambios adicionales el checkbox "Esquinas redondeadas" y el resto de estilos rectangulares (`getCartaShapeCss`).
- El redimensionado sin ratio fijo ya existe como caso especial en `ui/componentRenderer.js`, función `clampCartaSize`: hoy solo aplica a `props.proporcion === 'circular'` (que ignora `getProporcionRatio` y sólo respeta `MIN_CARTA_WIDTH`/`MIN_CARTA_HEIGHT`). Añadir `'libre'` a esa misma condición reproduce el comportamiento pedido sin tocar `ui/resizeHandle.js` (ya soporta ejes libres, `axis: 'both'` sin bloqueo de aspecto).
- `getDesignSize(proporcionValue)` (`core/cardProportions.js`) calcula el lienzo de diseño a partir de `getProporcionRatio(value)`; como esa función ya devuelve el ratio de `DEFAULT_PROPORTION` ('5:7') para cualquier `value` no encontrado en el catálogo, una entrada de catálogo para `'libre'` con `ratio: 5/7` (mismo valor que '5:7') es la vía más simple de darle un lienzo de diseño por defecto sin lógica adicional.
- Ninguna incongruencia detectada entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código real durante este análisis.
