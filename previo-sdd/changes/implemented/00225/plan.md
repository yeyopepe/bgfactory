- **Creation date**: 2026-09-02
- **Riesgo**: 3/10 — Riesgo bajo

## (a) Functional notes

**Out of scope:**

- No se añade arrastre para **mover** la modal por la pantalla (solo se pidió redimensionar; la modal sigue centrada por el flexbox de `.modal-overlay` mientras no se esté redimensionando).
- No se persiste el tamaño elegido entre aperturas del editor (cada apertura arranca en tamaño normal por defecto, igual que hoy el estado "maximizado").
- No se toca el comportamiento del botón "Maximizar/Restaurar" salvo lo imprescindible para que ignore temporalmente el tamaño manual y lo restaure.
- No se modifica el patrón compartido `ui/resizeHandle.js` ni su uso en `ui/componentList.js`: se reutiliza tal cual.

**Doubts resolved with the user:** (todas recogidas ya en `description.md`, sin nuevas dudas técnicas abiertas)

- Los lienzos de las caras escalan junto con la ventana al redimensionar (no solo el espacio en blanco).
- "Maximizar" se mantiene igual (tamaño casi pantalla completa); el redimensionado manual con anclas actúa sobre el tamaño "normal". Al maximizar se ignora el tamaño manual; al "Restaurar" se vuelve a él.
- El tamaño no se recuerda entre aperturas.
- Límite mínimo: el necesario para seguir mostrando cabecera, toolbar y al menos un lienzo con tamaño mínimo utilizable. Límite máximo: no salirse del área visible de la ventana del navegador.
- No es arrastrable para mover.

## (b) Technical solution

Concepto general: hoy `.card-editor-modal` no tiene `position`/`left`/`top`/`width`/`height` propios (se centra por flexbox y usa `width: fit-content`). Para que ambos manejadores de esquina tengan una esquina opuesta que anclar, en el `mousedown` de cualquiera de los dos manejadores hay que "congelar" la modal a posición absoluta con su geometría actual (mismo ajuste que hace `componentList.js` al iniciar su arrastre de cabecera). A partir de ahí, un tamaño "normal" manual (`manualSize = { width, height }`, variable local a `openVisualEditorModal`) sustituye a `fit-content` mientras no se maximice. `getEffectiveCanvasMaxSide()` pasa a derivar el lado del lienzo del alto realmente disponible en la modal manual, en vez de la constante fija `CANVAS_MAX_SIDE`, de modo que los lienzos escalen de forma continua durante el arrastre.

- [x] **`src/ui/visualEditorModal.js` — declarar el estado de tamaño manual.** Junto a `let maximized = false;` (línea ~257) añadir `let manualSize = null;` (local a `openVisualEditorModal`). Semántica: `null` = tamaño normal por defecto (comportamiento de hoy, `fit-content`); objeto `{ width, height }` en px = tamaño normal fijado por el usuario con los manejadores. Es el "tamaño normal" del que habla la pregunta de alcance: `maximized` lo ignora temporalmente y "Restaurar" vuelve a él.

- [x] **`src/ui/visualEditorModal.js` — helper para congelar la modal a posición absoluta.** Añadir una función local `freezeModalGeometry()` que, si la modal aún no está "congelada" (comprobar p.ej. `modal.style.position !== 'fixed'`), lea `modal.getBoundingClientRect()` y fije en estilo inline: `position: fixed`, `left`/`top` = `rect.left`/`rect.top` (px), `width`/`height` = `rect.width`/`rect.height` (px), `margin: 0`. Esto la saca del centrado flexbox de `.modal-overlay` dejándola exactamente donde está, para que el manejador `tl` tenga una esquina inferior derecha estable que anclar. Mismo patrón que `componentList.js` líneas ~457-459 al iniciar el arrastre de cabecera.

- [x] **`src/ui/visualEditorModal.js` — helper de clamp de tamaño de la modal.** Añadir función local `clampModalSize({ width, height })` que devuelve el tamaño acotado:
  - Mínimo ancho `MIN_EDITOR_MODAL_WIDTH` y mínimo alto `MIN_EDITOR_MODAL_HEIGHT` (nuevas constantes de módulo, ver tarea siguiente).
  - Máximo: no salirse del área visible del navegador tomando como ancla la esquina fija de cada manejador. Para el manejador `br` (ancla la esquina superior izquierda, en `left`/`top` ya congelados): `maxWidth = window.innerWidth - left`, `maxHeight = window.innerHeight - top`. Para el manejador `tl` (ancla la esquina inferior derecha): `maxWidth = right`, `maxHeight = bottom`, donde `right = left + startWidth` y `bottom = top + startHeight` capturados al empezar ese arrastre (igual que `tlStart.width + tlStart.left` en `componentList.js` línea ~616).
  - Devolver `{ width: min(max(width, MIN_W), maxW), height: min(max(height, MIN_H), maxH) }`.
  Como el clamp máximo depende de qué manejador arrastra, parametrizar: `clampModalSize(proposed, { maxWidth, maxHeight })` y que cada caller calcule sus dos topes.

