## (a) Anotaciones funcionales

Sin dudas pendientes de resolver con el usuario: el `description.md` ya deja las reglas de comportamiento acordadas de forma completa y sin ambigüedad. Los ficheros `design_*.html` se han usado solo como referencia visual puntual (ver tarea 5 de la sección (b)) para la etiqueta "Activa" bajo la cara activa y el resaltado con borde de acento — el resto de la solución (API interna, dónde vive cada pieza de estado) no se basa en ellos.

Nada queda fuera de alcance: la ampliación del zoom editable como texto está incluida en las tareas de abajo, junto con el resto del cambio.

## (b) Solución técnica

1. **`src/ui/imageAdjustModal.js` — cuadro de texto sincronizado con el zoom (afecta a los dos usos, con o sin `secondaryPreview`).**
   Debajo del `<input type="range">` de zoom, añadir un `<input type="text">` (con un `%` al lado, mismo patrón visual que el mockup `design_modal-ajuste-imagen-intercambio.html`) dentro de un nuevo contenedor `image-adjust-modal__zoom-value`. Sincronización bidireccional:
   - Mover el slider (`input` en el range) actualiza el valor mostrado en el cuadro de texto además de `zoom`/`updatePreview()` (ya existente).
   - Confirmar el cuadro de texto (`change` o `blur`, y `Enter` vía `keydown`) parsea el valor, lo clampa a `[100, 300]` con el `clamp()` ya existente en el módulo, actualiza `zoom`, refleja el valor clampado tanto en el propio input de texto como en el `range`, y llama a `updatePreview()`. Un valor no numérico se descarta (se restaura el valor de `zoom` actual en el cuadro).
   - No se persiste nada nuevo: sigue siendo la misma variable `zoom` local del closure, con el mismo `onAccept({ zoom, posX, posY })` de siempre.

2. **`src/ui/imageAdjustModal.js` — hacer clicable la cara secundaria y devolver el control a quien llama.**
   Extender el shape de `secondaryPreview` con un campo opcional `onSelect(currentPrimaryAdjustment)`. Cuando `secondaryPreview.onSelect` está presente **y** `secondaryPreview.resource` existe, el `mask` secundario:
   - Añade cursor `pointer` y una clase `image-adjust-modal__mask--clickable` (nuevo CSS: quita la opacidad reducida heredada de `--secondary` y añade un `:hover` sutil, p.ej. aclarar/oscurecer el fondo — ver tarea 6).
   - En `click`, invoca `secondaryPreview.onSelect({ zoom, posX, posY })` (el estado *actual* de la cara activa, no necesariamente el que tenía al abrir el modal) y cierra el overlay (mismo cleanup de listeners que ya hace `cancelBtn`) **sin** llamar a `onAccept`.
   Si `secondaryPreview.resource` no existe, o no se pasa `onSelect`, el comportamiento es idéntico al actual (sin cursor de mano, sin listener, mismo aspecto atenuado que hoy) — así el caso de `'ficha'` (que nunca pasa `secondaryPreview`) y cualquier futura llamada que no necesite intercambio no se ven afectados.
   No es responsabilidad de `imageAdjustModal.js` decidir *si* la cara inactiva puede activarse (esa regla — "solo si tiene imagen elegida" — ya la cubre el propio `if (secondaryPreview.resource)`) ni gestionar qué pasa después del intercambio: eso lo orquesta quien llama (tarea 4).

3. **`src/ui/imageAdjustModal.js` — etiqueta "Activa" bajo la cara primaria, solo cuando hay `secondaryPreview`.**
   Añadir, junto al `mask` primario, un `<span class="image-adjust-modal__primary-label">Activa</span>` (estilo azul de acento, mismo tratamiento tipográfico que `secondary-label` pero en `var(--accent-blue)`), mostrado únicamente si se pasa `secondaryPreview` (para no cambiar el aspecto del caso de una sola cara, como `'ficha'`). Añadir también el borde de acento sobre el `mask` primario cuando hay `secondaryPreview` (`image-adjust-modal__mask--active`: borde `var(--accent-blue)` + halo, según mockup) — igualmente condicionado a la presencia de `secondaryPreview`, para no tocar visualmente el caso de una sola cara.

