**Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

- Fuera de alcance: no se adapta el arrastre con ratón (paneo) para que se sienta "natural" respecto al ángulo de rotación actual — sigue interpretando el movimiento de pantalla en X/Y exactamente igual que hoy (`handleMouseMove` en `imageAdjustModal.js`), sin rotar ese vector según el giro aplicado. Con la imagen girada, arrastrar puede no moverse en la dirección que visualmente se espera; no se ha pedido explícitamente y se deja fuera de este cambio — se podría abordar aparte si se detecta que hace falta.
- Decisión técnica tomada durante este análisis (no requería confirmación del usuario, es puramente de implementación): `applyImageAdjustStyle` no puede seguir siendo puramente porcentual para soportar giros de 90º/270º sin conocer el tamaño real en píxeles del marco a cubrir (ver razonamiento en (b)) — pasa a recibir `boxWidth`/`boxHeight` como nuevos parámetros, lo que obliga a tocar todos sus puntos de llamada.
- Confirmado: los puntos donde el objeto `ajusteImagen` se clona o se copia (`core/fichaMigration.js`, `core/styleClipboard.js`, `ui/componentModal.js` — `cloneFace`/`cloneCartaProperties`) lo hacen siempre con spread (`{ ...face.ajusteImagen }` o `{ ...properties.caraFrontal.ajusteImagen }`), así que el nuevo campo `rotation` viaja automáticamente con ellos sin tocar ese código.

## (b) Solución técnica

1. **`src/ui/imageAdjustModal.js` — `applyImageAdjustStyle(imgEl, adjustment, boxWidth, boxHeight)`** (cambio de firma, añade `boxWidth`/`boxHeight`): hoy calcula `width`/`height`/`left`/`top` en porcentaje del contenedor, lo que funciona porque el `<img>` tiene el mismo ratio que su contenedor (mismo `zoom%` en ambos ejes). Para girar 90º/270º sin dejar huecos, la imagen debe cubrir un marco "virtual" con ancho/alto intercambiados respecto al marco real — y una imagen no puede expresar "mi ancho es un % del alto del contenedor" en CSS puro, así que hace falta el tamaño real en píxeles para calcularlo a mano:
   - `rotated90 = rotation === 90 || rotation === 270`.
   - `coverWidth = rotated90 ? boxHeight : boxWidth`, `coverHeight = rotated90 ? boxWidth : boxHeight` (marco virtual: el tamaño que la imagen debe cubrir *antes* de rotar, para que al rotar 90º su huella visual vuelva a coincidir exactamente con `boxWidth`×`boxHeight`).
   - `widthPx = coverWidth * zoom / 100`, `heightPx = coverHeight * zoom / 100` (mismo criterio de zoom que hoy, ahora en píxeles y sobre el marco virtual).
   - Offset para centrar el marco virtual dentro del contenedor real: `frameLeft = (boxWidth - coverWidth) / 2`, `frameTop = (boxHeight - coverHeight) / 2`.
   - Paneo dentro del marco virtual, mismo cálculo que hoy pero en píxeles: `panLeft = -(posX / 100) * (zoom - 100) / 100 * coverWidth`, `panTop = -(posY / 100) * (zoom - 100) / 100 * coverHeight`.
   - `leftPx = frameLeft + panLeft`, `topPx = frameTop + panTop`.
   - Rotar siempre alrededor del **centro del contenedor real** (no del centro propio de la imagen, que se desplaza con el paneo): `transform: rotate(${rotation}deg)` con `transform-origin` puesto explícitamente en el punto del contenedor expresado en coordenadas locales de la imagen: `transform-origin: ${boxWidth / 2 - leftPx}px ${boxHeight / 2 - topPx}px`. Así el giro no desplaza la imagen aunque el paneo/zoom ya la hubiera descentrado.
   - Con `rotation = 0`, todo lo anterior se reduce exactamente al comportamiento actual (mismo resultado, solo expresado en píxeles en vez de en `%`).
   - Verificar visualmente los 4 ángulos combinados con zoom/paneo extremos durante la implementación — es una combinatoria nueva sin cobertura de test existente.
