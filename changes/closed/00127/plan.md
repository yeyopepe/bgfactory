## (a) Anotaciones funcionales

Fuera de alcance (ya recogido en `description.md`, se reitera aquí para el plan): atajos de teclado Ctrl+C/Ctrl+V, portapapeles persistido entre recargas de página, y cualquier vínculo tipo "Copia" (`copyOf`) entre el elemento pegado y el original.

No han surgido dudas técnicas adicionales durante el análisis — `description.md` ya deja resueltas las decisiones de alcance necesarias (menú en zona vacía del lienzo, "Pegar" siempre visible pero deshabilitada, SUPR para borrar).

## (b) Solución técnica

1. **Portapapeles de elemento copiado** (`src/ui/cardEditorModal.js`): variable de módulo `copiedElement`, inicializada a `null`, con forma `{ kind: 'texto' | 'forma', data: {...} }` donde `data` es una copia superficial (`{ ...element }`) del `textBox`/`shape` original sin su `id` (los campos de ambos tipos son siempre planos — confirmado en `ui/cardTextBoxModal.js`/`ui/cardShapeModal.js`, ningún objeto anidado). Es una variable de módulo (no de instancia del modal) para que sobreviva a cerrar y reabrir `openCardEditorModal` con otra carta, mismo patrón que `selectedComponentId`/`panelStackOrder` en `modes/edit/editMode.js`.

2. **Soporte de item deshabilitado en `ui/contextMenu.js`**: añadir un campo opcional `disabled: boolean` a los objetos de `generalItems`/`specificItems`. En `addRow`, si `disabled` es `true`: añadir clase `context-menu__item--disabled` al elemento, no registrar el listener `click` (o registrarlo pero sin invocar `onClick` ni `closeCurrentMenu`), dejando el resto de la función igual. Cambio aditivo y opcional — no rompe las llamadas existentes de `modes/play/playMode.js` (ninguna pasa `disabled`, por lo que se comportan igual que hoy).
   - CSS nuevo en `src/styles/main.css`, junto a las reglas existentes de `.context-menu__item` (sección ya localizada, ~línea 1782): `.context-menu__item--disabled` con `cursor: not-allowed` (mismo cursor que `.btn-accept:disabled`, STYLE_BIBLE sección 12.2), `color: var(--text-muted)`, opacidad reducida, y anular su regla `:hover` (sin cambiar a `--accent-blue`).

3. **Conversión de coordenadas de pantalla a coordenadas de diseño de la cara**: no existe hoy ninguna función para esto (`renderFace` solo usa `previewScale` para ir de diseño→pantalla al posicionar/mover elementos). Añadir una función local en `cardEditorModal.js`, p.ej. `screenToDesignPoint(canvas, previewScale, clientX, clientY)`, que use `canvas.getBoundingClientRect()` y calcule `{ x: (clientX - rect.left) / previewScale, y: (clientY - rect.top) / previewScale }`. Se usa tanto para el listener de click derecho en el lienzo vacío como para el de cada elemento (el punto de pegado depende del cursor, no del elemento sobre el que se abrió el menú).

4. **Listener de click derecho en el lienzo** (zona vacía de una cara): en `renderFace`, añadir un listener `contextmenu` a `canvasInner` (mismo nodo que ya tiene el listener `click` para deseleccionar). Como los listeners de cada elemento (`renderTextBox`/`renderShape`) ya hacen `stopPropagation()` en su propio `contextmenu`, este nuevo listener en `canvasInner` solo se dispara cuando el click derecho fue sobre una zona vacía — no hace falta comprobar `e.target`. Debe: `e.preventDefault()`, deseleccionar (`deselectTextBox()`), y abrir el menú reducido (`openElementContextMenu` con un modo/variante "vacío", ver punto 6).

5. **Ampliar `openElementContextMenu`** (ya existe, recibe `{ x, y, caraKey, kind, id }`): pasar a aceptar `id`/`kind` opcionales (`undefined` cuando el click fue en zona vacía) y un punto de pegado ya resuelto en coordenadas de diseño (`pastePoint: { x, y }`, calculado por quien la invoca con `screenToDesignPoint`). Construir `generalItems` condicionalmente:
   - Si hay `id`/`kind` (click sobre un elemento): `['Copiar', 'Pegar', 'Eliminar', 'Colocar arriba', 'Colocar abajo']`, en ese orden.
   - Si no (click en zona vacía): `['Pegar']` únicamente.
   - El item "Pegar" siempre se añade, con `disabled: copiedElement === null`.

6. **Acción "Copiar"**: obtiene el elemento actual de `cara.formas`/`cara.textBoxes` por `id` (mismo patrón que "Eliminar"), y asigna `copiedElement = { kind, data: { ...element } }` quitando `id` del objeto copiado (`const { id: _omit, ...data } = element`).

7. **Acción "Pegar"**: si `copiedElement` es `null` no debería poder invocarse (item deshabilitado), pero por robustez comprobar igualmente dentro del handler. Si hay algo copiado:
   - Genera `const newId = crypto.randomUUID()` (mismo patrón que "Añadir elemento"/`onDuplicate`).
   - Construye el nuevo elemento: `{ ...copiedElement.data, id: newId, x: pastePoint.x, y: pastePoint.y }`.
   - Lo añade a `cara.formas` o `cara.textBoxes` según `copiedElement.kind`.
   - Llama `bringElementToFront(cara, copiedElement.kind, newId)` (`core/cardFaceElements.js`, ya existente).
   - Selecciona el nuevo elemento (`selectShape`/`selectTextBox` según `kind`, que ya hacen `renderFaces()`).

8. **Borrado con tecla SUPR**: en el `handleKeyDown` ya existente de `cardEditorModal.js` (hoy solo gestiona flechas), añadir gestión de `e.key === 'Delete'` (mismo valor que usa `ui/globalShortcuts.js`): si hay `selected` y el foco no está en un campo editable (reutiliza el `isTextEditableElement(document.activeElement)` ya presente al principio de la función), elimina el elemento seleccionado del array correspondiente (misma lógica que la acción "Eliminar" del menú contextual: filtrar por `id`, poner `selected = null`, `renderFaces()`) y hace `e.preventDefault()`.

9. **Extraer la lógica de eliminar a una función compartida** (`removeSelectedElement` o similar, dentro de `cardEditorModal.js`) para no duplicar el bloque `cara.formas = cara.formas.filter(...)` / `cara.textBoxes = cara.textBoxes.filter(...)` + `selected = null` + `renderFaces()` entre el handler de "Eliminar" del menú contextual y el nuevo handler de SUPR.

10. **Iconos**: crear `createCopyIcon()`/`createPasteIcon()` en `cardEditorModal.js`, mismo patrón local que `createDeleteIcon`/`createBringToFrontIcon`/`createSendToBackIcon` ya existentes (SVG inline, `viewBox 0 0 24 24`, `stroke: currentColor`).

## (d) Cambios en estilo

`design/docs/stylebible/STYLE_BIBLE.md` sección 12.2 ("Cursores") documenta `not-allowed` como el cursor ya establecido para controles deshabilitados (`.btn-accept:disabled`). Al añadir `.context-menu__item--disabled` con ese mismo cursor, no se introduce una convención nueva — no hace falta ampliar esa sección, solo reutilizarla. No se requiere ningún otro cambio de `STYLE_BIBLE.md`.
