- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. En particular: la transparencia de la imagen de fondo de una cara completa de carta/tablero personalizado (`cara.transparenciaImagen`) y la del color de fondo de la cara completa no cambian — solo se añade transparencia de imagen a nivel de `Forma` (figura geométrica). Tampoco se añade ningún control nuevo dentro de `ui/cardShapeModal.js`: el mockup inicial que colocaba el slider en el bloque "Imagen" del modal de la figura queda descartado a favor de reutilizar el slider que ya existe dentro de "Ajustar imagen…" (`ui/imageAdjustModal.js`).

**Dudas resueltas con el usuario:** ninguna pregunta abierta — el `description.md` (sección "Apuntes técnicos") ya dejaba identificado el mecanismo de reutilización de `ui/imageAdjustModal.js` y los puntos exactos de cableado, confirmado por este análisis contra el código real.

## (b) Solución técnica

1. **`src/ui/imageAdjustModal.js` — activar el parámetro `transparencia` también en modo de un único stage (sin `faces`).** El modal ya soporta transparencia por completo en modo `faces` (usado hoy por `cara.transparenciaImagen`), pero en modo single-stage el parámetro de entrada `transparencia` se recibe (desestructurado en la firma de `openImageAdjustModal`) y **no se usa**: la construcción del entry sintético (`entries = faces || [{ key: '__single__', label: null, shape, width, height, resource, adjustment }]`) no lo incluye, así que `hasTransparencia` siempre da `false` en este modo y el slider nunca aparece. Cambiar esa línea para incluir el campo: `entries = faces || [{ key: '__single__', label: null, shape, width, height, resource, adjustment, transparencia }]`. Con esto, `state.__single__.transparencia` se inicializa correctamente desde el parámetro de entrada y `onAccept({ ...state.__single__ })` ya devuelve `transparencia` al aceptar.
2. **`src/ui/cardShapeModal.js` — inicializar `working.imagenTransparencia`.** Junto al resto de valores por defecto de `working` (cerca de `working.colorFondoTransparencia = working.colorFondoTransparencia ?? 0;`, línea ~32), añadir `working.imagenTransparencia = working.imagenTransparencia ?? 0;`.
3. **`src/ui/cardShapeModal.js` — resetear a `0` al elegir/cambiar imagen.** En el handler de `chooseImageBtn` (`onAccept` de `openBoardImageModal`, línea ~273-277), donde ya se resetea `working.ajusteImagen = { zoom: 100, posX: 50, posY: 50 }`, añadir `working.imagenTransparencia = 0;` en el mismo punto.
4. **`src/ui/cardShapeModal.js` — cablear `transparencia` en la llamada a `openImageAdjustModal` del botón "Ajustar imagen…".** En el handler de `adjustImageBtn` (línea ~285-297):
   - Pasar `transparencia: working.imagenTransparencia` como parte del objeto de entrada a `openImageAdjustModal`.
   - En `onAccept(adjustment)`, dejar de guardar `adjustment` completo en `working.ajusteImagen` (arrastraría también `transparencia`, que no pertenece a ese campo) y en su lugar separar ambos, igual que hace `ui/visualEditorModal.js` (línea ~527-533) para `cara.transparenciaImagen`:
     ```js
     onAccept: (adjustment) => {
       working.ajusteImagen = { zoom: adjustment.zoom, posX: adjustment.posX, posY: adjustment.posY, rotation: adjustment.rotation };
       working.imagenTransparencia = adjustment.transparencia;
     },
     ```
   - No hace falta ningún cambio en el propio botón "Ajustar imagen…" ni en su condición de deshabilitado (`adjustImageBtn.disabled = !resource` ya cubre el requisito de "solo disponible con imagen elegida").
5. **`src/ui/componentRenderer.js` → `paintShape` — pintar la opacidad final en la mesa.** Justo antes o después de `applyImageAdjustStyle(img, shape.ajusteImagen, ...)` (línea ~372), añadir `img.style.opacity = String(1 - (shape.imagenTransparencia ?? 0) / 100);` — mismo patrón ya usado en `paintCartaFace` para `cara.transparenciaImagen` (línea 327).
6. **`src/ui/visualEditorModal.js` → `renderShape` — misma opacidad en la vista previa del editor.** Justo antes o después de `applyImageAdjustStyle(shapeImg, shape.ajusteImagen, ...)` (línea ~1078), añadir la misma línea: `shapeImg.style.opacity = String(1 - (shape.imagenTransparencia ?? 0) / 100);`.

No hace falta tocar `core/state.js`, `core/fileExport.js` ni `core/resource.js`: `imagenTransparencia` es un campo numérico plano más dentro de `Forma` (que ya vive dentro de `properties` de `'carta'`/`'tableroPersonalizado'`, serializado sin lista de campos propia) y no es una referencia a recurso, así que no afecta a persistencia/exportación ni a la detección de uso de recursos (`collectDeepValues`).

