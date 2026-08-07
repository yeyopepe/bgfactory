- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. En particular, no se modifica `ui/mazoContentModal.js` (miniaturas de cada carta dentro del mazo siguen mostrando la cara frontal de cada carta, no la imagen propia del mazo) ni la detección de uso de recursos (`core/resource.js`), que ya cubre `imagenResourceId` de primer nivel sin cambios.

**Dudas resueltas con el usuario:** el criterio inicialmente propuesto (imagen propia obligatoria una vez elegida, sin botón de "quitar", con placeholder tras migración) se descartó — el usuario pidió explícitamente añadir un botón "Quitar imagen" y que, mientras el mazo no tenga imagen propia, siga comportándose exactamente igual que hoy (dorso de la carta de arriba / icono de "vacío"), en vez de un placeholder de "sin imagen configurada". `description.md` ya quedó actualizado con este criterio antes de escribir este plan.

## (b) Solución técnica

1. **`src/ui/componentModal.js` — nueva propiedad por defecto.** Añadir `imagenResourceId: null` a `DEFAULT_MAZO_PROPERTIES` (línea ~140), mismo criterio que `DEFAULT_BOARD_PROPERTIES.imagenResourceId`. No hace falta añadir `ajusteImagen`/`transparenciaImagen` por defecto — ambos permanecen `undefined` hasta que se elige una imagen (mismo criterio que `ui/cardShapeModal.js`, cuyo `working.ajusteImagen` solo se fija al elegir/ajustar imagen), y `applyImageAdjustStyle`/`openImageAdjustModal` ya aplican sus propios valores por defecto (`zoom:100, posX:50, posY:50, rotation:0, transparencia:0`) cuando el campo no existe.

2. **`src/ui/componentModal.js` — importar `openImageAdjustModal`.** Añadir a la cabecera del fichero: `import { openImageAdjustModal } from './imageAdjustModal.js';` (junto al resto de imports de `./boardImageModal.js`, `./boardPatternModal.js`, etc., línea ~9). `openBoardImageModal` ya está importado.

