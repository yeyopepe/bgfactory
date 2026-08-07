- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** el menú contextual "Girar 90°" de `ui/visualEditorModal.js` (rotación de `Forma`/`TextBox` completas) no se toca — sigue haciendo clic = +90° cíclico, sin cambios de código. No se modifica el modelo de datos: `rotation` sigue siendo un campo numérico en grados en los mismos sitios de siempre (`ajusteImagen.rotation`, `Forma.rotation`, `TextBox.rotation`); solo cambia de qué valores puede tomar (cualquier entero 0-360, no solo múltiplos de 90) y con qué control se edita.

**Dudas resueltas con el usuario:** ver `description.md` — resumen: (1) alcance = ambos sitios de rotación se ven afectados, pero el menú contextual de formas/textboxes se mantiene igual y el slider se añade como control adicional dentro de sus modales de edición; (2) el imán hacia las marcas de 90° ajusta el valor exacto al acercarse, no es solo guía visual; (3) se mantiene un campo numérico editable junto al slider, igual que los sliders de zoom/transparencia ya existentes.

## (b) Solución técnica

1. **`src/ui/imageAdjustModal.js` — generalizar `applyImageAdjustStyle()` a rotación continua.** Sustituir el booleano `rotated90` y el intercambio binario de `coverWidth`/`coverHeight` (líneas 32-34) por la fórmula general del bounding box de un rectángulo `boxWidth`×`boxHeight` rotado `θ` (en radianes):
   ```js
   const theta = (rotation * Math.PI) / 180;
   const coverWidth = boxWidth * Math.abs(Math.cos(theta)) + boxHeight * Math.abs(Math.sin(theta));
   const coverHeight = boxWidth * Math.abs(Math.sin(theta)) + boxHeight * Math.abs(Math.cos(theta));
   ```
   Esta fórmula es la generalización exacta del caso actual: en `θ = 0°/180°` da `coverWidth = boxWidth`, `coverHeight = boxHeight` (sin intercambio); en `θ = 90°/270°` da `coverWidth = boxHeight`, `coverHeight = boxWidth` (intercambio total, igual que hoy). Para ángulos intermedios calcula el marco mínimo que, tras rotar, sigue cubriendo por completo `boxWidth`×`boxHeight` sin huecos en las esquinas — mismo principio ya documentado en el comentario de cabecera de la función (líneas 21-29), que hay que actualizar para dejar de hablar solo de "90º/270º" y describir el caso general. El resto de la función (zoom, pan, `transform-origin`) no cambia: ya opera en píxeles y ya acepta cualquier ángulo en `transform: rotate(${rotation}deg)`.
2. **`src/ui/rotationSlider.js` (nuevo) — control reutilizable de rotación 0-360º con marcas imantadas.** Nuevo módulo utilitario en `src/ui/`, mismo criterio que `ui/resizeHandle.js` (lógica genérica reutilizada entre varios llamadores, sin conocer el modelo de datos del componente/carta). Expone:
   ```js
   export function createRotationSliderField({ label = 'Rotación', value = 0, onChange }) { ... }
   ```
   Devuelve `{ field, setValue(v) }`:
   - `field`: `div.modal__field.rotation-field` con: `<label>`, una pista (`div.rotation-slider__track`) que contiene el `input[type=range] min=0 max=360 step=1` y, superpuestas, las marcas visuales en 0/90/180/270/360 (`div.rotation-slider__marks` > 5× `div.rotation-slider__mark`, resaltando con `rotation-slider__mark--active` la más cercana al valor actual), etiquetas numéricas debajo (`div.rotation-slider__labels`), y a la derecha un campo numérico sincronizado (`div.rotation-slider__value` > `input[type=text]` + `<span>º</span>`) — mismo patrón de sincronización slider↔texto que `zoomInput`/`zoomTextInput` de `imageAdjustModal.js` (parseo con `parseInt`, `Math.min(Math.max(...))` para clampear a `[0, 360]`, `Enter` hace `blur()`).
   - **Imán**: constante de módulo `ROTATION_SNAP_THRESHOLD_DEG = 8`. En el listener `input` del slider, antes de propagar el valor: si el valor crudo está a `ROTATION_SNAP_THRESHOLD_DEG` grados o menos de alguna marca (`[0, 90, 180, 270, 360]`), fuerza `slider.value` a esa marca exacta. Después, siempre: actualiza el campo de texto, recalcula qué marca queda `--active`, y llama a `onChange(valorFinal)`.
   - `setValue(v)`: sincroniza slider + texto + marca activa desde fuera, sin disparar `onChange` — necesario para resincronizar el control cuando el dato cambia por otra vía (ver tarea 3).
