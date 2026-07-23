## (a) Anotaciones funcionales

- Fuera de alcance: cualquier cambio al ajuste de imagen de componentes con una sola imagen (`'ficha'`, vía `ui/componentModal.js`) — su comportamiento y firma de llamada a `openImageAdjustModal` no cambian.
- Fuera de alcance: cambiar el aspecto visual de los `design_*.html` de esta entrada más allá de lo que ilustran (posiciones fijas, títulos fijos, resaltado de foco); no se reutiliza su marcado/CSS.
- No ha hecho falta resolver ninguna duda adicional con el usuario: `description.md` ya deja el comportamiento nuevo completamente especificado (posiciones fijas, títulos fijos, mecanismo de foco por clic, foco inicial, caso sin imagen, y que Aceptar/Cancelar no cambian).

## (b) Solución técnica

1. **`ui/imageAdjustModal.js` — sustituir `secondaryPreview` por un modo de "caras fijas" (`faces`)**:
   - Cambiar la firma a `openImageAdjustModal({ shape, width, height, resource, adjustment, onAccept, faces, initialFocusKey })`, donde `faces` es un array opcional de entradas `{ key, label, shape, width, height, resource, adjustment }`.
   - Si no se pasa `faces` (caso de `'ficha'`, un único stage): mantener exactamente el comportamiento y marcado actuales con `shape/width/height/resource/adjustment/onAccept` de nivel superior — sin cambios observables para ese caso.
   - Si se pasa `faces`: pintar un stage por cada entrada del array, **en el mismo orden en que vienen** (primer elemento a la izquierda, segundo a la derecha — así se logra la posición fija: quien llama decide el orden una vez, no se reordena nunca) y con su `label` como título siempre visible encima del stage (nunca cambia de texto ni de sitio).
   - Mantener un estado interno independiente por cara: `{ zoom, posX, posY }` por `key`, inicializado desde el `adjustment` de cada entrada de `faces`.
   - Mantener `focusedKey` como estado interno del popup, inicializado a `initialFocusKey`. Los listeners de arrastre (mousedown/mousemove/mouseup) y el control de Zoom (slider + input numérico) siempre leen/escriben el estado de `focusedKey`; al cambiar el foco, el slider y el input de zoom se resincronizan de inmediato a los valores de la cara recién enfocada.
   - Un `mousedown` sobre el mask de una cara con `resource` que no sea la `focusedKey` actual cambia el foco a esa cara (actualiza clases visuales de inmediato) y, en el mismo gesto, arranca el arrastre sobre ella (evita exigir un clic adicional antes de poder mover la imagen recién enfocada). Un `mousedown` sobre la cara ya enfocada simplemente arrastra, como hoy.
   - Una cara sin `resource` se pinta con su hueco vacío (el fondo a cuadros ya existente, sin `<img>`), sin listener de click, sin `cursor: pointer` y nunca puede ser `focusedKey` (ni al inicio ni por clic).
   - Clases visuales: la cara enfocada usa el borde azul (`image-adjust-modal__mask--active`, reutilizado tal cual); las demás caras con imagen se ven atenuadas (opacidad reducida, reutilizando el estilo hoy en `--secondary`) y responden con `cursor: pointer`.
   - Al pulsar "Aceptar", invocar `onAccept` una única vez con un objeto `{ [key]: { zoom, posX, posY } }` para todas las entradas de `faces` (estado final de cada cara, se haya enfocado o no durante la sesión). Al pulsar "Cancelar" (o cerrar por fuera), no se invoca `onAccept` y se descarta todo el estado interno, igual que hoy.
   - Eliminar por completo `secondaryPreview`, su `onSelect`, y el marcado/etiquetas "Activa"/"Otra cara" (`primary-label`/`secondary-label`), ya sin ningún consumidor tras el punto 2.

2. **`ui/cardEditorModal.js` — simplificar `openAdjustSession`**:
   - Sustituir `openForKey`/`otherCaraKey`/`sessionAdjustments` (mecanismo de cierre/reapertura con intercambio de roles) por una única llamada a `openImageAdjustModal` con:
     ```js
     faces: [
       { key: 'caraFrontal', label: 'Frontal', shape: 'cuadrada', width: designWidth, height: designHeight, resource: frontalResource, adjustment: working.caraFrontal.ajusteImagen },
       { key: 'caraTrasera', label: 'Trasera', shape: 'cuadrada', width: designWidth, height: designHeight, resource: traseraResource, adjustment: working.caraTrasera.ajusteImagen },
     ],
     initialFocusKey: initialKey, // igual cálculo que hoy: frontal si tiene imagen, si no trasera
     onAccept: (adjustments) => {
       working.caraFrontal.ajusteImagen = adjustments.caraFrontal;
       working.caraTrasera.ajusteImagen = adjustments.caraTrasera;
       renderFaces();
     },
     ```
   - El resto de `openAdjustSession` (cálculo de `initialKey`, guarda temprana si ninguna cara tiene imagen, `getDesignSize`) se mantiene igual.

3. **`src/styles/main.css` — bloque "Image adjust modal (00029)"**:
   - Añadir una clase de título de cara siempre visible (p. ej. `.image-adjust-modal__stage-title`, encima del mask, mismo tratamiento tipográfico ya usado por las etiquetas actuales: `font-size: 0.75rem`).
   - Adaptar `.image-adjust-modal__stage--secondary` (opacidad reducida) para que aplique a "cara con imagen no enfocada" en vez de a un rol fijo de "secundaria"; mantener `.image-adjust-modal__mask--active` para la cara enfocada.
   - Añadir un estilo para el hueco vacío de una cara sin imagen (sin cursor especial, sin resaltado, solo el fondo a cuadros ya existente en `.image-adjust-modal__stage`).
   - Retirar `.image-adjust-modal__primary-label`, `.image-adjust-modal__secondary-label` y `.image-adjust-modal__stage--secondary.image-adjust-modal__stage--clickable` si quedan sin ningún uso tras el cambio.

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md` sección 5:

- En la entrada de **`ui/imageAdjustModal.js`**: sustituir la descripción del parámetro `secondaryPreview: { shape, width, height, resource, adjustment, onSelect }` (stage secundario de solo lectura + intercambio de roles cerrando/reabriendo el modal) por la del nuevo parámetro `faces: [{ key, label, shape, width, height, resource, adjustment }]` + `initialFocusKey`: N stages en posición fija (orden del array), cada uno con título fijo, foco interno conmutable por clic (sin cerrar/reabrir el modal), `onAccept` devolviendo el ajuste final de todas las caras a la vez. Mantener la mención de que sin `faces` el comportamiento es el de un único stage (idéntico al de antes de este cambio; sigue siendo lo que usa `'ficha'`).
- En la entrada de **`ui/cardEditorModal.js`**: sustituir la descripción de la "sesión de ajuste" con `sessionAdjustments`/`openForKey`/intercambio de roles por la nueva llamada única a `openImageAdjustModal` con `faces`/`initialFocusKey`, y quitar la mención al 00058 como el cambio que introdujo `onSelect` (ya no existe).
