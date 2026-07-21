## (a) Anotaciones funcionales

**Fuera de alcance:**
- No se toca `editMode.js`: el flujo de alta (`componentTypeModal` → `createDefaultComponent` → `componentModal`) ya es genérico por tipo, no requiere cambios para añadir `'ficha'`.
- El editor de ajuste de imagen no soporta rotación, solo posición (arrastrar) y zoom — no se pide en `description.md`.
- No se implementa wrap multilínea "inteligente" del texto de fondo: se autoajusta como una sola línea que se encoge hasta caber (más simple, cubre el caso descrito de "texto centrado que se ajusta al tamaño de la ficha"); si en el futuro se pide texto largo multilínea, será un cambio aparte.
- No se añade ninguna excepción nueva de `STYLE_BIBLE.md` §13 (sin bisel/sombra en la ficha) — confirmado en el reanálisis con el usuario.

**Dudas resueltas (reanálisis de la entrada, ver `description.md`):**
- El cambio `00020` ("Dado") ya está cerrado e implementado (no pendiente) — usado como precedente de patrón ya construido, no como dependencia bloqueante.
- `STYLE_BIBLE.md` §13 ya cubre bisel de `'tablero'` y `'dado'` como excepción — la ficha no añade una tercera.
- Verificación de orden (`get-max-change-codes.py`): `closed` llega a `00041`, por delante de este `00029` (`inProgress`); revisado y no hay ningún change/fix posterior (`00030`-`00041`) que afecte a fichas, tokens o edición de imagen — sin solapamiento ni necesidad de más cambios en la documentación funcional.

## (b) Solución técnica

1. **`src/ui/componentTypeModal.js`** — añadir `{ value: 'ficha', label: 'Ficha' }` al array `COMPONENT_TYPES`.

2. **`src/ui/componentModal.js`** — registrar el tipo `'ficha'` siguiendo el mismo patrón que `'tablero'`/`'dado'`/`'documento'`:
   - Constante `DEFAULT_FICHA_SIZE = 60`.
   - `DEFAULT_FICHA_PROPERTIES = { forma: 'circular', bordeColor: '#000000', bordeGrosor: 2, fondoTipo: 'color', colorFondo: '#cccccc', texto: '', imagenResourceId: null, ajusteImagen: { zoom: 100, posX: 50, posY: 50 } }`. `ajusteImagen` guarda el ajuste de imagen con la misma semántica que `background-size`/`background-position` de CSS: `zoom` en `100–300` (100 = "cover" exacto de la forma, hasta 3×), `posX`/`posY` en `0–100` (equivalente a los porcentajes de `background-position`). Todos los bloques de propiedades (`colorFondo`, `texto`, `imagenResourceId`+`ajusteImagen`) conviven siempre en `properties`, igual que `fondoTipo` en `'tablero'` — cambiar `fondoTipo` no borra nada.
   - En `createDefaultComponent(type)`: rama `else if (type === 'ficha')` que fija `width`/`height` a `DEFAULT_FICHA_SIZE` y clona `DEFAULT_FICHA_PROPERTIES` (con copia propia de `ajusteImagen`, no la misma referencia, para que cada ficha tenga su propio objeto mutable).
   - En `renderSpecificTab()`: rama `else if (workingComponent.type === 'ficha')` → `renderFichaSpecificFields(specificContent)`.
   - Nueva función `renderFichaSpecificFields(container)`:
     - Select "Forma" (`cuadrada`/`circular`) → `props.forma`.
     - Color y grosor de borde (mismo patrón que `renderBoardSpecificFields`, pero `bordeGrosor` con `min = 0` — a diferencia del tablero, `0` es válido y significa "sin borde", según `description.md`).
     - Select "Fondo" (`color`/`texto`/`imagen`) → `props.fondoTipo`, con bloques condicionales (mismo patrón `updateTipoFieldsVisibility` que `renderDocumentoSpecificFields`):
       - `color`: `<input type="color">` → `props.colorFondo`.
       - `texto`: `<textarea>` (o `<input>`) → `props.texto`. Sin campo de tamaño de fuente (se autoajusta en el renderizado).
       - `imagen`: botón "Elegir imagen" que abre `openBoardImageModal({ properties: props, resources: getResources(), onAccept })` (reutilizado tal cual, ya es genérico: solo lee `properties.imagenResourceId` y devuelve un `resourceId`) — al aceptar, fija `props.imagenResourceId`, **reinicia** `props.ajusteImagen = { zoom: 100, posX: 50, posY: 50 }`, y abre automáticamente el editor de ajuste (`openImageAdjustModal`, tarea 3). Botón adicional "Ajustar imagen…" (deshabilitado si no hay `imagenResourceId`) para reabrirlo bajo demanda sin volver a elegir imagen, pasando `workingComponent.width`/`height`/`forma` actuales para que el editor refleje la forma real.
   - Nota: `openBoardImageModal` tiene el título fijo `"Configurar fondo — Imagen"` (pensado originalmente solo para `'tablero'`); se le añade un parámetro opcional `title` (por defecto ese mismo texto, sin romper la llamada existente de `'tablero'`) para que la ficha pueda pasar un texto más genérico ("Elegir imagen").

