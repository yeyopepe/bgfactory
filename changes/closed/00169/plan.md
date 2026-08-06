- **Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

- Fuera de alcance: no se toca la lógica de carga/filtrado de imágenes (`renderGallery`), ni el comportamiento de búsqueda, ni la paginación (no existe y no se añade). Solo tamaños.
- Sin dudas técnicas pendientes con el usuario: los tamaños de referencia (modal `max-width: min(900px, 90vw)`, miniatura ~140x140px) ya se acordaron en `description.md` durante `ms-new` y se mantienen como valores finales, ajustados al patrón real del proyecto (ver (b)).

## (b) Solución técnica

1. **`src/ui/boardImageModal.js`** (línea 22): cambiar `modal.className = 'modal';` por `modal.className = 'modal board-image-modal';`. Sigue el patrón BEM ya usado por el propio bloque (`.board-image-modal__*` ya existe para la galería) y el patrón de "modal ancha" documentado en STYLE_BIBLE 12.4 (clase de bloque propia añadida a `modal.className`, nunca `style` inline).

2. **`src/styles/main.css`**: añadir la regla de ancho de la nueva clase de bloque, agrupada junto al resto de excepciones anchas (junto a `.card-editor-modal`, `.image-adjust-modal--large`, `.resource-modal--image`, no junto al resto de reglas `.board-image-modal__*`):
   ```css
   .board-image-modal {
     max-width: min(900px, 90vw);
   }
   ```
   No hace falta tocar `width` ni `max-height`: `.modal` base ya aporta `width: 90%` y `max-height: 80vh` con scroll interno vía `.modal__content { overflow-y: auto }`, y ese comportamiento (ventana más ancha, altura acotada con scroll si no caben todas las imágenes) es exactamente el pedido.

3. **`src/styles/main.css`**, bloque `.board-image-modal__gallery` (hoy `grid-template-columns: repeat(auto-fill, minmax(96px, 1fr))`): subir el mínimo de columna a `minmax(160px, 1fr)` para que cada celda tenga hueco alrededor de la miniatura ampliada, manteniendo el mismo `gap: 0.75rem`.

4. **`src/styles/main.css`**, bloque `.board-image-modal__thumb` (hoy `width: 80px; height: 80px;`): subir a `width: 140px; height: 140px;`, manteniendo `object-fit: cover` y `border-radius: var(--radius-sm)`.

5. No se requiere ningún otro cambio: `.board-image-modal__name` usa `word-break: break-word` sin `line-clamp`, así que el nombre se ajustará solo al nuevo ancho de celda sin romperse. `.board-image-modal__item` (padding, borde) no necesita tocarse — su tamaño ya se adapta al contenido interno (flex column).

Verificación manual tras implementar: abrir el selector desde los tres puntos de entrada (fondo "Imagen" de tablero simple, imagen de carta, imagen de tablero personalizado) y comprobar visualmente que la ventana y las miniaturas se ven notablemente más grandes, que el grid se recoloca según el ancho disponible, y que con muchas imágenes sigue apareciendo el scroll vertical dentro del modal sin desbordar la pantalla.

## (d) Cambios en estilo

Actualizar `design/docs/stylebible/STYLE_BIBLE.md` sección 12.4 ("Modales anchas — excepción a `max-width: 500px`"): añadir `.board-image-modal` a la lista de ejemplos existentes de ese patrón, junto a `.card-editor-modal`, `.image-adjust-modal--large`, `.element-selection-modal`, `.import-report-modal` y `.resource-modal--image`, con su valor (`max-width: min(900px, 90vw)`) y una referencia al cambio 00169.
