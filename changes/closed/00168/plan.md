**Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

**Fuera de alcance:**
- No se persiste zoom/posición en ningún sitio (ni en el recurso ni en `core/state.js`) — es una ayuda de inspección puramente transitoria, tal y como quedó acordado en `description.md`.
- No se toca `ui/imageAdjustModal.js` ni su lógica de recorte/encaje de imagen sobre la forma de un componente — es un mecanismo distinto, sin relación funcional con este cambio.
- No se clampea el arrastre (pan) a los límites del marco: se puede desplazar la imagen libremente dentro del marco de vista previa, igual que el pan sin límites que ya tiene la mesa infinita (`ui/table.js`) — mismo criterio ya usado en la app para paneo libre, sin inventar un límite nuevo no pedido.

**Dudas resueltas con el usuario (durante `ms-new`):**
- Mecanismo de zoom → rueda del ratón (centrado en el cursor) + botones `+`/`-` + botón "Restablecer".
- Tamaño de modal → ancho fijo grande, altura acotada (no pantalla completa).

## (b) Solución técnica

1. **`ui/resourceModal.js` — `openResourceModal`**: cuando `isImage` es `true`, añadir una clase adicional al elemento `modal` (p. ej. `resource-modal--image`, junto a la ya existente `modal`) para que solo la ventana de recurso Imagen adopte el ancho ampliado — la de Tipografía no cambia.

2. **`ui/resourceModal.js` — `renderImageContent`**: sustituir el `<img>` suelto dentro de `.resource-modal__image-preview` por la estructura necesaria para zoom/pan, manteniendo el resto de la función igual (campo nombre, botón "Cambiar imagen..."):
   - El contenedor `.resource-modal__image-preview` pasa a tener una altura fija mayor (p. ej. `420px`, frente al `max-height: 180px` actual de la imagen) y `overflow: hidden` + `position: relative`, ya que ahora la imagen puede desbordar el marco al hacer zoom.
   - Dentro, el `<img>` (`previewImg`) se sigue ajustando al marco a zoom 1 igual que hoy (`max-width: 100%`, `max-height: 100%`, marco centrado con flex), pero además recibe un `transform: translate(offsetX px, offsetY px) scale(zoom)` con `transform-origin: center center`, donde `zoom`/`offsetX`/`offsetY` son variables de estado local a la modal (cierre de la función, no en `core/state.js`, mismo patrón que el estado transitorio de `ui/imageAdjustModal.js`).
   - Estado inicial: `zoom = 1`, `offsetX = 0`, `offsetY = 0` (imagen ajustada y centrada, igual que el aspecto actual).
   - Función `updateTransform()` que aplica el `transform` al `<img>` y actualiza el indicador de zoom (ver más abajo) — se llama tras cualquier cambio de `zoom`/`offsetX`/`offsetY`.

3. **Zoom con rueda del ratón**: listener `wheel` sobre `.resource-modal__image-preview` (con `e.preventDefault()` para que la página no haga scroll). Reutiliza la misma técnica de "zoom centrado en el cursor" que ya usa `ui/table.js` (líneas ~74-87: nuevo zoom clampeado, `zoomRatio = newZoom / oldZoom`, y el offset se recalcula para que el punto bajo el cursor no se desplace), adaptada a que aquí el origen de transformación es el centro del marco (no la esquina superior izquierda como en la mesa): la posición del cursor se expresa relativa al centro de `.resource-modal__image-preview` antes de aplicar la fórmula. Rango de zoom: `[1, 5]` (100%–500%), factor por "tick" de rueda `1.15` (mismo orden de magnitud que el `0.9`/`1.1` de `ui/table.js`). Si el resultado clampea exactamente a `zoom = 1`, resetear también `offsetX`/`offsetY` a `0` (evita que quede un offset residual sin zoom aplicado, ya que a zoom 1 la imagen debe quedar siempre centrada).

4. **Botones `+`/`-`**: mismo cálculo que la rueda pero con el cursor virtual en el centro del marco (`mouseX = 0, mouseY = 0` relativo al centro) y un factor fijo (p. ej. `1.2`) por click, mismo clamp `[1, 5]` y mismo snap a `offset = 0` al llegar a `zoom = 1`.

5. **Botón "Restablecer"**: fija `zoom = 1`, `offsetX = 0`, `offsetY = 0` y llama a `updateTransform()` — vuelve exactamente al estado inicial.

6. **Arrastre (pan)**: listener `mousedown` sobre el `<img>` que solo inicia el arrastre si `zoom > 1` (si `zoom === 1` no hace nada, ya que la imagen ya ocupa su tamaño ajustado sin margen que recorrer). Mismo patrón de listeners en `document` que ya usa `ui/imageAdjustModal.js` (`beginDrag`/`handleMouseMove`/`handleMouseUp`, mousedown local + mousemove/mouseup en `document` para no perder el arrastre si el cursor sale del marco): guarda `offsetX`/`offsetY` de partida y el punto de inicio del ratón, y en cada `mousemove` suma el delta directamente (sin conversión a porcentaje, a diferencia de `imageAdjustModal`, porque aquí el offset ya está en píxeles de pantalla). Al soltar (`mouseup`), quita los listeners de `document` (mismo cuidado que `imageAdjustModal` para no dejarlos colgados si la modal se cierra a mitad de arrastre — también hay que quitarlos en el cierre de la modal, ver punto 9).

