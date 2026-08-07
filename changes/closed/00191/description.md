- **Nombre**: Transparencia para el fondo de imagen de las figuras geométricas
- **Código**: 00191
- **Tipo**: change
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

Opción de transparencia para figuras geométricas. Añadir una opción de transparencia para las figuras geométricas, aplicable a la imagen o al color de fondo.

## Descripción completa

Las figuras geométricas que se pueden añadir dentro del diseño de una carta o de un tablero personalizado (círculo/elipse, cuadrado, rectángulo redondeado) admiten hoy un fondo, que puede ser un color liso o una imagen. El fondo de color ya se puede hacer transparente (nivel ajustable de 0 a 100%). El fondo de imagen, en cambio, siempre se pinta totalmente opaco.

Este cambio añade esa misma opción de transparencia al fondo de imagen: al configurar una figura geométrica con imagen de fondo, aparece un control para ajustar su nivel de transparencia (0% = opaca, 100% = invisible).

A diferencia del control de transparencia del color (que vive en el propio panel de edición de la figura), el de la imagen se coloca **dentro de la ventana "Ajustar imagen…"**, junto a los controles de zoom/posición que ya existen ahí — así se ve el efecto de la transparencia en tiempo real, superpuesto sobre la vista previa de la imagen ya recortada a la forma de la figura, mientras se mueve el deslizador.

Comportamiento acordado:

1. Por defecto, una figura con imagen es opaca (0% de transparencia), igual que ocurre hoy con el color.
2. El control de transparencia solo está disponible mientras la figura tenga una imagen elegida — si no hay ninguna imagen todavía, el propio botón "Ajustar imagen…" que lo contiene ya aparece deshabilitado, como ocurre hoy.
3. Al elegir una imagen nueva para la figura (o cambiar la que ya tenía), el nivel de transparencia vuelve a 0% — igual que ya ocurre con la transparencia de la imagen de fondo de una cara completa de carta.
4. Si se cambia el fondo de la figura de imagen a color y luego otra vez a imagen, se recupera el último nivel de transparencia que tenía esa imagen (no se pierde por cambiar de tipo de fondo y volver, ni por abrir y cerrar "Ajustar imagen…" sin aceptar cambios).
5. Cancelar la ventana "Ajustar imagen…" no aplica ningún cambio (ni de transparencia ni del resto de ajustes), igual que ya ocurre hoy con zoom/posición.
6. La transparencia de imagen es independiente de la transparencia de color y del borde de la figura: cada una se ajusta por separado y no se combinan entre sí.
7. Solo aplica a las figuras geométricas dentro del diseño de cartas/tableros personalizados. No cambia nada en el fondo de imagen de la cara completa (eso ya tiene su propia transparencia, ya existente) ni en el fondo de color de la cara completa (fuera de alcance de esta idea).
8. Disponible solo en modo edición, como el resto de configuración de estas figuras — el proyecto no distingue roles de usuario que restrinjan esta acción.
9. No aparece nada nuevo en la mesa de juego ni cambia ninguna navegación nueva: reutiliza una ventana ("Ajustar imagen…") que ya se abre hoy desde el panel de edición de la figura, solo gana un control más dentro.

## Apuntes técnicos

- "Figura geométrica" es el tipo `Forma`, definido dentro de `cara.formas` de `'carta'`/`'tableroPersonalizado'` (`design/docs/architecture/02-component-types.md`). Se crea desde "Añadir elemento" → "Figura geométrica" en `ui/visualEditorModal.js`, se edita en `ui/cardShapeModal.js`.
- `Forma` ya tiene `fondoTipo: 'color'|'imagen'|undefined` (mutuamente excluyente, ambas configuraciones conviven en el objeto), `colorFondo`, `colorFondoTransparencia` (0–100, con `hexToRgba` de `core/colorUtils.js`) e `imagenResourceId`/`ajusteImagen`, pero ningún campo de transparencia para la imagen.
- **Hallazgo clave**: `ui/imageAdjustModal.js` (`openImageAdjustModal`) **ya soporta transparencia con vista previa en tiempo real** — parámetro de entrada `transparencia` (por-entrada en el array `faces`, o suelto en el modo de un único stage), estado interno `state[key].transparencia`, slider+input "%" (`hasTransparencia`/`opacityField`, líneas ~299–351) y aplicación inmediata sobre la vista previa (`updatePreview` → `imgEls[key].style.opacity = String(1 - state[key].transparencia / 100)`). Al aceptar, devuelve `transparencia` junto a `zoom`/`posX`/`posY`/`rotation`.
  - Ya en uso por `ui/visualEditorModal.js` (`openAdjustSession`, líneas ~508–537) para `cara.transparenciaImagen`, con el modo multi-stage (`faces`).
  - `ui/cardShapeModal.js` (`adjustImageBtn`, líneas ~281–298) llama a `openImageAdjustModal` en modo de un único stage (sin `faces`) y **hoy no pasa `transparencia`** — por eso el bloque de transparencia no aparece ahí. Añadir esta idea es, en la práctica, pasar `transparencia: working.imagenTransparencia` a esa llamada y, en su `onAccept`, guardar `working.imagenTransparencia = adjustment.transparencia` (en vez de `working.ajusteImagen = adjustment` a secas).
  - Con esto, **no hace falta ningún control nuevo dentro de `cardShapeModal.js`** (el mockup inicial que colocaba el slider en el bloque "Imagen" del modal de la figura queda descartado) — solo cablear el parámetro/retorno ya soportado por el modal reutilizable.
- Reset a `0` al elegir/cambiar imagen: replicar el mismo punto donde `chooseImageBtn` de `cardShapeModal.js` resetea `working.ajusteImagen = { zoom: 100, posX: 50, posY: 50 }`, añadiendo ahí `working.imagenTransparencia = 0`.
- Puntos de render de `Forma` a actualizar para pintar la opacidad final (fuera del modal de ajuste): `ui/visualEditorModal.js` y `ui/componentRenderer.js` → `paintCartaFace`.
- Campo propuesto: `imagenTransparencia` (number, 0–100, default `0`) en `Forma`, mismo nombre y semántica que ya usa `transparenciaImagen` a nivel de cara pero con el orden de palabras coherente con `colorFondoTransparencia` de la propia `Forma`.
- Sin incongruencias detectadas entre la documentación técnica (`design/docs/architecture/02-component-types.md`) y el código real durante este análisis.
