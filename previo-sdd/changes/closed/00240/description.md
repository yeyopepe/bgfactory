- **Name**: Maximizar el editor visual solo ampliaba la ventana en altura, no en anchura
- **Code**: 00240
- **Type**: fast
- **Creation date**: 2026-09-03

## Full description

Regresión introducida por el fix 00237. Tras aquel cambio, al pulsar el botón **"Maximizar"** en el editor visual (tanto de cartas como de tableros personalizados), la ventana del editor solo se agranda **en altura**: ocupa casi todo el alto de la pantalla pero conserva un ancho pequeño, con mucho espacio a los lados. El redimensionado manual con los manejadores de esquina sí funciona bien en todos los casos.

Comportamiento esperado: al maximizar, la ventana del editor debe ocupar casi toda la pantalla **en ancho y en alto** (~90% de cada dimensión), y el lienzo escalar para aprovechar ese hueco como ya hace con el redimensionado manual.

## Applied changes

- `src/styles/main.css` — regla `.card-editor-modal--maximized`: se añade `width: 90vw` (antes solo tenía `max-width: 90vw`, `height: 90vh`, `max-height: 90vh`). La modal hereda `width: fit-content` de `.card-editor-modal`; un `max-width` solo acota, no fuerza el ancho, así que la ventana quedaba al ancho de su contenido mientras que el `height: 90vh` sí fijaba el alto — de ahí que maximizar solo ampliara en altura. Con `width: 90vw` la ventana crece también en ancho y `getEditorWorkArea()` mide un hueco interior real grande en las dos dimensiones. Comentario del bloque actualizado.
- El fix 00237 dejó de funcionar visualmente en anchura porque quitó el techo `CANVAS_MAX_SIDE * 3` que, indirectamente, empujaba el ancho de la modal `fit-content` hasta ~1140 px; sin ese empuje quedó al descubierto que la clase `--maximized` nunca fijaba `width`.