## (c) Cambios de arquitectura

- **`design/docs/architecture/02-component-types.md`** — tabla de la shape `Forma` (sección `'carta'` → "Shape `Forma`"): añadir fila para el nuevo campo, coherente con la fila existente de `colorFondoTransparencia`:

  | Campo | Tipo | Default | Descripción |
  |---|---|---|---|
  | `imagenTransparencia` | number, 0–100 | `0` (opaco) | Transparencia sobre la imagen de fondo (`fondoTipo === 'imagen'`), independiente de `colorFondoTransparencia` y del borde. Se reinicia a `0` al elegir/cambiar imagen; se conserva al cambiar `fondoTipo` a `'color'` y volver a `'imagen'`. Se ajusta desde el slider "Transparencia" dentro de "Ajustar imagen…" (`ui/imageAdjustModal.js`), no en el panel de edición de la figura |

- **`design/docs/architecture/05-ui-layer.md`** — incongruencia detectada durante este análisis, previa a este cambio: la entrada de `ui/imageAdjustModal.js` no documenta en absoluto el parámetro/funcionalidad de transparencia que el código ya implementaba (input `transparencia` por-entrada en `faces` o suelto en modo single-stage, estado `state[key].transparencia`, slider+input "%", aplicación en tiempo real vía `opacity` sobre la vista previa, devuelto en el resultado al aceptar). Aprovechar esta actualización para documentarlo, ampliando la entrada existente de `ui/imageAdjustModal.js`:
  - Añadir a la firma documentada: `openImageAdjustModal({ shape, width, height, resource, adjustment, transparencia, onAccept, faces, initialFocusKey })`.
  - Nota sobre el slider "Transparencia" (`modal__field`, min 0/max 100, sincronizado con cuadro de texto igual que "Zoom"): solo se pinta si algún entry trae `transparencia !== undefined` (`hasTransparencia`); opera sobre `focusedKey` igual que Zoom/90º; aplica `opacity = 1 - transparencia/100` sobre la vista previa en tiempo real; al aceptar, se incluye en el resultado devuelto (por-`key` en modo `faces`, o directo en modo single-stage) solo si `hasTransparencia`.
  - Actualizar la frase "Sin `faces`: ... (sin llamador propio actualmente...)" — tras este cambio (00191) ya tiene llamador propio: `ui/cardShapeModal.js` (`adjustImageBtn`), para la transparencia de imagen de una `Forma`.
  - Mencionar el segundo llamador de modo `faces` que usa transparencia: `ui/visualEditorModal.js` (`openAdjustSession`) para `cara.transparenciaImagen`.

## (e) Verificación

1. Abrir el editor visual de una carta o tablero personalizado, "Añadir elemento" → "Figura geométrica", editar la figura (doble click) → fondo "Imagen", elegir una imagen. El botón "Ajustar imagen…" pasa a estar habilitado.
2. Pulsar "Ajustar imagen…": aparece, junto al control de "Zoom" ya existente, un nuevo control "Transparencia" (slider 0–100 + campo numérico "%"), inicialmente en `0`.
3. Mover el slider de transparencia: la vista previa de la imagen recortada a la forma de la figura, dentro de la misma ventana, se atenúa en tiempo real acorde al valor.
4. Pulsar "Aceptar" en "Ajustar imagen…" y luego "Aceptar" en el editor de la figura: la figura se pinta con esa transparencia en el lienzo del editor visual.
5. Aceptar el componente y verlo en la mesa (modo edición y modo juego): la figura mantiene la misma transparencia de imagen.
6. Reabrir "Editar figura" → "Ajustar imagen…" para esa misma figura: el slider muestra el nivel de transparencia guardado (no vuelve a `0`).
7. Cambiar el nivel de transparencia y pulsar "Cancelar" en "Ajustar imagen…": el nivel de transparencia de la figura no cambia (se conserva el valor previo).
8. Elegir una imagen distinta (o la misma de nuevo) con "Elegir imagen…" para la figura: el nivel de transparencia de imagen vuelve a `0%`.
9. Cambiar el fondo de la figura de "Imagen" a "Color" y de vuelta a "Imagen" (sin volver a elegir imagen): al abrir "Ajustar imagen…", se recupera el último nivel de transparencia que tenía esa imagen, no se resetea a `0`.
10. La transparencia de color (`colorFondoTransparencia`, en el panel de edición de la figura) y el borde de la figura siguen ajustándose de forma independiente, sin verse afectados por el nuevo control.
11. El fondo de imagen de una cara completa de carta/tablero personalizado (botón "Ajustar imagen…" del editor visual, con su propio control de transparencia ya existente) sigue funcionando exactamente igual que antes de este cambio.