3. **`src/ui/componentModal.js` — campo "Imagen" en `renderMazoSpecificFields`.** Insertar, dentro de esa función (línea ~1554-1642), un nuevo bloque **entre** el campo "Orientación" (termina en `container.appendChild(orientacionField);`) y el botón "Ver contenido del mazo" — así queda en el mismo orden validado en `design_pestana-especificas-mazo.html`. Estructura, siguiendo el patrón ya existente de `ui/cardShapeModal.js` (bloque "Elegir imagen…"/"Ajustar imagen…" de una `Forma`, líneas ~230-308 de ese fichero) adaptado a mazo (sin `working.tipo`, usa `props.forma`/`workingComponent.width`/`workingComponent.height` en su lugar):
   - `div.modal__field` con `<label>Imagen</label>`.
   - Fila de previsualización (`display:flex; gap:0.5rem; align-items:center`): `<img>` miniatura (`width/height: 2rem`, `object-fit: cover`, `border-radius: var(--radius-sm)`, `border: 1px solid var(--border-neutral)`) + `<span>` con el nombre del recurso. Oculta por completo (`style.display = 'none'`) cuando no hay `props.imagenResourceId`.
   - Fila de botones (`display:flex; gap:0.5rem`): tres `<button class="btn-cancel">` — "Elegir imagen…", "Ajustar imagen…", "Quitar imagen".
   - Función local `refreshImageField()`: busca el recurso (`props.imagenResourceId ? getResources().find(...) : null`), muestra/oculta la fila de previsualización y actualiza `src`/`textContent`, deshabilita "Ajustar imagen…" si no hay recurso (`adjustImageBtn.disabled = !resource`), y **oculta por completo** "Quitar imagen" si no hay recurso (`removeImageBtn.style.display = resource ? '' : 'none'`) — a diferencia de "Ajustar imagen…", que se deshabilita pero sigue visible, "Quitar imagen" no tiene sentido mostrarlo si no hay nada que quitar (así lo valida `design_pestana-especificas-mazo.html`, variante A sin fila de "Quitar imagen"). Llamar `refreshImageField()` una vez al construir el campo.
   - **"Elegir imagen…"** → `openBoardImageModal({ properties: props, resources: getResources(), title: 'Elegir imagen', onAccept: (resourceId) => { props.imagenResourceId = resourceId; props.ajusteImagen = { zoom: 100, posX: 50, posY: 50 }; props.transparenciaImagen = 0; refreshImageField(); } })` — reinicia ajuste/transparencia al elegir/reemplazar, igual que el resto de elementos del juego.
   - **"Ajustar imagen…"** → resuelve el recurso actual; si no hay, no hace nada (botón ya deshabilitado, guarda defensiva). Si lo hay: `openImageAdjustModal({ shape: props.forma === 'circular' ? 'circular' : 'cuadrada', width: workingComponent.width, height: workingComponent.height, resource, adjustment: props.ajusteImagen, transparencia: props.transparenciaImagen, onAccept: (adjustment) => { props.ajusteImagen = { zoom: adjustment.zoom, posX: adjustment.posX, posY: adjustment.posY, rotation: adjustment.rotation }; props.transparenciaImagen = adjustment.transparencia; } })`. El mapeo de `shape` reusa el mismo criterio que ya sigue el resto del renderizado del mazo (`forma === 'circular'` ⇒ máscara circular; cualquier otro valor ⇒ `'cuadrada'`, sin bordes redondeados — la caja del mazo en `componentRenderer.js` usa `var(--radius-lg)`, no `'redondeada'` de `imageAdjustModal.js`, pero no existe un tercer valor de máscara para ese radio: se acepta la aproximación visual de la previsualización, mismo criterio ya aceptado por `ui/boardImageModal.js`/`ui/cardShapeModal.js` para sus propias máscaras cuadradas).
   - **"Quitar imagen"** → `props.imagenResourceId = null; delete props.ajusteImagen; delete props.transparenciaImagen; refreshImageField();`. Sin `confirm()` (acción reversible desde la misma modal con "Elegir imagen…" de nuevo, mismo criterio que el resto de campos de esta pestaña, que tampoco piden confirmación).

4. **`src/ui/componentRenderer.js` — pintar la imagen propia del mazo cuando exista, con fallback al comportamiento actual.** En la rama `'mazo'` de `renderComponentsOnTable` (función interna, ~línea 1747-1760), envolver la lógica actual (cálculo de `cartaArriba`/`paintCartaFace` de `caraTrasera`/`renderMazoEmptyPlaceholder`) en un `if (props.imagenResourceId) { ... } else { <lógica actual sin cambios> }`:
   ```js
   if (props.imagenResourceId) {
     paintCartaFace(mazoContent, {
       imagenResourceId: props.imagenResourceId,
       ajusteImagen: props.ajusteImagen,
       transparenciaImagen: props.transparenciaImagen,
       fondoTipo: 'imagen',
     }, 1, width, height);
   } else {
     const cartaArriba = cartaIds.length > 0 ? getComponents().find((c) => c.id === cartaIds[0]) : null;
     if (cartaArriba) {
       // ...código ya existente sin cambios (renderScale, caraTrasera, mazoCaraTrasera, paintCartaFace)
     } else {
       renderMazoEmptyPlaceholder(mazoContent, width, height);
     }
   }
   ```
   `paintCartaFace` ya resuelve internamente el recurso (`getResources().find(...)`), aplica `applyImageAdjustStyle` y la opacidad de `transparenciaImagen`, y `getOrderedFaceElements` tolera la ausencia de `formas`/`textBoxes` en el objeto pasado (devuelve lista vacía) — no hace falta ningún cambio en `paintCartaFace` ni en `core/cardFaceElements.js`. No hace falta tocar la máscara/`overflow`/`borderRadius` de `mazoContent`: ya están fijados más arriba en la misma rama (`mazoBorderRadius`, `overflow: hidden`) y se aplican por igual a ambos caminos (imagen propia o fallback).
   - No se toca ninguna otra parte de la rama `'mazo'` (zona de revelado, contador de cartas, menú contextual, arrastre, `drop-target`, etc.) — todas son independientes de qué se pinte dentro de `mazoContent`.

