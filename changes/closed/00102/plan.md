## (a) Anotaciones funcionales

- Fuera de alcance: no cambia el comportamiento de los controles Zoom/Transparencia, ni el arrastre de la imagen, ni la lógica de guardado (`onAccept`) — solo el tamaño del marco de la ventana y de las cajas de previsualización.
- Preguntas ya resueltas con el usuario en `description.md` (paso `ms-new`): tamaño del marco = mismo patrón que "Editor de cartas"; las cajas de previsualización también crecen; el agrandamiento aplica a todos los usos de esta ventana compartida.

## (b) Solución técnica

1. **`src/styles/main.css`** — añadir una clase modificadora de bloque propia siguiendo el patrón ya documentado de "modales anchas" (sección 12.4 de la biblia de estilo, mismo criterio que `.card-editor-modal`): `.image-adjust-modal--large { width: fit-content; max-width: min(1500px, 95vw); }`, colocada junto al bloque de `.card-editor-modal` (~línea 1052). Se reutiliza el mismo tope que el editor de cartas (1500px/95vw) para que ambas ventanas queden a igual tamaño máximo, tal como pide el cambio. El `max-height: 80vh` se mantiene heredado de `.modal`, sin tocar.
2. **`src/ui/imageAdjustModal.js` línea 55** — cambiar `modal.className = 'modal';` por `modal.className = 'modal image-adjust-modal--large';`, para que la ventana adopte el nuevo tamaño en todos los contextos donde se abre (hoy el único punto de llamada activo es `ui/cardEditorModal.js`, pero el cambio se aplica al componente compartido, no a ese caller).
3. **`src/ui/imageAdjustModal.js` línea 25** — subir la constante `PREVIEW_MAX_SIDE` de `220` a `390`. Esta constante ya gobierna de forma centralizada el cálculo de `maskWidth`/`maskHeight` (líneas 95-98) y todo el resto de la lógica (paneo/drag en `handleMouseMove`, líneas 169-176) deriva sus porcentajes de esas mismas variables, así que no hace falta tocar nada más para que el arrastre siga funcionando proporcionalmente a la caja más grande.
4. **Verificación manual** — abrir el editor de cartas (`ui/cardEditorModal.js`) y pulsar "Ajustar imagen…" en una cara: comprobar que la ventana se ve más ancha (similar al editor de cartas), que las cajas Frontal/Trasera crecen, que el arrastre y el zoom siguen funcionando correctamente sobre la caja más grande, y que en pantallas estrechas el modal sigue respetando el `95vw` sin desbordar horizontalmente.

## (d) Cambios en estilo

- Actualizar la sección **12.4 "Modales anchas (excepción a `max-width: 500px`)"** de `STYLE_BIBLE.md` para añadir `.image-adjust-modal--large` al catálogo (ventana de ajuste de imagen de una o dos caras; mismo criterio `width: fit-content` + tope que `.card-editor-modal`, por compartir el mismo motivo: el contenido son cajas de previsualización cuyo ancho combinado varía según cuántas caras se muestren).
- Aprovechar esa misma edición para corregir una incongruencia detectada en esa sección: el texto actual describe `.card-editor-modal` con `max-width: min(1100px, 90vw)`, pero el código real en `main.css` (línea 1055) usa `max-width: min(1500px, 95vw)` desde hace tiempo. El código manda: al editar la sección, actualizar también esa cifra para `.card-editor-modal` a los valores reales (1500px/95vw).
