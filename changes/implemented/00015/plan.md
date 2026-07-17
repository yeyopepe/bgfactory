## (a) Anotaciones funcionales

- Fuera de alcance: no se añade ninguna restricción de zona, límite de mesa ni colisión entre componentes — el movimiento en Modo Juego, cuando está habilitado, es completamente libre por toda la mesa, sin ningún tope adicional (confirmado por el usuario).
- Fuera de alcance: el comportamiento de movimiento en modo edición no cambia. Modo edición sigue permitiendo mover cualquier componente independientemente de si tiene marcado "Mover en Modo Juego" o no — ese checkbox solo condiciona el arrastre en Modo Juego, nunca en el editor.
- Fuera de alcance: el icono de ayuda no contempla activación por teclado/foco (solo ratón: hover para tooltip, click para abrir modal) — confirmado por el usuario, coherente con que el resto de la app tampoco tiene hoy navegación por teclado.
- Corrección técnica sobre `description.md`: el editor no tiene hoy ningún cursor "de arrastre" diferenciado que reutilizar (solo `pointer` + contorno discontinuo en elementos *seleccionables*, concepto distinto de "arrastrable"). Se crea un cursor `move` nuevo, exclusivo de los componentes arrastrables en Modo Juego.
- Duda resuelta: el icono de ayuda **sustituye** al texto de ayuda fijo que mostraba la maqueta inicial — la ayuda solo es visible al interactuar con el icono (hover/click), no permanece visible por defecto.
- Duda resuelta: el contenido de ayuda de este checkbox concreto ("Permite arrastrar este componente por toda la mesa mientras se juega. Desactivado por defecto.") es texto plano y tiene menos de 200 caracteres, por lo que en este caso se renderiza siempre como tooltip, nunca como modal — la rama "modal" del componente de ayuda no tiene un caso de uso real todavía en esta entrada, pero se implementa igualmente porque el componente se define como genérico y reutilizable (no exclusivo de este checkbox).

## (b) Solución técnica

1. **`src/core/component.js`** — añadir el parámetro `moverEnModoJuego = false` a `createComponent()` y devolverlo como campo del objeto creado, al mismo nivel que `id`/`type`/`x`/`y`. `updateComponent()` no necesita cambios: ya propaga cualquier campo adicional vía spread.

2. **`src/ui/helpIcon.js`** (nuevo módulo, componente reutilizable de ayuda) — expone `createHelpIcon({ text, html })`, que construye y devuelve un `span.help-icon` con el símbolo "?" y dos modos de contenido, mutuamente excluyentes (se pasa `text` o `html`, nunca ambos):
   - **Modo tooltip**: cuando se pasa `text` y `text.length < 200`. Añade un `span.help-icon__tooltip` interno (oculto por CSS salvo en `:hover` del `.help-icon`, vía selector `.help-icon:hover .help-icon__tooltip`), con el texto vía `textContent` (sin riesgo de inyección de marcado).
   - **Modo modal**: en cualquier otro caso — `html` presente (contenido con formato, se asume siempre "largo o con formato" por definición), o `text` con `length >= 200`. En este modo, el `click` sobre el icono abre una modal reutilizando el mismo patrón DOM/CSS que `componentModal.js` (`div.modal-overlay` > `div.modal` con `modal__header`/`modal__content`/`modal__footer`, botón "Cerrar" con clase `btn-cancel`), montada sobre `document.body` y cerrada al hacer click fuera o en "Cerrar". El contenido se inserta con `textContent` si viene de `text`, o `innerHTML` si viene de `html` (contenido de ayuda definido por quien llama al componente en el propio código, no dato de usuario — no hay superficie de inyección).
   - No se implementa detección automática de "si el texto tiene formato" a partir de un único string: quien usa el componente decide explícitamente pasando `text` (plano) o `html` (con formato), evitando heurísticas frágiles de sniffing de contenido.

3. **`src/styles/main.css`** —
   - Nuevas reglas BEM para el icono de ayuda (junto a un bloque nuevo "Help icon" al final de la hoja): `.help-icon` (16px, circular, fondo `#3a3a40` ligeramente diferenciado — o token nuevo si se prefiere, `color: var(--text-light)`, `font-size: 0.7rem`, `cursor: help`), `.help-icon:hover` (fondo `var(--accent-blue)`), `.help-icon__tooltip` (`position:absolute`, oculto por defecto, fondo oscuro, `color: var(--text-light)`, `padding: 0.5rem 0.65rem`, `border-radius: 4px`, `font-size: 0.75rem`, `box-shadow: 0 4px 20px rgba(0,0,0,0.15)` igual que el modal, `z-index` por encima del contenido local pero irrelevante fuera de su propio contenedor), mostrado con `.help-icon:hover .help-icon__tooltip { display: block }`.
   - Nueva regla `.text-box--movable { cursor: move; }` junto a las reglas existentes de "Text box component" (tras `.text-box--selectable:hover`).