7. **Cursor**: `.resource-modal__image-preview img` con `cursor: default` mientras `zoom === 1`, y `cursor: grab` cuando `zoom > 1` (clase `resource-modal__image-preview__img--zoomed`, alternada en `updateTransform()`); `cursor: grabbing` mientras el arrastre está activo (misma clase o una segunda, aplicada en `beginDrag`/quitada en `handleMouseUp`).

8. **Indicador de nivel de zoom y controles overlay**: dentro de `.resource-modal__image-preview`, además del `<img>`:
   - Un indicador de texto (p. ej. `.resource-modal__zoom-level`, esquina inferior izquierda) con el porcentaje actual (`Math.round(zoom * 100)}%`), actualizado en `updateTransform()`.
   - Un grupo de 3 botones icono-solo (`+`, `-`, restablecer) superpuesto en la esquina superior derecha del marco. **Decisión de estilo**: no reutilizar `.align-group`/`.align-group__btn` (STYLE_BIBLE sección 12.10) porque ese patrón está pensado para opciones seleccionables con estado `active` sobre fondo de formulario — aquí son 3 acciones momentáneas (no hay "opción activa") superpuestas sobre una imagen de contenido arbitrario, que necesita contraste garantizado independientemente del color de la imagen de debajo. Se sigue en su lugar el lenguaje visual ya usado por las insignias permanentes de `ui/componentRenderer.js` (STYLE_BIBLE 12.3: círculo/cuadrado sobre `rgba(0,0,0,.55)`, icono en `var(--text-light)`) para overlays sobre contenido visual variable: nueva clase `.resource-modal__zoom-btn` (cuadrado `32px`, `border-radius: var(--radius-sm)`, fondo `rgba(0,0,0,.55)`, icono SVG `stroke="currentColor"` en `var(--text-light)`, hover `rgba(0,0,0,.72)`), con `title`/`aria-label` descriptivo en cada botón (sección 9, botón icono-solo). Iconos: lupa `+`/`-` y flecha circular de refresco (mismo SVG que ya usa `ui/imageAdjustModal.js` para su botón "90º" como referencia de estilo de trazo, sin reutilizar ese icono en concreto).
   - Debajo del marco, un texto de ayuda breve (mismo tratamiento que cualquier texto secundario de la app, `color: var(--text-muted); font-size: 0.75rem`): "Rueda del ratón para hacer zoom · arrastrar para mover la imagen".

9. **Reinicio del estado al cambiar de imagen o cerrar la modal**: en el handler `change` del `fileInput` (que ya sustituye `previewImg.src`), añadir la llamada a la misma función de reinicio que usa el botón "Restablecer" (`zoom = 1; offsetX = 0; offsetY = 0; updateTransform()`), para que la imagen nueva se vea siempre completa y centrada. Al cerrar la modal (botones "Cancelar"/"Aceptar cambios"/click fuera, o Eliminar), asegurarse de quitar cualquier listener de `document` que pudiera seguir activo por un arrastre en curso — mismo cuidado que ya tiene `ui/imageAdjustModal.js` en sus propios `cancelBtn`/`acceptBtn`.

10. **`src/styles/main.css`**: añadir las clases nuevas descritas arriba (`.resource-modal--image`, ajustes a `.resource-modal__image-preview`, `.resource-modal__image-preview__img--zoomed`, `.resource-modal__zoom-level`, `.resource-modal__zoom-controls`, `.resource-modal__zoom-btn`, `.resource-modal__hint`), cerca de las reglas ya existentes de `.resource-modal__image-preview` (líneas ~2403-2423). `.resource-modal--image` sigue el mismo criterio que `.image-adjust-modal--large` (línea ~1415): `width: fit-content; max-width: min(800px, 95vw);` en vez del `max-width: 500px` fijo de `.modal` genérica.

La maqueta `design_modal-recurso-imagen-zoom-pan.html` se usa solo como referencia del aspecto final (tamaño relativo del marco, posición de los controles, texto de ayuda) — el marcado/CSS de la maqueta no se reutiliza literalmente, la implementación real sigue la estructura de `ui/resourceModal.js` descrita arriba.

## (d) Cambios en estilo

Añadir a `STYLE_BIBLE.md` una entrada breve junto a la sección 12.3 (insignias permanentes sobre contenido visual) o como nueva subsección 12.12, documentando el patrón `.resource-modal__zoom-btn` como variante de "botón icono-solo superpuesto sobre contenido de imagen arbitrario" (fondo `rgba(0,0,0,.55)`, icono `var(--text-light)`, `32px`), distinguiéndolo explícitamente de `.align-group` (sección 12.10, pensado para opciones seleccionables sobre fondo de formulario, no para overlays sobre imagen) — para que cualquier control futuro superpuesto sobre una imagen (no solo indicadores pasivos como candado/oculto, sino botones de acción) reutilice este mismo criterio en vez de crear uno ad-hoc.
