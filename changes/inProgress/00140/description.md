- **Nombre**: Girar imagen 90º en el editor de ajuste de imagen
- **Código**: 00140
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

en el editor de imágenes, al ajusta la imagen, añade un botón que permite girar la imagen 90º cada vez que se pulse

## Descripción completa

En el editor de "Ajustar imagen" (la ventana donde se recorta/posiciona/escala la imagen de fondo de un componente — cartas, fichas, tableros, etc.), se añade un botón para girar la imagen 90 grados. Cada vez que se pulsa, la imagen rota 90º más respecto a como estaba, siguiendo el ciclo 0º → 90º → 180º → 270º → 0º (sentido horario), sin límite de pulsaciones.

El botón muestra solo el símbolo de rotación y el texto "90º" (sin la palabra "Girar"). Se ubica en la zona central de la ventana, entre las dos previsualizaciones de imagen (frontal y trasera), centrado verticalmente respecto a su altura — no forma parte de la fila de controles de Zoom/Transparencia. Cuando el editor solo tiene una imagen que ajustar (no dos caras), el botón se coloca junto a esa única previsualización, también centrado verticalmente respecto a ella. Se puede pulsar en cualquier momento mientras haya una imagen cargada; si no hay ninguna imagen seleccionada en ese momento, no tiene efecto visible (igual que ya pasa hoy con Zoom o Transparencia sin imagen).

Al pulsarlo, la imagen mostrada en la vista previa gira inmediatamente — no hace falta pulsar "Aceptar" para verlo, igual que el resto de ajustes de este editor.

**Caso de cartas (dos caras).** El editor de cartas permite ajustar la cara frontal y la trasera por separado, cada una con su propio zoom/posición. El botón de girar sigue esa misma lógica: solo afecta a la cara que se esté editando en ese momento (la que está resaltada/enfocada), no a ambas a la vez. Para girar la otra cara, primero hay que seleccionarla como ya se hace hoy para ajustar su zoom o posición.

**Relación con el resto de ajustes.** Girar la imagen no toca ni reinicia el zoom ni la posición ya ajustados — conviven de forma independiente. Se puede girar antes o después de ajustar zoom/posición, en cualquier orden, y el resultado combina ambos.

**Guardado y visualización.** El giro elegido queda guardado junto con el resto del ajuste de esa imagen (zoom, posición, transparencia), y se aplica de forma consistente en todos los sitios donde esa imagen se muestra: en la propia vista previa del editor, en la mesa del modo edición y en la mesa del modo juego. Los componentes guardados antes de este cambio, que no tienen ningún giro definido, se comportan como si no estuvieran girados (0º).

**Quién puede usarlo.** El botón está disponible para cualquier persona que pueda abrir este editor de ajuste de imagen, que hoy solo es accesible desde el modo edición — no cambia nada respecto a quién puede acceder al editor en sí.

### Preguntas de alcance resueltas con el usuario

- **Ubicación del botón**: en la zona central de la ventana, entre las dos previsualizaciones de imagen (frontal/trasera), centrado verticalmente respecto a ellas — no en la fila de Zoom.
- **Texto del botón**: solo el símbolo de rotación + "90º" (sin la palabra "Girar").
- **Alcance en cartas (dos caras)**: el botón gira solo la cara actualmente enfocada, igual que ya hacen hoy Zoom y Transparencia.
- **Relación con zoom/posición**: independiente, no resetea nada al girar.

## Apuntes técnicos

- Editor genérico en `src/ui/imageAdjustModal.js` (`openImageAdjustModal`, `applyImageAdjustStyle`), reutilizado por `src/ui/cardEditorModal.js` (cartas, dos `faces`: `caraFrontal`/`caraTrasera`) y `src/ui/cardShapeModal.js` (otros tipos con forma, un único stage `__single__`).
- El objeto de ajuste hoy es `{ zoom, posX, posY, transparencia }`, guardado dentro de `properties` del componente (p.ej. `caraFrontal.ajusteImagen`, `working.ajusteImagen` según el caso). Un nuevo campo (p.ej. `rotation`) debería seguir el mismo patrón de persistencia, sin migración: ausencia de campo = 0º, mismo criterio que otros campos opcionales del proyecto (`oculto`, `mostrarTooltip`, etc., ver `design/docs/ARCHITECTURE.md` sección 4).
- `applyImageAdjustStyle` (única función que traduce el ajuste guardado a estilos CSS) se usa en tres puntos: la propia vista previa del modal, y `src/ui/componentRenderer.js` líneas ~299 y ~341 (renderizado en modo edición y modo juego). Debe seguir siendo el único punto que traduce el ángulo a la transformación visual, para no duplicar lógica en cada llamador.
- Precaución técnica para `ms-how`: `applyImageAdjustStyle` combina hoy `object-position` (paneo del margen de `object-fit: cover`) con crecimiento de `width`/`height` en porcentaje para el zoom. Añadir un `transform: rotate()` directo sobre el `<img>` puede desalinear ese cálculo de "cover" en los ángulos de 90º/270º, porque el ancho y el alto efectivos quedan intercambiados tras rotar — a resolver en el diseño técnico, no condiciona el alcance funcional aquí descrito.
- No se ha detectado ninguna incongruencia entre `design/docs/ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código real durante este análisis.