- [x] **`src/ui/visualEditorModal.js` — constantes de tamaño mínimo de la modal.** Añadir junto a las demás constantes de módulo (líneas ~25-35): `const MIN_EDITOR_MODAL_WIDTH = 420;` y `const MIN_EDITOR_MODAL_HEIGHT = 360;`. Criterio: ancho suficiente para cabecera + un lienzo al lado del botón "Ajustar imagen…" y de la toolbar (`.card-editor-modal__toolbar` es `max-width: 16rem`); alto suficiente para cabecera (`~3.5rem`) + un lienzo a `CANVAS_MIN_SIDE` + fila de acciones + pie. Ajustar los valores concretos al probar (tarea de verificación).

- [x] **`src/ui/visualEditorModal.js` — suelo del lado de lienzo.** Añadir `const CANVAS_MIN_SIDE = 140;` (constante de módulo). Es el lado mínimo utilizable de un lienzo cuando la modal se encoge al mínimo; `getEffectiveCanvasMaxSide()` nunca devolverá menos que esto.

- [x] **`src/ui/visualEditorModal.js` — que `getEffectiveCanvasMaxSide()` contemple el tamaño manual.** Reescribir la función (líneas ~263-266) con tres ramas, en este orden:
  1. `if (maximized) return Math.min(window.innerHeight * 0.7, window.innerWidth * 0.42);` (rama de hoy, sin cambios).
  2. `if (manualSize) { ... }` — derivar el lado disponible del tamaño manual: partir del alto interior aprovechable de la modal = `manualSize.height` menos el alto de cabecera + toolbar + fila de acciones + pie (medirlo en runtime con `header.offsetHeight`, `footer.offsetHeight` y, si están disponibles, `toolbar.offsetHeight` y `facesRow` — o usar una estimación constante `EDITOR_CHROME_V = 210` si medir resulta frágil durante el arrastre). Devolver `Math.max(CANVAS_MIN_SIDE, Math.min(alturaDisponible, window.innerWidth * 0.42, CANVAS_MAX_SIDE * 3))`. El tope `window.innerWidth * 0.42` conserva el criterio actual de "dos lienzos + toolbar caben en el ancho". Permitir crecer por encima de `CANVAS_MAX_SIDE` (con un tope prudente como `CANVAS_MAX_SIDE * 3`) es lo que hace que el contenido "aproveche el espacio disponible" al agrandar la ventana.
  3. `return CANVAS_MAX_SIDE;` (tamaño normal por defecto de hoy, sin manualSize).

- [x] **`src/ui/visualEditorModal.js` — enganchar el manejador de esquina inferior derecha (`br`) a la modal.** Después de construir `modal`/`header`/`content`/`footer` y antes de `renderFaces()` final (o justo tras `overlay.appendChild(modal)`), llamar a `attachResizeHandle(modal, { ... })` con `corner` por defecto (`'br'`):
  - `axis: 'both'`.
  - `getScale: () => 1` (la modal se redimensiona en px de pantalla 1:1, no hay escala de preview).
  - `getSize: () => { freezeModalGeometry(); const r = modal.getBoundingClientRect(); return { width: r.width, height: r.height }; }` — congela al empezar y devuelve el tamaño de partida.
  - `clamp: (proposed) => { const r = modal.getBoundingClientRect(); return clampModalSize(proposed, { maxWidth: window.innerWidth - r.left, maxHeight: window.innerHeight - r.top }); }`.
  - `onResize: ({ width, height }) => { modal.style.width = ` + "`${width}px`" + `; modal.style.height = ` + "`${height}px`" + `; manualSize = { width, height }; renderFaces(); }` — fija tamaño y re-renderiza las caras para que los lienzos escalen de forma continua durante el arrastre.
  - `onResizeEnd: ({ width, height }) => { modal.style.width = ` + "`${width}px`" + `; modal.style.height = ` + "`${height}px`" + `; manualSize = { width, height }; renderFaces(); }`.
  - No añadir `clamp` de alto contra el contenido: `.modal__content` ya tiene `overflow-y: auto`.