3. **`src/ui/imageAdjustModal.js` — sustituir el botón "90º" por el nuevo slider.** Eliminar `rotateWrap`/`rotateBtn` y su inserción en `stagesRow` (líneas 166-189). Crear una instancia de `createRotationSliderField` colocada en el área de controles junto a "Zoom"/"Transparencia" (mismo lugar que en `design_slider-rotacion-ajustar-imagen.html`, tras `zoomField` y antes/después de `opacityField`, da igual el orden relativo entre ambos): `value` inicial `focusedKey ? state[focusedKey].rotation : 0`, `onChange: (v) => { state[focusedKey].rotation = v; updatePreview(focusedKey); }`. Añadir su `setValue(state[focusedKey].rotation)` dentro de `refreshFocusClasses()` (línea ~199-206), igual que ya se hace con `zoomInput.value`/`opacitySlider.value`, para que el slider se resincronice al cambiar de cara enfocada (`focusedKey`).
4. **`src/ui/cardShapeModal.js` — añadir el slider de rotación de la figura.** Tras `working.imagenTransparencia = working.imagenTransparencia ?? 0;` (línea 33), añadir `working.rotation = working.rotation ?? 0;`. Crear una instancia de `createRotationSliderField` (`value: working.rotation`, `onChange: (v) => { working.rotation = v; }`) y añadirla a `content` — ubicación acorde a `design_slider-rotacion-editor-forma.html`: tras el bloque "Fondo" (`bgSection`, tras la línea 319) y antes del bloque "Borde" (`borderSection`, línea 322).
5. **`src/ui/cardTextBoxModal.js` — mismo tratamiento para el cuadro de texto.** Tras `working.colorFondoTransparencia = working.colorFondoTransparencia ?? 0;` (línea 28), añadir `working.rotation = working.rotation ?? 0;`. Añadir la misma instancia de `createRotationSliderField` (`value: working.rotation`, `onChange: (v) => { working.rotation = v; }`) en `content`, junto al resto de bloques de estilo del cuadro (p. ej. tras el bloque de fondo/opacidad, líneas ~408-477, coherente con la ubicación equivalente en `cardShapeModal.js`).
6. **`src/styles/main.css` — retirar estilos del botón eliminado, añadir los del nuevo control.** Eliminar `.image-adjust-modal__rotate-wrap` y `.btn-rotate`/`.btn-rotate:hover`/`.btn-rotate svg` (líneas 1416-1449, ya sin uso). Añadir el bloque BEM nuevo `.rotation-field`/`.rotation-slider__track`/`.rotation-slider__marks`/`.rotation-slider__mark`/`.rotation-slider__mark--active`/`.rotation-slider__labels`/`.rotation-slider__value` reutilizando tokens existentes (`--accent-blue` para pista/marca activa, `--accent-blue-dark` para marcas en reposo, `--border-neutral`/`--text-muted` para etiquetas), inspirado en el layout ya usado por `.image-adjust-modal__zoom-value` (fila slider + caja de valor) pero como bloque propio e independiente de `imageAdjustModal.js`, ya que ahora también lo usan `cardShapeModal.js`/`cardTextBoxModal.js`.

Sin tareas de comprobación manual en esta sección — ver (e).

## (c) Cambios de arquitectura

- **`design/docs/architecture/05-ui-layer.md`**:
  - Añadir una entrada nueva a la lista de módulos (tras `ui/resizeHandle.js`, mismo criterio de "utilidad genérica reutilizada") describiendo `ui/rotationSlider.js`: expone `createRotationSliderField({ label, value, onChange })`, control de rotación 0-360º con marcas imantadas cada 90º (`ROTATION_SNAP_THRESHOLD_DEG`) + campo numérico sincronizado; reutilizado por `ui/imageAdjustModal.js`, `ui/cardShapeModal.js` y `ui/cardTextBoxModal.js`.
  - Actualizar la entrada de `ui/imageAdjustModal.js` (línea 37, "Botón '90º'"): ya no existe ese botón — sustituir la descripción por el nuevo control de rotación (`ui/rotationSlider.js`), mismo criterio de "opera sobre `focusedKey`, resincronizando al cambiar foco" que ya usan Zoom/Transparencia.
  - Actualizar la descripción de `applyImageAdjustStyle` (línea 41): ya no es un caso especial "90º/270º exige marco virtual con ancho/alto intercambiados" — es el caso particular de la fórmula general de bounding box rotado, válida para cualquier ángulo.
