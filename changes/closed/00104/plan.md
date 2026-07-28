- **Código**: 00104

## (a) Anotaciones funcionales

- Fuera de alcance: el componente genérico "Texto" suelto sobre la mesa (fuera del editor de cartas) no se toca — ya tiene su propio mecanismo de selección (`.text-box--selectable`/`.text-box--selected` en `componentRenderer.js`), independiente de este cambio.
- Fuera de alcance: no se introduce ningún límite de posición (clamping) a los bordes de la carta, ni con ratón ni con teclado — se mantiene la libertad ya existente hoy.
- Pregunta resuelta con el usuario: la descripción dice "Solo puede haber un cuadro seleccionado a la vez por cara", lo que era ambiguo entre selección global (una sola para todo el editor) o independiente por cara (frontal y trasera con su propia selección simultánea). Respuesta: **selección global única** — solo puede haber un cuadro seleccionado en todo el editor, sea cual sea la cara; seleccionar uno en la otra cara deselecciona el anterior. Esto también resuelve sin ambigüedad qué cuadro mueven las flechas del teclado.

## (b) Solución técnica

1. **Estado de selección (`cardEditorModal.js`, dentro de `openCardEditorModal`)**: añadir una variable de closure `let selected = null;` con forma `{ caraKey, id }` (o `null` si no hay selección). Vive a nivel de la función `openCardEditorModal` (no de `renderFace`/`renderTextBox`), para sobrevivir a las llamadas a `renderFaces()` que reconstruyen todo el DOM de las caras — mismo motivo por el que `editMode.js` mantiene `selectedComponentId` fuera de `renderEditMode` (sección 3 de `ARCHITECTURE.md`).
   - Función helper `selectTextBox(caraKey, id)`: asigna `selected = { caraKey, id }` y llama a `renderFaces()`.
   - Función helper `deselectTextBox()`: si `selected` no es ya `null`, lo pone a `null` y llama a `renderFaces()` (evitar re-render si ya no había selección).

2. **Selección con clic simple (`renderTextBox`)**: añadir un listener `click` sobre `el` (el elemento del cuadro de texto) que llama a `selectTextBox(caraKey, textBox.id)` y hace `e.stopPropagation()`. Los eventos `click` del navegador se disparan tras `mouseup` sobre el mismo elemento donde empezó el `mousedown`, independientemente de cuánto se haya movido el ratón entre medias (no hay arrastre nativo HTML5 aquí, es posicionamiento manual vía `mousemove`/`mouseup` en `document`) — esto cubre gratis el caso "arrastrar con ratón también selecciona": al soltar el ratón sobre el propio cuadro tras arrastrarlo, el `click` se dispara igual y selecciona. No hace falta lógica de umbral de distancia aparte.
   - El `dblclick` ya existente (línea ~359) también debe llamar a `e.stopPropagation()` (ya lo hace) — como el diseño pide que abrir la modal de edición **deseleccione**, dentro de ese mismo listener, antes de `openCardTextBoxModal(...)`, llamar a `deselectTextBox()`. Nota: `dblclick` en el DOM va precedido de dos eventos `click` (que seleccionan dos veces sin efecto visible relevante) y luego el propio `dblclick` deselecciona — coherente con el diagrama de estados de `description.md`.

3. **Deselección al hacer clic fuera (`renderFace`)**: añadir un listener `click` sobre `canvasInner` (el contenedor donde se insertan `faceImg` y los cuadros de texto) que compruebe `e.target === canvasInner` (o `e.target === canvas`, por si el clic cae en el borde) y, si es así, llame a `deselectTextBox()`. Como los cuadros de texto ya hacen `stopPropagation()` en su propio `click`, un clic sobre un cuadro nunca llega a este listener; solo llega cuando el clic es realmente sobre el lienzo vacío.
   - Un clic sobre un cuadro de texto de la **otra** cara ya deselecciona/selecciona correctamente sin lógica adicional: `selectTextBox` sobrescribe `selected` con el nuevo `{caraKey, id}` sea cual sea el `caraKey` anterior (selección global, ver apartado (a)).

4. **Indicador visual de selección (`renderTextBox` + `main.css`)**: en `renderTextBox`, añadir la clase `card-editor-modal__textbox--selected` al elemento `el` cuando `selected?.caraKey === caraKey && selected?.id === textBox.id`. En `src/styles/main.css`, junto a la regla existente `.card-editor-modal__textbox:hover` (línea ~1127), añadir:
   ```css
   .card-editor-modal__textbox--selected {
     outline: 2px solid var(--accent-blue);
     outline-offset: 2px;
   }
   ```
   Sólido y con offset, claramente distinto del hover ya existente (`1px dashed`, sin offset) y del propio borde configurable del contenido (`textBox.bordeActivo`, que sigue aplicándose vía `el.style.border` de forma independiente). No reutilizar los valores de `.text-box--selectable.text-box--selected` (`3px dashed` + `offset 4px`) tal cual: ese patrón es del componente "Texto" suelto sobre la mesa (fuera de alcance, ver (a)); aquí definimos un valor propio del editor de cartas, coherente en espíritu (contorno sólido, offset) pero no una regla compartida.

