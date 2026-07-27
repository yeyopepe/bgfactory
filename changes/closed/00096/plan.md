## (a) Anotaciones funcionales

- Fuera de alcance: cualquier proporción no hexagonal (rectangulares, cuadrada, circular) — su borde ya funciona correctamente y no se toca. Tampoco se toca `imageAdjustModal.js` (la "máscara de ajuste de imagen" que menciona STYLE_BIBLE.md sección 13 para el recorte hexagonal): no dibuja borde, solo recorta la vista previa de la imagen al ajustarla, así que no forma parte de este bug.
- No ha habido dudas de alcance que resolver con el usuario: el bug y el comportamiento esperado ya quedaban claros en la captura y en `description.md`.

## (b) Solución técnica

Causa raíz (confirmada en `description.md`): para las proporciones hexagonales, el borde se pinta hoy con la propiedad CSS `border` (que dibuja siempre paralela a la caja rectangular del elemento) sobre un elemento después recortado con `clip-path` en forma de hexágono — el recorte corta ese borde rectangular en ángulo, dando un resultado desigual en vez de un contorno de grosor uniforme siguiendo las seis aristas.

Como las dos proporciones hexagonales están definidas con un `ratio` (`src/core/cardProportions.js:12-13`) que fuerza siempre un hexágono regular (nunca deformado), la solución es geométrica y exacta: en vez de un `border` CSS, usar **dos capas con `clip-path` anidados** — una capa exterior rellena del color de borde y recortada con el hexágono completo, y una capa interior (con el contenido: imagen y cuadros de texto) recortada con un hexágono más pequeño, concéntrico, escalado desde el centro para que el hueco entre ambos sea el borde de grosor uniforme pedido.

Para un hexágono regular, desplazar sus seis aristas hacia dentro una distancia constante `t` (el grosor de borde en px) produce otro hexágono regular concéntrico, cuyos vértices son los del hexágono original escalados desde el centro por un factor `s`:
- `hex-vertical` (vértices arriba/abajo, lados planos izquierda/derecha): la apotema es `width/2`, así que `s = 1 - (2 * bordeGrosor / width)`.
- `hex-horizontal` (vértices izquierda/derecha, lados planos arriba/abajo): la apotema es `height/2`, así que `s = 1 - (2 * bordeGrosor / height)`.

Y cada vértice `(x%, y%)` del polígono original se transforma en `(50 + s*(x-50))%, (50 + s*(y-50))%` (escalado desde el centro `50%,50%`, en porcentaje, válido porque el escalado es proporcional en cada eje).

Tareas:

1. **`src/core/cardProportions.js`** — añadir una función exportada, p. ej. `getHexInnerClipPath(proporcionValue, width, height, bordeGrosorPx)`:
   - Busca el `shape` en `CARD_PROPORTIONS` a partir de `proporcionValue`; si no es `'hex-vertical'`/`'hex-horizontal'`, o `bordeGrosorPx <= 0`, devuelve `null` (no aplica esta técnica).
   - Si aplica, calcula `s` según la fórmula de arriba usando `width`/`height` en píxeles reales (los del canvas del editor, o los de la carta renderizada en la mesa — cada llamada pasa los suyos), parsea los puntos del `polygon(...)` ya existente en `HEX_CLIP_PATHS[shape]`, y devuelve el nuevo `polygon(...)` con los puntos escalados.
   - No toca `getCartaShapeCss` ni `HEX_CLIP_PATHS` existentes — son el hexágono "exterior", que se sigue usando tal cual.

2. **`src/ui/componentRenderer.js`** (rama `component.type === 'carta'`, alrededor de la línea 914-945) — solo para el caso hexagonal con borde activo:
   - Si `isHexCarta` y `(cara?.bordeGrosor ?? 0) > 0`: en vez de poner `cartaContent.style.border`, poner `cartaContent.style.backgroundColor = cara.bordeColor || '#000000'` (la capa exterior recortada con el hexágono completo hace de "anillo" de borde) y quitar el `border` CSS (`cartaContent.style.border = 'none'`). Crear un nuevo div (p. ej. `cartaInner`), `position: absolute; inset: 0; box-sizing: border-box; overflow: hidden`, con `clip-path` = el resultado de `getHexInnerClipPath(props.proporcion, width, height, cara.bordeGrosor)`, `backgroundColor: '#ffffff'`, y añadirlo dentro de `cartaContent`. La imagen (`img`) y los `textBox` que hoy se añaden directamente a `cartaContent` pasan a añadirse a `cartaInner` en este caso.
   - Si no es hexagonal, o es hexagonal sin borde (`bordeGrosor` 0), el comportamiento no cambia: se mantiene exactamente el código actual (`cartaContent.style.border`, imagen/texto añadidos directamente a `cartaContent`).

3. **`src/ui/cardEditorModal.js`** (función `renderFace`, líneas ~177-205 y los dos listeners de `borderColorInput`/`borderWidthInput`, líneas ~249-269) — mismo patrón que el punto 2, adaptado a que aquí `canvas` es a la vez el elemento recortado y el que hoy recibe la imagen/cuadros de texto directamente:
   - Extraer la lógica de "aplicar borde" (hoy repetida tres veces: creación inicial + los dos listeners) a una función local `applyCanvasBorder()` dentro de `renderFace`, que decide entre:
     - Hexagonal con `bordeGrosor > 0`: `canvas.style.border = 'none'`, `canvas.style.backgroundColor = cara.bordeColor || '#000000'`, y actualiza el `clip-path` del div interior (`canvasInner`, creado una vez junto al `canvas`) con `getHexInnerClipPath(...)`.
     - Resto de casos (no hexagonal, o hexagonal sin borde): `canvas.style.backgroundColor = ''`, `canvas.style.border` como hasta ahora, y `canvasInner.style.clipPath = 'none'` (el interior ocupa toda la caja, sin recorte adicional).
   - Crear `canvasInner` (mismo `position: absolute; inset: 0; box-sizing: border-box; overflow: hidden`) una única vez en `renderFace`, añadido dentro de `canvas`, y mover ahí el `appendChild` de `faceImg` y de cada `renderTextBox(...)` (hoy se añaden a `canvas` directamente) — así el contenido queda siempre dentro del hueco correcto tanto si hay borde hexagonal como si no.
   - Llamar a `applyCanvasBorder()` una vez al crear el canvas, y desde ambos listeners (`borderColorInput`/`borderWidthInput`) en vez de la línea suelta de `canvas.style.border` que tienen hoy.

No hace falta tocar `src/styles/main.css` (`.carta--hex` sigue igual: solo afecta a la sombra, no al borde) ni `imageAdjustModal.js`.

## (d) Cambios en estilo

Actualizar `design/docs/stylebible/STYLE_BIBLE.md`, sección 13, párrafo "**Recorte hexagonal de "Carta" (cambio 00089)**" (línea ~257): añadir que, a partir de este fix (00096), el **borde** de las caras hexagonales ya no usa la propiedad CSS `border` (que no puede seguir una silueta no rectangular), sino dos capas con `clip-path` anidados — una capa exterior rellena del color de borde recortada con el hexágono completo, y una interior con el contenido, recortada con un hexágono concéntrico más pequeño (`getHexInnerClipPath` en `core/cardProportions.js`), calculado explotando que el `ratio` de estas dos proporciones siempre produce un hexágono regular. Dejar claro que esta técnica es específica del borde de estas dos proporciones y no sustituye el uso de `clip-path` ya documentado para el recorte de la silueta en sí.