2. **`src/ui/imageAdjustModal.js` — resto del editor:**
   - `state[key]` añade `rotation: entry.adjustment?.rotation ?? 0`.
   - Nuevo botón "90º" (icono de rotación + texto, sin la palabra "Girar" — ver `description.md`): al pulsarlo, `state[focusedKey].rotation = (state[focusedKey].rotation + 90) % 360` y `updatePreview(focusedKey)`. Sin estado deshabilitado (igual que Zoom/Transparencia).
   - Ubicación en `stagesRow`: si hay dos `entries` (caso cartas), insertarlo entre el primer y el segundo stage; si hay uno solo, añadirlo justo después de ese único stage. Centrado verticalmente respecto a la altura del stage (`align-items: center` en un contenedor con la misma altura que `.image-adjust-modal__mask`).
   - `updatePreview(key)` pasa ahora `maskSizes[key].maskWidth`/`maskSizes[key].maskHeight` (ya calculados) como `boxWidth`/`boxHeight` a `applyImageAdjustStyle`.
   - `onAccept`: incluir `rotation: state[entry.key].rotation` en cada resultado, tanto en la rama `faces` como en la rama de un único `adjustment` (`{ ...state.__single__ }` ya lo incluye automáticamente al ser spread completo).
3. **`src/ui/cardEditorModal.js`:**
   - Llamada a `applyImageAdjustStyle(faceImg, cara.ajusteImagen)` (~línea 688) → añadir `canvasWidth, canvasHeight` (ya en scope en ese punto) como nuevos argumentos.
   - Llamada a `applyImageAdjustStyle(shapeImg, shape.ajusteImagen)` (~línea 995, dentro de `renderShape`) → añadir `shape.width * previewScale, shape.height * previewScale` (mismos valores ya usados para dimensionar `el.style.width/height` unas líneas antes).
   - Callback `onAccept` de `openImageAdjustModal` (~líneas 493-505): añadir `rotation: adjustments.caraFrontal.rotation` y `rotation: adjustments.caraTrasera.rotation` al construir `working.caraFrontal.ajusteImagen`/`working.caraTrasera.ajusteImagen` (hoy solo copian `zoom`/`posX`/`posY` explícitamente, así que hay que añadir el campo a mano en vez de depender de un spread).
4. **`src/ui/cardShapeModal.js`:** ninguna modificación necesaria — `working.ajusteImagen = adjustment;` (línea 299) ya asigna el objeto completo devuelto por el modal (incluido `rotation`), y la llamada a `openImageAdjustModal` (single-entry) no necesita más cambios.
5. **`src/ui/componentRenderer.js`:**
   - `paintCartaFace(contentParent, cara, renderScale)` → nueva firma `paintCartaFace(contentParent, cara, renderScale, faceWidth, faceHeight)`; internamente pasa `faceWidth, faceHeight` a `applyImageAdjustStyle`.
     - Call site ~línea 1297 (`carta` en `renderComponentsOnTable`): pasar `width, height` (ya calculados unas líneas antes como tamaño real de la carta).
     - Call site ~línea 1481 (dorso de `mazo`): pasar `width, height` (tamaño real del mazo, ya calculado).
     - Call site `ui/mazoContentModal.js:73` (miniatura `thumb`): el contenedor `.mazo-contenido__thumb` tiene tamaño fijo por CSS (`width: 42px; height: 58px`, línea ~927 de `main.css`) — añadir una constante `THUMB_HEIGHT = 58` junto a la ya existente `THUMB_WIDTH = 42` y pasar `THUMB_WIDTH, THUMB_HEIGHT`.
   - `paintShape` (~línea 316): pasar `shape.width * renderScale, shape.height * renderScale` (ya calculados para `shapeEl.style.width/height` unas líneas antes) a `applyImageAdjustStyle`.
6. Ningún cambio en `core/state.js`, `core/component.js` ni en el formato de export/import: `rotation` es un campo más dentro de `properties.*.ajusteImagen`, con el mismo criterio de compatibilidad que otros campos opcionales (ausencia = comportamiento por defecto, aquí 0º).
