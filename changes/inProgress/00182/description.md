- **Nombre**: Miniaturas del contenido del mazo respetan proporción y forma real de cada carta
- **Código**: 00182
- **Tipo**: change
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

en la ventana que muestra el contenido del mazo, la vista previa de cada carta debería mantener la proporción porque ahora, independientemente del tamaño/proporción de la carta, las muestra todas iguales

## Descripción completa

En la ventana "Contenido del mazo" (accesible tanto desde el menú contextual de un mazo en modo juego como desde su pestaña de propiedades en modo edición), cada carta del mazo se lista con una miniatura de su cara frontal, su identificador y un botón "Sacar".

Hoy todas las miniaturas se muestran con el mismo tamaño y la misma forma rectangular, sin importar la proporción o silueta real de la carta que representan (vertical, horizontal, cuadrada, circular, hexagonal, triangular, etc.). Esto hace que una carta con una proporción distinta a la habitual se vea recortada o deformada dentro de una miniatura que no corresponde a su forma.

Con este cambio, la miniatura de cada carta debe reflejar fielmente su proporción y su forma real:

- Cada miniatura se ajusta dentro de un tamaño máximo (el actual) según la proporción real de esa carta, sin recortar ni deformar el contenido. Una carta con la proporción más habitual sigue viéndose igual que ahora; una carta cuadrada o muy ancha se ve más pequeña dentro de ese mismo espacio máximo; una carta muy alta y estrecha también se ajusta dentro de ese límite.
- Si la carta tiene una silueta no rectangular (circular, hexagonal, triangular), la miniatura también refleja esa silueta, igual que ya ocurre cuando esa misma carta se ve sobre la mesa de juego o en su editor.
- El resto de la fila (identificador, botón "Sacar", disposición de la lista) no cambia.
- Un mazo sin cartas sigue mostrando el mismo mensaje de "mazo vacío" que hoy, sin miniaturas.

### Preguntas de alcance resueltas con el usuario

1. **¿Cómo debe calcularse el tamaño de cada miniatura?** Caja contenedora: se define un tamaño máximo (el actual) y cada miniatura se ajusta dentro de ese máximo según su proporción real, sin recortar el contenido — igual que un "ajustar sin recortar". Confirmado.
2. **¿Debe la miniatura reflejar también la silueta real de la carta (círculo, hexágono, triángulo), o solo corregir la relación ancho/alto manteniendo siempre un rectángulo?** Debe reflejar también la silueta real, no solo la proporción del rectángulo. Confirmado.

## Apuntes técnicos

- Miniatura implementada en `ui/mazoContentModal.js` (modal "Contenido del mazo"), contenedor `.mazo-contenido__thumb` en `src/styles/main.css` (hoy tamaño fijo `42×58px`, `THUMB_WIDTH`/`THUMB_HEIGHT` en el propio `mazoContentModal.js`).
- El contenido interno ya se pinta con `paintCartaFace` (`ui/componentRenderer.js`), que acepta `renderScaleX`/`renderScaleY` — hoy `mazoContentModal.js` solo calcula un `renderScale` a partir del ancho (`THUMB_WIDTH / carta.width`), ignorando la altura real de la carta.
- Catálogo de proporciones y forma de carta ya existe en `core/cardProportions.js`: `CARD_PROPORTIONS` (ratio ancho/alto y `shape` de cada proporción), `getProporcionRatio`, `getCartaShapeCss` (border-radius/clip-path según forma), `getHexInnerClipPath`/`getTriangleInnerClipPath` (recorte del borde en siluetas hexagonales/triangulares). Ya se usa en el renderizado de la carta sobre la mesa y en `ui/visualEditorModal.js` — no existe hoy en `ui/mazoContentModal.js`.
- No se ha detectado ninguna incongruencia entre `design/docs/architecture/` / `design/docs/style/` y el código real durante el análisis.