## (c) Cambios de arquitectura

- `design/docs/architecture/02-component-types.md`, sección `'mazo'`:
  - Añadir a la tabla de propiedades tres filas nuevas: `imagenResourceId` (`string \| null`, default `null`, "Imagen propia del mazo, independiente del contenido de la pila. `null`: sin imagen propia, ver comportamiento de fallback abajo"), `ajusteImagen` (`{ zoom, posX, posY, rotation } \| undefined`, "Solo presente si hay `imagenResourceId`. Mismo shape que usa `ui/imageAdjustModal.js` en general"), `transparenciaImagen` (`number, 0–100 \| undefined`, default `0` cuando está presente, "Solo presente si hay `imagenResourceId`; se reinicia a `0` al elegir/cambiar imagen").
  - Actualizar el párrafo "Renderizado" (que hoy dice "Pinta `caraTrasera` de la carta de arriba... Sin carta: placeholder neutro"): explicar que con `imagenResourceId` propio, se pinta siempre esa imagen (vía `paintCartaFace` con un objeto `{ imagenResourceId, ajusteImagen, transparenciaImagen, fondoTipo: 'imagen' }`), sin relación con `cartaIds`; sin `imagenResourceId` propio, se mantiene el comportamiento previo sin cambios (dorso de `cartaIds[0]` o placeholder).
  - Mencionar los tres botones nuevos ("Elegir imagen…"/"Ajustar imagen…"/"Quitar imagen") en la pestaña "Específicas", junto a la mención ya existente de "Forma"/"Orientación".

## (e) Verificación

1. Crear un mazo nuevo sin cartas: en su pestaña "Específicas" aparece el campo "Imagen" con "Elegir imagen…" habilitado, "Ajustar imagen…" deshabilitado y sin fila de "Quitar imagen" visible. En la mesa se ve el icono neutro de "mazo vacío", igual que antes de este cambio.
2. Meter una carta en ese mazo (sin imagen propia todavía): en la mesa el mazo pasa a mostrar el dorso de esa carta — comportamiento idéntico al de antes del cambio.
3. Con el mazo abierto en propiedades, pulsar "Elegir imagen…", elegir una imagen de la galería: aparece la miniatura junto al nombre, "Ajustar imagen…" se habilita y aparece "Quitar imagen". Al aceptar la modal de propiedades, en la mesa el mazo pasa a mostrar esa imagen en vez del dorso de la carta, tenga o no cartas dentro.
4. Pulsar "Ajustar imagen…": se abre el editor con zoom/transparencia/rotación sobre la imagen elegida, con la máscara cuadrada o circular según la "Forma" actual del mazo. Cambiar zoom/rotación/transparencia y aceptar: el mazo en la mesa refleja esos ajustes.
5. Elegir una imagen distinta con "Elegir imagen…" sobre un mazo que ya tenía una: el ajuste (zoom/posición/rotación) y la transparencia vuelven a sus valores por defecto.
6. Pulsar "Quitar imagen": desaparece la miniatura, "Ajustar imagen…" vuelve a deshabilitarse y "Quitar imagen" desaparece. En la mesa, el mazo vuelve a mostrar el dorso de la carta de arriba (o el icono de "vacío" si no tiene cartas) — como si nunca hubiera tenido imagen propia.
7. Duplicar un mazo con imagen propia ya configurada: el duplicado nace con la misma imagen, ajuste y transparencia.
8. Intentar borrar desde el panel de Recursos una imagen que esté en uso como imagen propia de algún mazo: el borrado queda bloqueado, igual que con cualquier otro tipo de componente que use esa imagen.
9. Cargar una partida guardada antes de este cambio (mazos sin `imagenResourceId` en sus `properties`): se comportan exactamente igual que antes (dorso de la carta de arriba / icono de vacío), sin errores en consola.