3. **Nuevo fichero `src/ui/imageAdjustModal.js`** — editor reutilizable de ajuste de imagen (mover/zoom/recorte sobre una forma), agnóstico del tipo de componente que lo use (no acoplado a `'ficha'`):
   - Expone `openImageAdjustModal({ shape, width, height, resource, adjustment, onAccept })`.
   - Modal sin tabs (mismo patrón visual `modal-overlay`/`modal`/`modal__content`/`modal__footer`). Dentro, un "stage" que escala `width`×`height` a un tamaño de previsualización máximo (p.ej. 260px de lado mayor, preservando proporción) y aplica de máscara la forma (`border-radius: 50%` si `shape === 'circular'`, `0` si `'cuadrada'`) con `overflow: hidden`.
   - El interior del stage es un `div` con `background-image: url(resource.dataUrl)`, `background-size` en px (`iw/ih` naturales de la imagen × `baseScale` de cobertura × `adjustment.zoom/100`) y `background-position` en `%` directamente desde `adjustment.posX`/`posY` — sin necesidad de `<img>` ni cálculos de arrastre en px absolutos, ya que `background-position` porcentual ya tiene la semántica "de un extremo a otro" que se necesita.
   - Arrastre (`mousedown`/`mousemove`/`mouseup` sobre el stage, mismo patrón que los manejadores de movimiento de `componentRenderer.js` pero sin división por zoom de mundo, al no estar dentro de la mesa) traduce el delta de píxeles arrastrados a delta de `posX`/`posY` (proporcional al "espacio de sobra" de la imagen escalada dentro del stage), clampeado a `[0, 100]`.
   - `<input type="range" min="100" max="300">` para `zoom`, actualiza en vivo el stage.
   - Footer "Cancelar"/"Aceptar" — "Aceptar" llama a `onAccept({ zoom, posX, posY })`.
   - Necesita conocer las dimensiones naturales de la imagen (`Image().naturalWidth/Height`, cargada de forma asíncrona) antes de calcular `baseScale`; hasta que cargue, el stage muestra un fondo neutro (mismo criterio que otros estados de carga del proyecto).

4. **`src/ui/componentRenderer.js`** — añadir el renderizado del tipo `'ficha'`, mismo patrón estructural que los demás tipos (posición/tamaño, tooltip/label, selección, movimiento, redimensionado):
   - `MIN_FICHA_SIZE = 20` y `ficha: 'Ficha'` en `COMPONENT_TYPE_LABELS`.
   - Nueva rama `else if (component.type === 'ficha')`: crea `div.ficha`, aplica `border-radius: 50%`/`0` según `props.forma`, borde (`border-width: ${bordeGrosor}px`; si `bordeGrosor === 0`, `border-style: none`), y fondo según `props.fondoTipo`:
     - `color`: `backgroundColor = props.colorFondo`.
     - `texto`: contenedor flex centrado (`display:flex; align-items:center; justify-content:center`) con un `span` cuyo `font-size` se autoajusta con un helper local `fitTextToBox(el, text, maxWidth, maxHeight)` (reduce el tamaño de fuente en un bucle acotado hasta que `el.scrollWidth <= maxWidth` y `el.scrollHeight <= maxHeight`, con un mínimo de p.ej. 6px para evitar bucles infinitos con texto vacío/absurdo).
     - `imagen`: mismo cálculo de `background-size`/`background-position` que el editor (tarea 3), reutilizando la misma lógica de "cover + zoom" (pequeña función compartida, p.ej. exportada desde `imageAdjustModal.js`, para no duplicar la fórmula en dos ficheros) contra el recurso de `props.imagenResourceId` (si no existe ya —recurso borrado—, cae a `colorFondo` como fondo de reserva, igual que `'tablero'` cuando no encuentra el recurso).
     - Bloques de selección/movimiento/redimensionado idénticos en estructura a los ya existentes para `'dado'` (redimensionado con ambos ejes, sin forzar cuadrado — a diferencia del dado, la ficha si puede tener otra proporción tras redimensionar, igual que `'tablero'`).
   - Reutiliza `getResources()` (ya importado) para resolver `imagenResourceId`.

5. **`src/styles/main.css`** — añadir bloque `.ficha`/`.ficha--selectable`/`.ficha--selected`/`.ficha--movable` siguiendo el mismo patrón BEM que `.board`/`.dice`/`.document-viewer` (contorno discontinuo azul en hover/selección, cursor `move` si aplica), sin ninguna excepción de sombra/bisel — coherente con `STYLE_BIBLE.md` §13 (la ficha no es una excepción). Estilos base del stage/máscara de `imageAdjustModal.js` (`.image-adjust-modal__stage`, `.image-adjust-modal__mask`, etc.) también aquí, mismo patrón que `.board-image-modal__*`.

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`:
- Sección 4, "Tipos de componente implementados": añadir un quinto punto `'ficha'` (cambio 00029) describiendo `properties` (`forma`, `bordeColor`/`bordeGrosor` con `0` = sin borde, `fondoTipo` y sus tres bloques `colorFondo`/`texto`/`imagenResourceId`+`ajusteImagen`), tamaño por defecto (60×60px, redimensionable en ambos ejes sin forzar proporción) y la particularidad de `bordeGrosor` admitiendo `0` (a diferencia de `'tablero'`).
- Sección 5, "Capa UI — módulos reutilizables": añadir entrada para `ui/imageAdjustModal.js` (editor reutilizable de ajuste de imagen, agnóstico de tipo de componente, pensado para que futuros tipos con fondo de imagen lo reutilicen) y actualizar la entrada de `ui/componentModal.js` para mencionar el nuevo submodal usado por `'ficha'`.

## (d) Cambios en estilo

No aplica — la ficha no introduce ninguna convención visual nueva ni excepción a `STYLE_BIBLE.md` §13 (confirmado en el reanálisis funcional: "sin necesitar excepción de estilo"). Solo se documentan clases BEM nuevas siguiendo convenciones ya existentes, sin cambios de convención.
