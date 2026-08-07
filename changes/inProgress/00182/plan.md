- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. No se modifica el modelo de datos, la persistencia, el resto de vistas de carta (mesa, editor visual) ni la disposición general de la fila (`.mazo-contenido__item`: id + botón "Sacar" siguen igual). No se añade recorte/borde propio de la carta (`getHexInnerClipPath`/`getTriangleInnerClipPath`) a la miniatura — esas funciones sirven para el borde de color propio de la carta, y esta miniatura solo usa un borde neutro decorativo de "slot", que se omite en las formas no rectangulares en vez de intentar dibujarlo (ver tarea 1).

**Dudas resueltas con el usuario:** ya recogidas en `description.md` (estrategia "caja contenedora" tipo `object-fit: contain`, y reflejar también la silueta real cuando no es rectangular). Ninguna duda técnica adicional: el análisis confirma que basta con las dimensiones reales del componente (`carta.width`/`carta.height`) y las utilidades ya existentes en `core/cardProportions.js`, sin necesidad de decisiones de diseño nuevas.

## (b) Solución técnica

1. **`src/ui/mazoContentModal.js` — sustituir el tamaño/forma fijos de cada miniatura por un ajuste dentro de un máximo, según la carta real.**
   - Importar `getCartaShapeCss` de `../core/cardProportions.js` (junto al import ya existente de `paintCartaFace`/`formatComponentIdentifier`).
   - Renombrar las constantes `THUMB_WIDTH`/`THUMB_HEIGHT` a `THUMB_MAX_WIDTH`/`THUMB_MAX_HEIGHT` (mismos valores, `42`/`58`) — pasan a ser el límite máximo, no el tamaño fijo.
   - En el bucle que crea cada `thumb` (dentro de `renderBody`), sustituir el cálculo actual (`renderScale = THUMB_WIDTH / (carta.width || THUMB_WIDTH)`) por:
     ```js
     const cartaWidth = carta.width || THUMB_MAX_WIDTH;
     const cartaHeight = carta.height || THUMB_MAX_HEIGHT;
     const renderScale = Math.min(THUMB_MAX_WIDTH / cartaWidth, THUMB_MAX_HEIGHT / cartaHeight);
     const thumbWidth = cartaWidth * renderScale;
     const thumbHeight = cartaHeight * renderScale;
     ```
     Usa las dimensiones reales del componente (`carta.width`/`carta.height`), no `getProporcionRatio(props.proporcion)` — para `proporcion` `'circular'`/`'libre'` el ancho/alto real puede no coincidir con el ratio nominal (ver `clampCartaSize` en `ui/componentRenderer.js`), y son las dimensiones reales las que hay que respetar aquí, igual que ya hace hoy el cálculo de `renderScale` por ancho.
   - Antes de `paintCartaFace`, aplicar tamaño y forma al `thumb`:
     ```js
     thumb.style.width = `${thumbWidth}px`;
     thumb.style.height = `${thumbHeight}px`;
     const { borderRadius, clipPath } = getCartaShapeCss(carta.properties?.proporcion, carta.properties?.esquinasRedondeadas);
     thumb.style.borderRadius = borderRadius;
     thumb.style.clipPath = clipPath;
     thumb.style.border = clipPath === 'none' ? '1px solid var(--border-neutral)' : 'none';
     ```
     Motivo del `border` condicional: `border` CSS sigue correctamente `border-radius` (rectángulo/circular), pero no sigue `clip-path` (hexagonal/triangular) — pintaría un borde rectangular roto sobre una silueta no rectangular. Se omite en esas dos formas en vez de intentar el borde de grosor uniforme (`getHexInnerClipPath`/`getTriangleInnerClipPath`), que es una técnica pensada para el borde de color propio de la carta, no para este borde neutro decorativo — coherente con que hoy tampoco se pinta el borde propio de la carta en esta miniatura.
   - Sustituir la llamada existente `paintCartaFace(thumb, carta.properties?.caraFrontal, renderScale, THUMB_WIDTH, THUMB_HEIGHT)` por `paintCartaFace(thumb, carta.properties?.caraFrontal, renderScale, thumbWidth, thumbHeight)`. Un único `renderScale` uniforme basta (no hace falta `renderScaleX`/`renderScaleY` distintos): al construirse `thumbWidth`/`thumbHeight` con el mismo `renderScale` a partir de `cartaWidth`/`cartaHeight`, el contenedor ya tiene exactamente el ratio real de la carta — caso distinto al de `'tableroPersonalizado'`, que sí permite redimensionarse a cualquier proporción independiente de su contenido.
   - Actualizar el comentario de cabecera de esa sección del bucle (línea `// Diseño guardado en píxeles reales: encaja el ancho real de la carta en la miniatura de tamaño fijo.`) para reflejar que ahora la miniatura entera (ancho y alto) se ajusta a la carta real, no solo el ancho.

2. **`src/styles/main.css` — quitar de `.mazo-contenido__thumb` lo que pasa a fijarse por JS.** Eliminar `width: 42px;`, `height: 58px;`, `border-radius: var(--radius-sm);` y `border: 1px solid var(--border-neutral);` de esa regla (pasan a establecerse inline por item, tarea 1). Mantener `position: relative`, `flex: 0 0 auto`, `overflow: hidden` y `background: #ffffff`. Actualizar el comentario de `mazoContentModal.js` que hoy dice "mismo tamaño fijo que `.mazo-contenido__thumb` en `main.css`" (cabecera del fichero, línea con `THUMB_WIDTH`/`THUMB_HEIGHT`) para reflejar que ese valor es ahora el máximo, no el tamaño fijo — ver tarea 1.

## (d) Cambios en estilo

- `design/docs/style/INDEX.md`: añadir una subsección nueva (mismo patrón que "Mazo reutiliza la clase `.carta`" y "Forma circular de Mazo") documentando que la miniatura de carta de la modal "Contenido del mazo" (`ui/mazoContentModal.js`, `.mazo-contenido__thumb`) reutiliza `getCartaShapeCss` (`core/cardProportions.js`) para ajustar forma/proporción a la carta real dentro de un máximo (`THUMB_MAX_WIDTH`/`THUMB_MAX_HEIGHT`, 42×58), y que el borde neutro decorativo del slot se omite en las formas recortadas por `clip-path` (hexagonal/triangular) porque `border` no sigue esa silueta — a diferencia de la carta real sobre la mesa, esta miniatura no simula un borde de grosor uniforme propio en esos casos.

## (e) Verificación

1. Abrir "Contenido del mazo" de un mazo con cartas de proporciones distintas (5:7, cuadrada, circular, hexagonal) y comprobar que cada miniatura muestra la proporción y silueta real de su carta, sin recortar ni deformar el contenido interior.
2. Una carta con la proporción por defecto (5:7) se sigue viendo con el mismo tamaño que antes (42×58), sin cambio visual perceptible.
3. Una carta circular u hexagonal se ve con esa forma en la miniatura (círculo/hexágono), no como un rectángulo.
4. Las filas de la lista siguen alineadas correctamente (miniatura, id y botón "Sacar" centrados verticalmente entre sí), incluso cuando la miniatura es más pequeña que el máximo.
5. Un mazo sin cartas sigue mostrando el mensaje "Este mazo no tiene cartas." sin ninguna miniatura.
6. Comprobar el resultado desde los dos puntos de entrada de la modal: menú contextual del mazo en modo juego, y pestaña del mazo en modo edición.