- [x] **`src/ui/visualEditorModal.js` — enganchar el manejador de esquina superior izquierda (`tl`) a la modal.** Segunda llamada `attachResizeHandle(modal, { corner: 'tl', ... })` sobre el mismo host, patrón calcado de `componentList.js` líneas ~604-645:
  - `const tlStart = { left: 0, top: 0, width: 0, height: 0 };` (objeto local, capturado en `getSize`).
  - `axis: 'both'`, `getScale: () => 1`.
  - `getSize: () => { freezeModalGeometry(); const r = modal.getBoundingClientRect(); tlStart.left = r.left; tlStart.top = r.top; tlStart.width = r.width; tlStart.height = r.height; return { width: r.width, height: r.height }; }`.
  - `clamp: (proposed) => clampModalSize(proposed, { maxWidth: tlStart.left + tlStart.width, maxHeight: tlStart.top + tlStart.height })` — la esquina inferior derecha (en `tlStart.left+width` / `tlStart.top+height`) es la que queda fija, así que el máximo es esa coordenada.
  - `onResize: ({ width, height, dx, dy }) => { modal.style.left = ` + "`${tlStart.left + dx}px`" + `; modal.style.top = ` + "`${tlStart.top + dy}px`" + `; modal.style.width = ` + "`${width}px`" + `; modal.style.height = ` + "`${height}px`" + `; manualSize = { width, height }; renderFaces(); }` — `dx`/`dy` los devuelve el propio `resizeHandle.js` para `corner: 'tl'` (son negativos al agrandar) y reposicionan la esquina superior izquierda manteniendo fija la inferior derecha.
  - `onResizeEnd`: idéntico a `onResize` (fija estilos + `manualSize` + `renderFaces()`).

- [x] **`src/ui/visualEditorModal.js` — que "Maximizar" ignore el tamaño manual y "Restaurar" lo devuelva.** En el listener de `maximizeBtn` (líneas ~290-295):
  - Al **maximizar** (`maximized` pasa a `true`): NO borrar `manualSize`. Quitar los estilos inline de geometría que pisan a `.card-editor-modal--maximized` — poner `modal.style.width = ''`, `modal.style.height = ''`, `modal.style.position = ''`, `modal.style.left = ''`, `modal.style.top = ''`, `modal.style.margin = ''` para que vuelva a mandar el CSS (`max-width: 90vw; max-height: 90vh` centrado por flexbox). `getEffectiveCanvasMaxSide()` ya devuelve la rama `maximized` primero, así que el lienzo usa el tamaño maximizado aunque `manualSize` siga puesto.
  - Al **restaurar** (`maximized` pasa a `false`): si `manualSize` no es `null`, volver a congelar y aplicar ese tamaño — `freezeModalGeometry()` centraría en la posición actual; para restaurar centrado, en su lugar poner `modal.style.position = 'fixed'`, `modal.style.width = ` + "`${manualSize.width}px`" + `, `modal.style.height = ` + "`${manualSize.height}px`" + `, y `left`/`top` calculados para centrar: `left = (window.innerWidth - manualSize.width) / 2`, `top = (window.innerHeight - manualSize.height) / 2` (con `margin: 0`). Si `manualSize` es `null`, limpiar todos los estilos inline de geometría (comportamiento de hoy: vuelve a `fit-content` centrado).
  - En ambos casos, tras ajustar, seguir llamando a `renderFaces()` como hoy.

- [x] **`src/ui/visualEditorModal.js` — reajustar tamaño manual si la ventana del navegador se encoge.** En `handleWindowResize()` (líneas ~397-400), que hoy solo re-renderiza si `maximized`: añadir rama para `manualSize`. Si `!maximized && manualSize`, reclampear `manualSize` contra el nuevo viewport tomando la esquina superior izquierda actual como ancla (`maxWidth = window.innerWidth - modal.getBoundingClientRect().left`, etc.), reasignar `modal.style.width`/`height` y `manualSize`, y `renderFaces()`. Evita que la modal quede parcialmente fuera de pantalla si se reduce la ventana tras haberla agrandado a mano.

- [x] **`src/ui/visualEditorModal.js` — actualizar la ayuda del editor.** En `buildHelpHtml()` (líneas ~45-60), añadir un `<li>` describiendo el redimensionado con los manejadores de esquina (p.ej. *"<b>Redimensionar</b> la ventana del editor arrastrando el manejador de su esquina inferior derecha o superior izquierda."*), en la misma línea de estilo que el `<li>` ya existente de "Maximizar".