5. **Movimiento con flechas del teclado (`cardEditorModal.js`, `openCardEditorModal`)**: añadir un listener `keydown` sobre `document`, registrado una sola vez al abrir la modal (junto al resto de wiring de `overlay`/`footer`, cerca de donde se añade `overlay` a `document.body`), y **eliminado explícitamente** cuando la modal se cierra (Cancelar, Aceptar, o clic fuera del overlay) para no dejar el listener colgado en `document` tras cerrar el editor — los tres puntos de cierre (`cancelBtn` click, `acceptBtn` click, y el click-fuera del overlay) deben llamar a una función común `cleanup()` que haga `document.removeEventListener('keydown', handleKeyDown)` antes o junto a `overlay.remove()`.
   - `handleKeyDown(e)`:
     - Si `!selected`, no hacer nada.
     - Si `document.activeElement` es `HTMLInputElement`/`HTMLTextAreaElement` (mismo criterio que `isTextEditableElement` de `globalShortcuts.js`, reimplementado localmente o extraído — ver nota de reutilización más abajo), no hacer nada (deja que el input maneje sus propias flechas, p.ej. el campo numérico de grosor de borde).
     - Si `e.key` no es una de `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`, no hacer nada.
     - `e.preventDefault()` (evita que la página haga scroll con las flechas).
     - `const step = e.shiftKey ? 10 : 1;`
     - Localizar el `textBox` real: `const cara = working[selected.caraKey]; const textBox = cara.textBoxes.find((tb) => tb.id === selected.id);` (si no se encuentra — por ejemplo se borró desde la modal de edición sin pasar por `deselectTextBox`, aunque ese flujo ya deselecciona — salir sin hacer nada, defensivo).
     - Actualizar `textBox.x`/`textBox.y` según la flecha (sin clamping, ver (a)) y llamar a `renderFaces()` para reflejar la nueva posición — mismo patrón que el resto de mutaciones de este fichero (todas pasan por `renderFaces()`), sin necesidad de tocar el DOM del cuadro directamente a mano.
   - No hay colisión con `src/ui/globalShortcuts.js` (`initGlobalShortcuts`): ese módulo solo escucha `Escape`/`Enter`/`Delete`, nunca flechas, así que ambos listeners de `keydown` en `document` conviven sin pisarse.
   - Nota de reutilización: valorar extraer `isTextEditableElement` de `globalShortcuts.js` a un helper compartido (p.ej. `src/ui/domUtils.js` si existiera, o quedarse en `globalShortcuts.js` exportándola) en vez of duplicar la función en dos ficheros. Si no existe ya un sitio natural para ello, se puede duplicar la función localmente (3 líneas) sin crear un módulo nuevo solo para esto — decisión de bajo impacto, a tomar durante la implementación según lo que ya exista en el árbol de `ui/`.

6. **Ayuda completa del editor de cartas (`cardEditorModal.js`, cabecera)**: en `openCardEditorModal` (línea ~35-38), sustituir `header.textContent = 'Editor de cartas';` por una estructura con un `span` para el título y el icono de ayuda junto a él:
   ```js
   const headerTitle = document.createElement('span');
   headerTitle.textContent = 'Editor de cartas';
   header.appendChild(headerTitle);
   header.appendChild(createHelpIcon({ html: HELP_HTML }));
   ```
   - Import nuevo: `import { createHelpIcon } from './helpIcon.js';` (patrón ya usado en `componentModal.js`).
   - `header` (clase `.modal__header`) no tiene hoy ningún `display: flex`, así que hay que añadir una regla CSS para que el título y el icono queden en fila con separación — reutilizar el mismo criterio que otros headers con contenido en fila (p.ej. `.modal__header--error`/`.modal__header--success`, que ya usan `display: flex; align-items: center;`). Añadir en `main.css`, cerca de `.card-editor-modal` (línea ~1053), una clase específica en vez de tocar `.modal__header` genérico (que otras modales usan como bloque simple de texto):
     ```css
     .card-editor-modal .modal__header {
       display: flex;
       align-items: center;
       gap: 0.5rem;
     }
     ```
   - `HELP_HTML` (constante de módulo en `cardEditorModal.js`, junto a `CANVAS_MAX_SIDE`/`MIN_TEXT_BOX_DESIGN_SIZE`): contenido HTML con el listado de funcionalidades del `description.md` (proporción, imagen+ajuste por cara, borde por cara, añadir cuadro de texto, mover con ratón, redimensionar arrastrando esquina, editar con doble clic, seleccionar+mover con flechas 1px/10px con Shift, aceptar/cancelar) — usar `html` (no `text`) en `createHelpIcon`, ya que el contenido supera `MODAL_THRESHOLD` (200 caracteres) y debe mostrarse como modal, no tooltip; construir el HTML como una lista `<ul><li>…</li></ul>`, mismo criterio visual que cualquier otro contenido de `openHelpModal` (usa `content.innerHTML` directamente, sin sanitizar — igual que el resto de usos existentes de `createHelpIcon`, contenido siempre literal del propio código, nunca de datos de usuario).
   - Esta ayuda es puramente informativa y no depende de la cara activa ni de si hay algo seleccionado — se registra una vez al abrir la modal, sin relación con `selected`/`renderFaces()`.

Orden de implementación sugerido: 1 → 2 → 3 → 4 (selección completa y visible) → 5 (movimiento con teclado, depende de que la selección ya exista) → 6 (ayuda, independiente del resto, puede ir en cualquier momento).

No aplica sección (c) (no se modifica arquitectura básica del proyecto: el modelo de datos `TextBox` no cambia, solo se añade interacción efímera en la capa `ui`).

No aplica sección (d) (no se modifica ni amplía el estilo visual general del proyecto: los nuevos estilos —outline de selección, header en fila— son detalles de implementación acotados al editor de cartas, del mismo tipo que excepciones ya documentadas puntualmente en el propio código, no un cambio de la guía de estilo).
