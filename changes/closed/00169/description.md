- **Nombre**: Ampliar tamaño de la ventana y miniaturas del selector de imagen de fondo
- **Código**: 00169
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

cuando elijo una imagen de fondo para las cartas o los tableros personalizados, hay una ventana con una vista previa de todas las imágenes disponibles, pero se ven muy pequeñas. Esa ventana debería ser más grande y las vistas previas también

## Descripción completa

Al elegir una imagen de fondo (tanto para cartas, como para tableros personalizados y tableros simples), se abre una ventana con una galería de vistas previas de todas las imágenes disponibles. Actualmente tanto la ventana como cada vista previa individual se muestran muy pequeñas, lo que dificulta distinguir unas imágenes de otras antes de elegir.

Se pide agrandar esa ventana y hacer que las vistas previas de cada imagen también sean más grandes, de forma que resulte más cómodo identificar visualmente la imagen deseada antes de seleccionarla.

Este selector es el mismo en los tres contextos donde aparece (fondo de tablero simple, imagen de cada cara de una carta, imagen de tablero personalizado), así que el cambio de tamaño aplica por igual a los tres sin necesidad de diferenciarlos.

### Preguntas de alcance resueltas

- **¿Aplica el cambio a los tres contextos donde aparece este selector (tablero simple, cartas, tableros personalizados) o solo a alguno?** Aplica a los tres por igual, ya que comparten la misma ventana.
- **¿Hay algún límite en la cantidad de imágenes que se pueden mostrar a la vez (paginación, carga progresiva) que se vea afectado al agrandar las vistas previas?** No. Todas las imágenes disponibles se muestran de golpe; al agrandar las vistas previas la ventana simplemente crecerá en altura y aparecerá antes el scroll vertical que ya existe hoy.
- **¿Sustituye o entra en conflicto con alguna funcionalidad existente?** No, es un ajuste de tamaño/estilo puro sobre la ventana ya existente.
- **¿Implica guardar algún dato nuevo o restringir el acceso según rol?** No.

## Apuntes técnicos

- Componente único y compartido: `src/ui/boardImageModal.js`, función `openBoardImageModal(...)`. Se invoca desde `ui/componentModal.js` (fondo "Imagen" de tablero simple) y desde `ui/visualEditorModal.js` (imagen por cara de carta — 2 caras —, e imagen de tablero personalizado — 1 cara —).
- Tamaño actual de la ventana: usa la clase genérica `.modal` de `src/styles/main.css` (líneas ~330-339): `max-width: 500px`, `width: 90%`, `max-height: 80vh`. `.modal__content` (línea ~373) añade `padding: 1.5rem` y `overflow-y: auto`.
- Tamaño actual de las miniaturas: bloque `.board-image-modal__gallery` / `.board-image-modal__thumb` en `src/styles/main.css` (líneas ~1142-1213). Grid `repeat(auto-fill, minmax(96px, 1fr))`; miniatura `width: 80px; height: 80px; object-fit: cover`.
- No hay paginación ni carga diferida: `renderGallery(list)` pinta todas las imágenes filtradas de una vez. El único límite de facto es el scroll vertical del `.modal__content`.
- Patrón ya establecido en el proyecto para ventanas anchas (STYLE_BIBLE.md sección 12.4, "Modales anchas — excepción a `max-width: 500px`"): añadir una clase de bloque propia con su propio `max-width` (nunca `style` inline). Ejemplos existentes: `.card-editor-modal` (`width: fit-content; max-width: min(1500px, 95vw)`, con variante `--maximized`), `.image-adjust-modal--large`, `.element-selection-modal` (`max-width: 640px`), `.import-report-modal` (`max-width: 640px`).
- Propuesta de tamaños acordada con el usuario como punto de partida para `ms-how`: ventana `max-width: min(900px, 90vw)` manteniendo `max-height: 80vh`; miniatura ~140x140px con grid `minmax(160px, 1fr)`.
- Sin incongruencias entre `ARCHITECTURE.md` / `STYLE_BIBLE.md` y el código real para este componente.
