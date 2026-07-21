## (a) Anotaciones funcionales

Sin dudas pendientes con el usuario. Queda fuera de alcance cualquier otra mejora del editor de ajuste de imagen (p.ej. límites de zoom, UI del modal) — el fix se limita estrictamente a que el arrastre funcione en ambos ejes de forma consistente con el zoom aplicado.

## (b) Solución técnica

**Causa raíz.** En [src/ui/imageAdjustModal.js](../../../src/ui/imageAdjustModal.js), `applyImageAdjustStyle` combina `object-fit: cover` + `object-position: {posX}% {posY}%` sobre un `<img>` de tamaño fijo `width:100%; height:100%` (igual al contenedor), y aplica el zoom aparte con `transform: scale(zoom/100)`.

- `object-fit: cover` + `object-position` deciden, en el momento de pintar la imagen dentro de esa caja de tamaño fijo, qué parte de la imagen original se recorta — y ese recorte solo tiene margen real en el eje donde la imagen (al cubrir la caja) sobra respecto a su relación de aspecto. Si la imagen es más ancha que alta en relación al marco, ese margen existe en horizontal pero no en vertical (la altura ya encaja exacta) — de ahí que el arrastre horizontal "funcione" y el vertical no, incluso sin zoom.
- El `transform: scale()` posterior amplía visualmente toda la caja ya pintada (incluido su recorte ya fijado), centrado — no vuelve a ejecutar el cálculo de `object-fit`, así que no genera margen de recorte nuevo en el eje que no lo tenía. Por eso aplicar zoom no soluciona el problema: el zoom es una lupa sobre el contenido ya recortado, no aumenta la cantidad de imagen disponible para desplazar.

**Fix.** Sustituir el mecanismo de zoom+posición para que el propio tamaño de la caja de la imagen crezca con el zoom (en vez de solo recortar internamente vía `object-position` y ampliar visualmente después), y usar el desbordamiento real de esa caja frente al marco para desplazarla en ambos ejes vía `top`/`left`, **combinado** con `object-position` variable (no fijo):

1. En `applyImageAdjustStyle(imgEl, adjustment)` (imageAdjustModal.js):
   - Mantener `object-fit: cover` con `object-position: {posX}% {posY}%` **variable** (no fijo a 50%/50%) — sigue haciendo falta para recorrer el margen que el propio `cover` genera cuando la proporción de la imagen no coincide con la del marco (ese margen solo existe en el eje que sobra tras encajar el otro). Fijarlo a un valor constante deja ese margen descartado para siempre sin importar cuánto se mueva la caja después: fue precisamente el bug de la primera iteración de este fix, detectado al probar con una imagen de proporción muy distinta a la del marco (p.ej. muy panorámica dentro de una ficha cuadrada) — el eje sin margen propio de `object-fit` quedaba inalcanzable por mucho zoom que se aplicara, aunque el otro eje (con margen propio de `cover`) sí funcionara, dando la sensación de "casi llega al borde pero no del todo" en ese eje.
   - Fijar `imgEl.style.width` e `imgEl.style.height` a `${zoom}%` (en vez de `100%` fijo + `transform: scale`), de modo que la caja de la imagen crezca proporcionalmente en ambos ejes con el zoom.
   - Eliminar el `transform: scale(...)` actual (ya no hace falta).
   - Calcular `top`/`left` en porcentaje a partir de `posX`/`posY` y el desbordamiento resultante (`zoom - 100`), de forma que en ambos ejes se pueda recorrer TAMBIÉN el margen que la caja sobresale del marco por el zoom, sumándose al margen propio de `object-position`:
     - `left = -((posX / 100) * (zoom - 100))%`
     - `top = -((posY / 100) * (zoom - 100))%`
   - Con `zoom = 100` no hay margen por esta vía (comportamiento esperado: sin zoom no hay desplazamiento adicional más allá del que ya diera `object-position` por el propio recorte de `cover`); a partir de `zoom > 100` ambos ejes ganan margen adicional real y proporcional, sea cual sea la proporción de la imagen.
   - Verificado con Playwright (imagen de prueba panorámica con colores distintos en cada esquina, dentro de una ficha cuadrada): las 4 esquinas del recorte final son alcanzables por arrastre tanto en el modal de ajuste como en el renderizado final de la ficha.
2. El marco que contiene la imagen debe recortar visualmente lo que sobresalga de la caja ampliada:
   - En el modal (`.image-adjust-modal__mask`, src/styles/main.css línea ~748) ya tiene `overflow: hidden` — no requiere cambio.
   - En el renderizado final de la ficha (`ui/componentRenderer.js`, bloque `fondoTipo === 'imagen'` ~línea 817-831), el contenedor `ficha` no tiene `overflow: hidden` — añadirlo (no hacía falta antes porque la imagen nunca excedía el 100% de su caja; ahora sí, hasta el 300% con el zoom máximo).
3. `handleMouseMove` en imageAdjustModal.js no necesita cambios: ya calcula `posX`/`posY` de forma simétrica entre ejes; el problema estaba en cómo se traducían esos valores a estilo visual, no en el cálculo del arrastre.

No hace falta tocar `zoomInput` (min/max ya definidos 100–300) ni el resto del modal.

## (c) Cambios de arquitectura

No aplica: es un ajuste interno de una función de renderizado ya existente (`applyImageAdjustStyle`), no cambia la arquitectura por capas ni el modelo de datos.
