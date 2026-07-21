- **Nombre**: Ajuste de texto a ancho en fichas no funciona en modo edición
- **Código**: 00045
- **Tipo**: fix

## Prompt original del usuario

en el modo edición, al añadir texto a una ficha, el texto no se ajusta al ancho. En el modo juego sí funciona bien, pero en el modo edición no.

## Descripción completa

Las fichas (piezas que se colocan sobre la mesa) pueden mostrar texto en su interior en lugar de una imagen o un color liso. Cuando el texto es más largo o el tamaño de la ficha es reducido, el texto debe ajustarse automáticamente para caber dentro de los límites de la ficha (reduciendo su tamaño hasta que quepa, sin desbordar el contorno de la ficha).

Este ajuste automático funciona correctamente en el modo juego: al colocar una ficha con texto sobre la mesa en ese modo, el texto siempre encaja dentro del ancho y alto disponibles de la ficha.

Sin embargo, en el modo edición (la mesa donde se colocan y configuran los componentes antes de jugar), al añadir o modificar el texto de una ficha, el texto no se ajusta al ancho disponible: puede desbordar visualmente los límites de la ficha en lugar de reducirse para caber dentro de ella.

Comportamiento esperado: el ajuste automático del texto a la caja de la ficha debe funcionar igual en modo edición que en modo juego, de forma que el resultado visual de una ficha con texto sea consistente entre ambos modos.

## Apuntes técnicos

- Ambos modos renderizan las fichas mediante la misma función compartida `renderComponentsOnTable` (`src/ui/componentRenderer.js`), que internamente usa `fitTextToBox` para reducir el tamaño de fuente del `span` de texto hasta que su `scrollWidth`/`scrollHeight` quepan en el ancho/alto disponibles de la ficha.
- La diferencia de invocación entre modos: `src/modes/edit/editMode.js` llama a `renderComponentsOnTable` con `identifyMode: 'label'`, `onSelect`, `onToggleSelect` y `onResize`; `src/modes/play/playMode.js` la llama con `identifyMode: 'tooltip'` y sin `onSelect`/`onResize`. La causa raíz concreta (por qué el ajuste no se aplica o se aplica mal solo cuando estos parámetros extra están presentes, o solo durante el redimensionado en vivo con el tirador de resize) queda pendiente de localizar en el análisis técnico de `ms-implement`.
- Candidato a revisar: el tirador de redimensionado (`attachResizeHandle`, usado solo en modo edición cuando el componente está seleccionado) actualiza `ficha.style.width/height` en vivo durante el arrastre sin volver a invocar `fitTextToBox`, por lo que el texto podría no reajustarse hasta soltar el ratón.
