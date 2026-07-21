- **Nombre**: Arrastre vertical no funciona en el ajuste de imagen de ficha
- **Código**: 00046
- **Tipo**: fix

## Prompt original del usuario

en la ventana para ajustar la imagen de fondo de la ficha, solo me deja mover la imagen horizontalmente, no verticalmente aunque haya aplicado zoom.

## Descripción completa

En la ventana modal donde se ajusta la imagen de fondo de una ficha (posición y zoom), al arrastrar la imagen con el ratón para reposicionarla dentro del marco, el movimiento solo responde cuando se arrastra en horizontal. Al arrastrar en vertical, la imagen no se desplaza, y esto ocurre incluso después de aplicar zoom (acercar la imagen), cuando cabría esperar que hubiera margen de sobra para moverla también verticalmente.

Comportamiento esperado: al arrastrar dentro del marco de ajuste, la imagen debe poder reposicionarse tanto en horizontal como en vertical, respondiendo al movimiento del ratón en ambos ejes de la misma forma en que ya lo hace correctamente en el eje horizontal.

## Apuntes técnicos

- Modal implementado en [src/ui/imageAdjustModal.js](../../../src/ui/imageAdjustModal.js), función `openImageAdjustModal`.
- El arrastre se gestiona en `handleMouseMove` (líneas ~82-88): calcula `dxPercent`/`dyPercent` de forma simétrica a partir de `maskWidth`/`maskHeight` y actualiza `posX`/`posY` vía `clamp(..., 0, 100)`. La lógica JS en sí parece simétrica entre ejes, por lo que la causa probablemente esté en cómo se renderiza la imagen (CSS) más que en el cálculo del arrastre.
- El posicionamiento visual lo aplica `applyImageAdjustStyle` (líneas 15-20), combinando `object-fit: cover` + `object-position: {posX}% {posY}%` + `transform: scale(zoom/100)` sobre un `<img>` con `position: absolute; width: 100%; height: 100%` dentro de `.image-adjust-modal__mask` (`overflow: hidden`), definido en [src/styles/main.css](../../../src/styles/main.css) líneas 748-761.
- Sospecha a revisar: con `object-fit: cover`, según la relación de aspecto de la imagen original frente a la del marco (`mask`), el recorte puede producirse solo en un eje (p.ej. si la imagen es más ancha que el marco, el recorte —y por tanto el margen para desplazar— se da en horizontal, dejando la imagen ya ajustada exactamente en altura). Habría que confirmar si el `transform: scale()` aplicado por el zoom genera correctamente margen de desplazamiento en el eje que antes no lo tenía, para descartar que el problema esté en el orden/composición de `object-fit`+`object-position`+`transform`, o si el zoom no se está teniendo en cuenta como se espera en algún punto de este renderizado.
- La misma función `applyImageAdjustStyle` se reutiliza en `ui/componentRenderer.js` para el renderizado final de la ficha — cualquier cambio en la fórmula de posicionamiento debe mantener el mismo resultado visual en ambos sitios.