- **`design/docs/architecture/02-component-types.md`**:
  - `Forma.rotation` (línea 116/124) y `TextBox.rotation` (línea 140/149): el tipo documentado `0 | 90 | 180 | 270 | undefined` deja de ser exacto — ahora puede ser cualquier entero `0-360` (vía el nuevo slider en `cardShapeModal.js`/`cardTextBoxModal.js`), además de los múltiplos de 90 que sigue produciendo el menú contextual "Girar 90°". Actualizar la descripción de ambos campos para reflejar que conviven las dos vías de edición.

## (d) Cambios en estilo

- **`design/docs/style/03-modales-menus.md`** (o el fichero hermano que corresponda tras revisar `INDEX.md` al implementar): documentar el patrón nuevo "slider con marcas imantadas" (`ui/rotationSlider.js`) — primer uso en el proyecto de un slider con marcas de referencia y snap magnético (hasta ahora no había precedente de `<datalist>` ni de marcas). Anotar: nomenclatura BEM del bloque (`.rotation-field`/`.rotation-slider__*`), el umbral de imán como constante de módulo (no un valor "mágico" disperso), y que convive deliberadamente con la acción rápida "Girar 90°" del menú contextual en formas/cajas de texto (dos mecanismos de edición del mismo campo, uno rápido y cíclico, otro preciso).

## (e) Verificación

1. Abrir "Ajustar imagen" sobre una figura o cara de carta con imagen: el botón "Girar 90º" ya no aparece; en su lugar hay un slider 0-360º con marcas en 0/90/180/270/360 y un campo numérico junto a él, inicializado con la rotación actual.
2. Arrastrar el slider cerca de una marca (p. ej. hacia 90º): el valor salta exactamente a esa marca y la imagen previsualizada rota justo un cuarto de vuelta, cubriendo el marco recortado sin huecos en los bordes.
3. Mover el slider a un valor intermedio (p. ej. 45º), lejos de cualquier marca: la imagen rota 45º y sigue cubriendo por completo el marco recortado (probar con forma circular, cuadrada, redondeada, hexagonal y triangular), sin huecos ni bordes vacíos en ninguna esquina.
4. Escribir un valor exacto en el campo numérico (p. ej. 270) y confirmar con Enter o quitando el foco: el slider se mueve a esa posición y la imagen rota en consecuencia.
5. En el modal de "Ajustar imagen" con `faces` (anverso/reverso de una carta), cambiar de cara enfocada: el slider de rotación se resincroniza al valor guardado de la cara recién enfocada, sin arrastrar el valor de la cara anterior.
6. Aceptar el modal y reabrir "Ajustar imagen" sobre el mismo elemento: el ángulo elegido persiste.
7. Doble clic sobre una figura en el Editor visual: el modal de edición muestra el nuevo slider de rotación (0-360º con marcas), con el valor ya guardado (incluido si se giró antes desde el menú contextual, en cuyo caso debe mostrar el múltiplo de 90 correspondiente).
8. Cambiar el slider dentro de ese modal a un valor intermedio y aceptar: la figura en el lienzo rota al ángulo elegido, no solo a múltiplos de 90.
9. Repetir las comprobaciones 7 y 8 con un cuadro de texto (doble clic → modal de cuadro de texto).
10. Clic derecho sobre una figura o cuadro de texto y elegir "Girar 90°": sigue funcionando exactamente igual que antes (incrementa +90° cíclicamente); al abrir después su modal de edición con doble clic, el slider muestra ese mismo ángulo.
11. Revisar visualmente que no queda ninguna referencia residual al botón "Girar 90º" eliminado (icono, texto "90º" o clase `btn-rotate`) en ningún modal del proyecto.