4. **`src/ui/cardEditorModal.js` — sustituir los dos botones "Ajustar imagen…" por uno solo, con intercambio de cara activa.**
   - Quitar el botón "Ajustar imagen…" de `renderFace` (dentro de `actionsRow`, junto a "Elegir imagen…"); esa fila se queda solo con "Elegir imagen…" y "+ Cuadro de texto".
   - Añadir, debajo de `facesRow` (fuera de las dos columnas, centrado, igual que el mockup `design_editor-cartas-boton-unico.html`), un único botón "Ajustar imagen…". Su estado `disabled` se recalcula cada vez que se repinta (misma función que ya recalcula todo lo demás en cada `renderFaces()`): deshabilitado solo si **ninguna** de las dos caras (`working.caraFrontal`/`working.caraTrasera`) tiene `imagenResourceId`.
   - Lógica de apertura (nueva función local, p.ej. `openAdjustSession(initialKey)`):
     - Cara activa inicial: `caraFrontal` si tiene imagen; si no, `caraTrasera` si tiene imagen; si ninguna tiene, el botón ya está deshabilitado y no se llega aquí.
     - Antes de abrir el primer modal de la sesión, clonar el `ajusteImagen` de ambas caras en un objeto de sesión local (`sessionAdjustments = { caraFrontal: {...}, caraTrasera: {...} }`) — así cancelar en cualquier punto de la sesión (incluso tras varios intercambios) descarta todo sin tocar `working`.
     - Función interna `openForKey(activeKey)` que llama a `openImageAdjustModal` con:
       - Cara primaria = `activeKey`, usando `resource`/`adjustment` de `sessionAdjustments[activeKey]` (no de `working` directamente).
       - `secondaryPreview` = la otra cara, con `resource`/`adjustment` de `sessionAdjustments[otherKey]`, y `onSelect: (currentAdjustment) => { sessionAdjustments[activeKey] = currentAdjustment; openForKey(otherKey); }` — solo tiene efecto real si esa cara secundaria tiene imagen (regla ya cubierta por `imageAdjustModal.js`, tarea 2).
       - `onAccept: (adjustment) => { sessionAdjustments[activeKey] = adjustment; working.caraFrontal.ajusteImagen = sessionAdjustments.caraFrontal; working.caraTrasera.ajusteImagen = sessionAdjustments.caraTrasera; renderFaces(); }` — guarda el ajuste final de **ambas** caras de la sesión, no solo la que estaba activa al aceptar.
     - El botón único llama a `openAdjustSession(initialKey)`, que a su vez llama a `openForKey(initialKey)`.
   - Cancelar en cualquier punto (el `cancelBtn` ya existente dentro de `openImageAdjustModal`, sin cambios) simplemente cierra el overlay sin invocar `onAccept` ni `onSelect`: como `sessionAdjustments` es una variable local de la sesión (no referenciada por `working`), se descarta sin más al no usarse.

5. **`src/styles/main.css` — soporte visual de las tareas 1-3.**
   - `.image-adjust-modal__zoom-value`: contenedor flex para el input de texto + "%" debajo del slider (mismo espaciado que el resto de `modal__field`).
   - `.image-adjust-modal__mask--active`: borde `2px solid var(--accent-blue)` + halo sutil (`box-shadow` con el mismo azul en baja opacidad), aplicado solo cuando hay intercambio posible (tarea 3).
   - `.image-adjust-modal__mask--clickable`: quita la atenuación de `.image-adjust-modal__stage--secondary` que le aplica hoy `opacity: 0.6` (usar un valor de opacidad menor, p.ej. `0.85`, solo para el estado clicable — la cara sin imagen elegida mantiene el aspecto atenuado actual sin cursor ni hover) y añade `cursor: pointer` + un `:hover` sutil (p.ej. `filter: brightness(1.05)` o un ligero cambio de `box-shadow`).
   - `.image-adjust-modal__primary-label`: mismo estilo que `.image-adjust-modal__secondary-label` pero `color: var(--accent-blue)` y `font-weight: 600` (coherente con el resto de etiquetas de estado activo de la app, p.ej. `.component-list__row--selected`).

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 5, actualizar las entradas de `ui/imageAdjustModal.js` y `ui/cardEditorModal.js`:

- `ui/imageAdjustModal.js`: documentar que `openImageAdjustModal` ahora admite, dentro de `secondaryPreview`, un callback opcional `onSelect(currentPrimaryAdjustment)` que hace clicable esa cara secundaria (solo si tiene `resource`) para ceder el control de qué cara está activa a quien invoca el modal, cerrando el modal actual sin llamar a `onAccept`; documentar también el nuevo cuadro de texto sincronizado con el slider de zoom (rango 100–300, con clamp), aplicable a cualquier uso del modal, con o sin `secondaryPreview`.
- `ui/cardEditorModal.js`: documentar que ahora expone un único botón "Ajustar imagen…" (debajo de las dos columnas de caras, deshabilitado si ninguna cara tiene imagen elegida) en vez de uno por cara, que abre una "sesión de ajuste" sobre una copia local de los `ajusteImagen` de ambas caras (independiente de `working` hasta aceptar); dentro de esa sesión el usuario puede alternar qué cara es la activa (vía el nuevo `secondaryPreview.onSelect` de `imageAdjustModal.js`) tantas veces como quiera, y al aceptar se guarda el ajuste final de ambas caras en `working.caraFrontal.ajusteImagen`/`working.caraTrasera.ajusteImagen`; al cancelar en cualquier punto de la sesión se descarta todo.
