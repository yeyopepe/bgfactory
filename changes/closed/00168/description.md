- **Nombre**: Vista previa ampliada con zoom y pan en la modal de edición de recurso Imagen
- **Código**: 00168
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

cuando le doy a editar un recurso tipo imagen, aparece esta ventana con una vista previa. Pero es muy pequeña: quiero esta ventana más grande y poder hacer zoom y mover la imagen para verla en detalle

## Descripción completa

Al editar un recurso de tipo Imagen desde el panel "Recursos" (modo edición), se abre una ventana con el nombre del recurso y una "Vista previa" de la imagen. Hoy esa ventana es pequeña y la vista previa solo muestra la imagen entera reducida, sin forma de inspeccionar el detalle.

Se pide agrandar esta ventana y permitir, dentro de la propia "Vista previa", hacer zoom y mover (pan) la imagen para poder verla en detalle.

### Alcance acordado

- **Tamaño de ventana**: la ventana de edición de un recurso Imagen se muestra notablemente más grande que hoy, con más espacio dedicado a la vista previa. Solo afecta a la ventana de recursos de tipo Imagen — la de Tipografía no cambia.
- **Zoom**: se controla con la rueda del ratón sobre la vista previa (el zoom se centra en el punto donde está el cursor), y además hay un par de botones visibles (`+`/`-`) y un botón para restablecer la vista a su tamaño inicial.
- **Mover la imagen (pan)**: con la imagen ampliada, se puede arrastrar haciendo click y manteniendo pulsado sobre ella para desplazarla dentro del marco de vista previa.
- **La imagen se puede ampliar aunque sea más pequeña que el marco de vista previa** — el zoom no depende del tamaño original de la imagen.
- **El zoom y la posición son solo para inspección visual, no se guardan**: cada vez que se abre esta ventana, o se sube una imagen nueva con "Cambiar imagen...", la vista vuelve a su estado inicial (sin zoom, centrada).
- **No cambia nada más de esta ventana**: el campo "Nombre del recurso", el botón "Cambiar imagen...", ni los botones "Eliminar"/"Cancelar"/"Aceptar cambios" cambian de comportamiento.
- **No afecta a quién puede usarlo**: sigue siendo accesible solo desde el panel "Recursos" en modo edición, igual que hoy.
- **No tiene relación con el ajuste de imagen de un componente** (la ventana donde se recorta/posiciona la imagen de fondo de una carta o tablero): esa función ya existente no se toca ni se ve afectada por este cambio.

## Apuntes técnicos

- El código a modificar es `ui/resourceModal.js` → `renderImageContent()` (crea `.resource-modal__image-preview` con un `<img>` dentro) y sus estilos en `src/styles/main.css` (`.resource-modal__image-preview`, líneas ~2403-2423), más una nueva clase de modal ancha análoga a `.image-adjust-modal--large` (línea ~1415, `width: fit-content; max-width: min(1500px, 95vw)`), ya que `.modal` genérica tiene `max-width: 500px` fijo.
- Patrones ya existentes reutilizables como referencia de implementación (no copia literal):
  - `ui/table.js` (zoom con rueda de ratón centrado en el cursor, sobre un lienzo con `transform: translate(...) scale(...)`).
  - `ui/imageAdjustModal.js` (arrastre con listeners `mousedown`/`mousemove`/`mouseup` en `document`, mismo patrón de drag; también tiene su propio slider de zoom con inputs de texto sincronizados).
- A diferencia de `ui/imageAdjustModal.js`, aquí el zoom/posición no se persiste en ningún lado (ni en el recurso ni en `core/state.js`) — es puramente una ayuda de inspección visual transitoria.
- No se han detectado incongruencias entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código real durante este análisis.