- [x] **`src/styles/main.css` — posicionamiento de los manejadores de la modal.** `.card-editor-modal` necesita `position: relative` en estado normal para que los `.resize-handle` (que son `position: absolute`) se anclen a sus esquinas (hoy la modal no declara `position`; hereda `static`). Añadir `position: relative;` a `.card-editor-modal` (línea ~1793). Cuando el JS la congela a `position: fixed` en estilo inline eso sigue siendo un contexto de posicionamiento válido para los handles. Verificar que los `.resize-handle` de la modal no chocan visualmente con el grip de los lienzos internos (los de la modal quedan en las esquinas del recuadro blanco completo, los de lienzo dentro); si hace falta, subir el `z-index` de `.card-editor-modal > .resize-handle` por encima de `.modal__content`.

- [x] **`src/styles/main.css` — que `.card-editor-modal--maximized` gane a los estilos inline.** Los estilos inline de `width`/`height`/`position`/`left`/`top` que fija el JS tienen más especificidad que cualquier clase. La tarea de JS de "Maximizar" ya los limpia (`modal.style.width = ''` …) antes de añadir la clase, así que no debería hacer falta `!important`; dejar constancia aquí de que la limpieza de estilos inline en el handler de maximizar es lo que hace innecesario tocar `.card-editor-modal--maximized`. Si al probar se ve que algún inline persiste, añadir a `.card-editor-modal--maximized` los `width: 90vw !important; height: auto !important; position: static !important; inset: auto !important;` mínimos.

## (d) Style changes

La documentación de estilo (`previo-sdd/docs/style/`) está sin poblar todavía (solo referencias en comentarios del código a `design/docs/style/03-modales-menus.md`, que no existe como fichero). No se crea documentación de estilo nueva en este cambio; el patrón de manejador de redimensionado ya está descrito en los comentarios de `src/ui/resizeHandle.js` y `src/styles/main.css` (bloque `.resize-handle` / `.resize-handle--tl`), y este cambio solo lo reutiliza sobre un host más (la modal del editor) sin introducir un patrón visual nuevo. Si `pv-do` detecta que la style bible pasa a estar poblada, la nota a añadir sería: "`.card-editor-modal` es redimensionable con doble manejador de esquina (`br` + `tl`), igual que el panel flotante `.component-panel`; el tamaño no se persiste."

## (e) Verification

- [x] Abrir el editor desde un componente **carta** ("Editar diseño de la carta"): aparece centrado en tamaño normal, con un manejador de grip en la esquina inferior derecha y otro en la superior izquierda del recuadro blanco de la modal (además de los grips de cada lienzo interno).
- [x] Arrastrar el manejador **inferior derecho** hacia abajo-derecha: la modal crece manteniendo fija su esquina superior izquierda, y los dos lienzos (frontal/trasera) escalan de forma continua durante el arrastre (no a saltos), aprovechando el espacio nuevo.
- [x] Arrastrar el manejador **inferior derecho** hacia arriba-izquierda hasta el mínimo: la modal deja de encogerse cuando aún se ven cabecera, toolbar y al menos un lienzo a tamaño utilizable; nunca colapsa ni oculta el pie con "Aceptar/Cancelar".
- [x] Arrastrar el manejador **superior izquierdo**: la modal crece/encoge en la dirección opuesta manteniendo fija su esquina inferior derecha; los lienzos escalan igual.
- [x] Intentar arrastrar cualquiera de los dos manejadores más allá del borde de la ventana del navegador: la modal se detiene en el borde visible (no aparece scroll de página ni se sale parte de la modal fuera de la pantalla).
- [x] Con la modal redimensionada a un tamaño personalizado, pulsar **"Maximizar"**: pasa al tamaño casi de pantalla completa de siempre (ignora el tamaño manual). Pulsar **"Restaurar"**: vuelve exactamente al tamaño personalizado que se había fijado con los manejadores, centrado.
- [x] Cerrar el editor (Aceptar o Cancelar) y volver a abrirlo sobre el mismo o distinto componente: arranca de nuevo en el tamaño normal por defecto (no recuerda el tamaño manual anterior).
- [x] Repetir la prueba de redimensionado abriendo el editor desde un componente **tablero personalizado** ("Editar diseño del tablero"): una sola cara, mismo comportamiento de manejadores y de escalado del lienzo, mismos límites.
- [x] Con la modal agrandada a mano, reducir el tamaño de la ventana del navegador: la modal se reajusta para no quedar fuera del área visible.
- [x] Mover un cuadro de texto / figura y redimensionarlo con su propio grip de esquina dentro de un lienzo: sigue funcionando igual que antes (los manejadores de la modal no interfieren con los de los elementos).
- [x] El icono de ayuda (?) de la cabecera del editor menciona ahora el redimensionado con manejadores de esquina.
