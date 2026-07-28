- **Nombre**: Editor de cartas más grande (ventana y lienzos de cara)
- **Código**: 00100
- **Tipo**: change

## Prompt original del usuario

También quiero que, en la ventana del editor cartas, los espacios de diseño de cada cara sean mayores. Puedes hacer esa ventana más grande y agrandar también ambas caras.

## Descripción completa

La ventana del editor de cartas (donde se diseña el contenido de la cara frontal y trasera de una carta: imagen de fondo y cuadros de texto) se hace más grande, y dentro de ella el espacio de diseño de cada una de las dos caras también aumenta de tamaño, para trabajar con más precisión y comodidad al colocar/ajustar imagen y cuadros de texto.

Se mantiene todo el comportamiento actual del editor (mismas acciones, mismos controles, misma proporción de carta configurada por cara) — solo cambia el tamaño en el que se ve y se trabaja. En pantallas pequeñas la ventana sigue ajustándose para no desbordar el navegador (con scroll si el contenido no cabe en alto), solo que ahora con un tamaño máximo mayor que el actual.

**Preguntas de alcance resueltas**:
- Magnitud del aumento: se propuso pasar el ancho máximo de la ventana de ~1100px/90% del ancho de pantalla a ~1500px/95%, y el tamaño máximo del lienzo de cada cara de ~260px a ~380px de lado mayor (manteniendo siempre la proporción configurada de la carta). El usuario pidió ver primero una maqueta antes de confirmar la magnitud exacta.

## Apuntes técnicos

- Puntos de código relevantes: `src/ui/cardEditorModal.js` (constante `CANVAS_MAX_SIDE = 260`, línea 13, usada para calcular `previewScale` y el tamaño de cada lienzo — línea ~164) y `src/styles/main.css` (`.card-editor-modal`, línea 1053, `max-width: min(1100px, 90vw)`).
- Cambio puramente de tamaño/CSS y de la constante `CANVAS_MAX_SIDE`; no toca el modelo de datos (`TextBox`, `caraFrontal`/`caraTrasera`) ni ninguna otra lógica del editor.
- Coexiste sin conflicto con el cambio 00099 (alineación y márgenes de cuadro de texto, mismo modal/lienzo) — ese cambio sigue viéndose y funcionando igual, solo que en un lienzo más grande.