4. **`src/ui/componentModal.js`** — importar `createHelpIcon` de `./helpIcon.js`. En la pestaña "Generales", justo después de `idField`, añadir un nuevo `div.modal__field.modal__field--checkbox` con: checkbox (`input[type=checkbox]`, estado inicial `workingComponent.moverEnModoJuego ?? false`), su `label` "Mover en Modo Juego", y el icono de ayuda `createHelpIcon({ text: 'Permite arrastrar este componente por toda la mesa mientras se juega. Desactivado por defecto.' })` — mismo patrón de layout inline (flex, gap) que ya usa el checkbox "Transparente" de la pestaña "Específicas". En el evento `change` del checkbox, actualizar `workingComponent.moverEnModoJuego = checkbox.checked`.

5. **`src/ui/componentRenderer.js`** — añadir un nuevo parámetro opcional `canMove = () => true` a la firma de `renderComponentsOnTable(worldEl, components, { onSelect, onToggleSelect, selectedId, onMove, onResize, canMove } = {})`. Cambiar la condición que engancha el arrastre (`if (onMove) { ... }`) por `if (onMove && canMove(component))`, y cuando el arrastre quede habilitado, añadir la clase `text-box--movable` al elemento. El valor por defecto (`() => true`) preserva el comportamiento actual de modo edición sin tocar `editMode.js`.

6. **`src/modes/play/playMode.js`** — importar `replaceComponent` de `../../core/state.js` y `updateComponent` de `../../core/component.js`. Pasar a `renderComponentsOnTable` las nuevas opciones:
   - `onMove: (component, x, y) => replaceComponent(component.id, updateComponent(component, { x, y }))`
   - `canMove: (component) => component.moverEnModoJuego === true`

   Con esto, solo los componentes marcados con "Mover en Modo Juego" se vuelven arrastrables en Modo Juego, libremente por toda la mesa. El re-render tras soltar el arrastre ya está cubierto por el listener genérico `on('components:changed', renderAll)` de `main.js` — no requiere cambios ahí.

7. **Compatibilidad con componentes ya guardados**: los componentes creados antes de este cambio no tendrán `moverEnModoJuego` en su objeto guardado; `canMove` evalúa `component.moverEnModoJuego === true`, que da `false` para `undefined`, tratándolos como no movibles sin necesitar migración de datos.

## (c) Cambios de arquitectura

En [ARCHITECTURE.md](../../../design/docs/ARCHITECTURE.md), sección 5 ("Capa UI — módulos reutilizables"):

- Añadir una nueva entrada de módulo, junto a `ui/resizeHandle.js` (mismo estilo de descripción), para `ui/helpIcon.js`: componente genérico de ayuda contextual reutilizable entre modos. Expone `createHelpIcon({ text, html })`, que decide automáticamente entre mostrar un tooltip (texto plano corto, `< 200` caracteres) o abrir una modal (texto largo o con formato, reutilizando el mismo patrón visual `modal-overlay`/`modal` que `ui/componentModal.js`). No conoce el modelo de componente ni ningún dominio concreto — reutilizado inicialmente por `ui/componentModal.js` (checkbox "Mover en Modo Juego").
- Actualizar la entrada de `ui/componentModal.js` en esa misma sección para mencionar que la pestaña "Generales" incluye ahora también el checkbox "Mover en Modo Juego" con su icono de ayuda asociado (`ui/helpIcon.js`).
- Sección 4 (modelo de datos de componente): añadir `moverEnModoJuego: boolean` al bloque de campos documentado, con nota de que se inicializa a `false` en `createComponent()` y solo es editable desde la pestaña "Generales" de la modal.

## (d) Cambios en estilo

En [STYLE_BIBLE.md](../../../design/docs/STYLE_BIBLE.md):

- Sección 7 (nomenclatura BEM): documentar el nuevo bloque `.help-icon` (con elemento `.help-icon__tooltip`) como patrón estándar para ayuda contextual, junto a los bloques ya listados (`.component-list`, `.modal`, etc.).
- Añadir una nota en la sección de patrones de componente (sección 8) o una nueva subsección breve describiendo el patrón "icono de ayuda": icono circular 16px con "?", tooltip on-hover para texto corto, modal (reutilizando `.modal`/`.modal-overlay` ya documentados) para texto largo o con formato — para que futuros usos de ayuda contextual en la app reutilicen `ui/helpIcon.js` en vez de crear un patrón nuevo.
- Sección 10 (layout / z-index): la modal de ayuda reutiliza el nivel `1000` ya reservado para overlays de modal — no se necesita un nivel nuevo, solo dejar constancia de que `ui/helpIcon.js` también usa ese z-index cuando muestra su variante modal.
