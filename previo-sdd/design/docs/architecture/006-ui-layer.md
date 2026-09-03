# 006 — UI layer: reusable modules

**Area**: UI layer

UI modules reused across modes (`modes/play` and `modes/edit`) with no direct knowledge of the data model, except where noted.

- **`ui/table.js`**: infinite table with pan (drag) and zoom (wheel). Creates a structure with `el` (surface to insert in the DOM) and `worldEl` (inner container where each mode adds content). Fully generic, does not know components. Position/zoom purely visual, not persisted (reset on reload), but do have module state (`cameraX`/`cameraY`/`zoom`, outside `createInfiniteTable`) to survive full table remounts (every `components:changed`/`mode:changed` re-invokes `createInfiniteTable`) — since there is only one active table at a time, a single shared camera state suffices. It also exposes `fitToBounds(bounds, { padding = 60 })`: instantly reframes so the box `{ minX, minY, maxX, maxY }` is visible with margin, capped to `minZoom`/`maxZoom`, or returns to a neutral view (`cameraX = cameraY = 0`, `zoom = 1`) if passed `null` — the box is always computed by the caller (`getComponentsBounds`), `table.js` does not read `state.js`.
- **`ui/resizeHandle.js`**: generic utility for the resize pattern. Does not know components or its own limits — reused by `ui/componentList.js`/`ui/resourceList.js` (panel, double handle `br`+`tl`), `ui/componentRenderer.js` (text boxes), `ui/tableColumnResize.js` (table columns), `ui/visualEditorModal.js` (the editor's modal itself, double handle `br`+`tl`, `getScale: () => 1`).

  ```js
  attachResizeHandle(hostEl, { axis = 'both', corner = 'br', getSize, getScale, clamp, onResize, onResizeEnd })
  ```

  | Param | Default | Effect |
  |---|---|---|
  | `axis` | `'both'` | `'x'`, `'y'` or `'both'` — which dimensions the proposed size covers |
  | `corner` | `'br'` | Anchor corner: `'br'` adds `div.resize-handle` and anchors the top-left corner as fixed; `'tl'` adds `div.resize-handle.resize-handle--tl`, anchors the bottom-right corner and adds `dx`/`dy` to the `onResize`/`onResizeEnd` object (offset the caller must apply to the host's `left`/`top`, this module does not know its position) |
  | `getSize`, `getScale`, `clamp` | — | Caller-supplied: current size, scale factor, and size clamp function run on every proposed size |
  | `onResize(size)` | — | Called on every move |
  | `onResizeEnd(size)` | — | Called on release |

  Hooks mousedown/mousemove/mouseup on `document`. With `axis === 'both'`, holding Shift forces a 1:1 aspect: `e.shiftKey` is read on every `mousemove`/`mouseup` (no own keyboard listener) and the larger-magnitude delta between width and height is used for both dimensions before `clamp()`.
- **`ui/rotationSlider.js`**: generic reused utility, same criterion as `ui/resizeHandle.js`. Reused by `ui/imageAdjustModal.js`, `ui/cardShapeModal.js` and `ui/cardTextBoxModal.js`.

  ```js
  createRotationSliderField({ label = 'Rotación', value = 0, onChange }) -> { field, setValue(v) }
  ```

  `field` is a `div.modal__field.rotation-field` with slider `<input type="range" min="0" max="360">`, visual marks at 0/90/180/270/360 (highlighting the one closest to the current value with `.rotation-slider__mark--active`) and a synced numeric field. Magnet: module constant `ROTATION_SNAP_THRESHOLD_DEG = 8` — if the slider's raw value is within that distance of a mark, it is forced to the mark's exact value before propagating. `setValue(v)` resyncs the control from outside without firing `onChange`.
- **`ui/tableColumnResize.js`**: manual table column width adjustment, reused by `ui/componentList.js`/`ui/resourceList.js`.

  ```js
  attachColumnResizing(table, columns, widths, onChange)
  ```

  | Param | Effect |
  |---|---|
  | `table` | `<table>` element to attach to |
  | `columns` | Ordered array of keys matching each `<th>`'s `data-col` |
  | `widths` | Persisted object `{ [column]: pxNumber }` or `null` |
  | `onChange(newWidths)` | Callback on release, with the full object |

  Hooks `attachResizeHandle` (`axis: 'x'`) per `<th>`, adds the class `column-resize-handle` (column-border line, not a corner grip). On the first move of any column in an interaction, it sets `table.style.tableLayout = 'fixed'` with the real width of all columns at once, so fixing one does not misalign the others. No maximum per column, only an internal minimum (`60px`).
- **`ui/componentRenderer.js`**: does know the component model. Exposes `getComponentsBounds(components)`: bounding box `{ minX, minY, maxX, maxY }` (or `null` if none), using the same defaults as rendering (`x`/`y` = `100`, `width`/`height` minimum `40×24px`) — feeds `fitToBounds` of `ui/table.js` from `ui/editModeToggle.js`.

  ```js
  renderComponentsOnTable(worldEl, components, {
    onSelect, onToggleSelect, selectedIds = new Set(), primarySelectedIds = new Set(),
    onMove, onResize, canMove = () => true,
    onDiceResult, onDiceOpenResult, onCartaFlip, onMazoDraw, onContextMenu,
    identifyMode, liftOnDrag = false,
    showLockIndicator = false, showHiddenIndicator = false, showCopyIndicator = false,
    allComponents, groups = [],
  } = {})
  ```

  Clears and redraws each supported component over `worldEl`, positioned by `x`/`y`.

  | Param | Default | Effect |
  |---|---|---|
  | `selectedIds` | `new Set()` | `Set<string>` of selected ids — each type highlights with `<type>--selected` any component whose id is in the set; the resize handle (if `onResize` is passed) is offered only when the set has size 1 and contains it |
  | `primarySelectedIds` | `new Set()` | Ids that were the *direct* click target within a group selection (see `group.effectiveProps.rule` context, `005-modes.md`) — drives the `.is-group-passenger` class |
  | `onToggleSelect(component, event)` | — | Also receives the native `click` event, so the caller can read `event.ctrlKey`/`event.metaKey` and decide whether the toggle is additive or replacing |
  | `onSelect(component)` | — | Double click opens the modal |
  | `onMove(component, x, y)` | — | If passed and `canMove(component)` is `true`, the component is draggable (class `<type>--movable`, screen drag converted to world coordinates by dividing by the current zoom); invoked on release |
  | `onResize` | — | If passed and `selectedIds` has size 1, a resize handle is offered (both axes, free unless Shift = 1:1) |
  | `canMove` | `() => true` | Predicate gating drag |
  | `onDiceResult`, `onDiceOpenResult` | — | `'dado'` click-to-roll and double-click-to-open-large-result callbacks (play mode only, see `003-component-types.md`) |
  | `onCartaFlip` | — | `'carta'` click-to-flip callback (play mode only) |
  | `onMazoDraw` | — | `'mazo'` click-to-draw callback (play mode only) |
  | `onContextMenu(component, event)` | — | If passed, each type adds a `contextmenu` listener on its outer container (`preventDefault` + `stopPropagation`) that invokes it |
  | `identifyMode` | none | `'tooltip' \| 'label'`: how "what it is" is shown for each component without opening it, via the helper `formatComponentIdentifier(component)` (`"<Type>: <id>"`). `'tooltip'`: native `title` attribute on the container. `'label'`: `<span class="component-id-label">` child of the container, anchored to the top-left corner via CSS, visible only on hover/selection |
  | `liftOnDrag` | `false` | Each drag block brings the node to the end of `worldEl` (visual front, without touching `order`) and adds transient state `lifted` (`beginDragLift`) on `mousedown`, removes it (`endDragLift`) on release before `onMove` — simulates the component lifting (fixed offset + shadow) for the duration of the gesture. Purely visual and temporary, does not persist or modify real `order` (the "Subir al mover/interactuar" reordering fires separately, in `onMove` of `playMode.js` on release). `modes/play/playMode.js` is the only caller that sets it to `true` |
  | `showLockIndicator` | `false` | If `true` and `component.bloqueado !== 'ninguno'`, adds the `createLockBadge()` badge (local helper, analogous to `createIdentifierLabel`) to the outer container |
  | `showHiddenIndicator` | `false` | Analogous, for `component.oculto`, with `createHiddenBadge()` (crossed-eye icon), bottom-right corner (coexists with the lock) |
  | `showCopyIndicator` | `false` | Analogous, for `component.copyOf` non-null (copy badge, bottom-left), and for the "has copies" count badge on an original (`copyOf` null) with 1+ linked copies |
  | `allComponents` | `components` | Full list to count against for the "has copies" badge, when `components` (the list actually drawn) is a filtered subset — used by both modes, which filter out cards stored inside a `'mazo'` |
  | `groups` | `[]` | Passed to `group.effectiveProps.rule` (`getEffectiveGeneralProps`, see `00-namespace.md`) to resolve each grouped component's effective `bloqueado`/`oculto`/`mostrarTooltip`/`mostrarTitulo`/`subirAlMoverInteractuar` before drawing lock/hidden badges and applying `--selected` |

  **Rule for any type that clips its own visual content** (zoomed image, overflowing text, circular shape, etc.): `overflow: hidden` must be applied to a dedicated **inner** container, never the outer one — the outer one is where `.component-id-label` and the state badges (lock/hidden/copy/has-copies) are added, and those must never be clipped (they may protrude from the component by design). Pattern: an inner `div` with `position: absolute; inset: 0; overflow: hidden` (plus the corresponding `border-radius`) wraps only image/text/background pattern; the outer container keeps label, badges, border and selection/drag/resize listeners with no `overflow: hidden`.
  - The `'texto'` type (`.text-box`) follows this pattern: inner `div` (`width: 100%; height: 100%; box-sizing: border-box; overflow: hidden`, in normal flow — not `position: absolute` — so the outer one keeps fitting the text when the component has no fixed `width`/`height`) with the text's `padding`, `font-size`, `color` and `background-color`; the outer `.text-box` with no `overflow`, with label and badges. With no fill box of its own, `.text-box` anchors its badges flush to the visible text with its own offsets (`.text-box > .component-*-badge` in `main.css`), not to the corner of a box (see `../style/003-modales-menus.md`, Component identifier label).

  Before drawing, it internally sorts a copy of `components` by `order` descending and draws in that order: each later `appendChild` ends up on top visually, so the highest `order` (the "background" one) is drawn first, `order = 1` last (on top of all) — the received array does not need to come pre-sorted.

  Per-type render — see `003-component-types.md` for type-specific properties; here only the common interaction mechanics already summarized in the parameter table above.

  Reused by `modes/play/playMode.js` (`onMove`/`canMove` limiting drag to the group-effective `bloqueado === 'ninguno'`; `identifyMode: 'tooltip'`; `liftOnDrag: true`; `onDiceResult`/`onDiceOpenResult`/`onCartaFlip`/`onMazoDraw` wired; no `onSelect`/`onToggleSelect`/`onResize`/`showLockIndicator`/`showHiddenIndicator`/`showCopyIndicator`/`primarySelectedIds`) and `modes/edit/editMode.js` (`onSelect`/`onToggleSelect`/`onResize`/`onContextMenu` wired — `onToggleSelect` shares the `toggleSelect` function with the panel row; own `canMove` limiting to the group-effective `bloqueado !== 'todos'`; `identifyMode: 'label'`; `showLockIndicator`/`showHiddenIndicator`/`showCopyIndicator`/`primarySelectedIds` all passed; no `onDiceResult`/`onDiceOpenResult`/`onCartaFlip`/`onMazoDraw`, no `liftOnDrag`). Both pass `allComponents` and `groups`.
- **`ui/contextMenu.js`**: generic context menu positioned next to the cursor, reusable for any right click in the app (distinct from `createAddMenu` of `ui/resourceList.js`, which is a fixed dropdown under a button). Exposes `openContextMenu({ x, y, generalItems, specificItems = [], interactionItems = [], description, onClose })`.
  - `generalItems`/`specificItems`: `{ icon, label, onClick, disabled }[]`, or `{ label, select: { options: { value, label }[], disabled, onChange } }[]` for a row with an inline `<select>` (first use: "Añadir a etiqueta" of the edit-mode menu, see `005-modes.md`) — choosing a real option invokes `onChange(value)` and closes the menu; with no options or `disabled: true`, the `<select>` is disabled.
  - Paints first, if passed, a description line (`description`), then the general section, and only if `specificItems` is non-empty, a separator + the specific section; last, if `interactionItems` is non-empty, a fixed read-only informational section (`{ label, value }[]`) with what each kind of click does on the component.
  - `description`: `{ main: string, extra?: string }` — read-only line at the start (before `generalItems`), separated by a line if passed, `main` in bold, second faint line with `extra` if passed.
  - Added to `document.body` with `position: fixed` at `(x, y)`, readjusted after insertion so it does not leave the window. Singleton behavior (module state with the open menu, if any, automatically closed before opening another).
  - Closes on click outside (`mousedown` on `document`), ESC (module's own listener, does not use `ui/globalShortcuts.js` which only recognizes modal DOM) or on choosing a row; in all three cases it invokes `onClose` if passed, before unmounting.
  - In `modes/play/playMode.js`, `onContextMenu` passes a `description` computed from `formatComponentIdentifier(component)` (`main`) and, by `type`, a differentiating `extra`: number of possible results for `'dado'`, size `"AAxBB"` for `'tableroSimple'`, number of cards for `'mazo'`, no `extra` for the rest.
  - `interactionItems` starts from the module constant `interactionsByType` (fixed `{ label, value }[]` array per `type`: "Clic izquierdo"/"Doble clic izquierdo"/"Clic derecho"); the local function `getInteractionItemsFor(component)` replaces the `value` of "Clic izquierdo" with `"Ninguno"` when `core/interactions.js` → `isInteractionActive(component, key)` is `false` for that `type`'s click interaction — the rest of the rows and types with no programmed interaction are returned unchanged.
- **`ui/componentTypeModal.js`**: pre-creation modal, no tabs — list of the 8 available types (radio buttons: `'texto'`/`'tableroSimple'`/`'tableroPersonalizado'`/`'dado'`/`'documento'`/`'carta'` with label "Carta/Ficha"/`'mazo'`), with "Cancelar"/"Aceptar". On accept, `modes/edit/editMode.js` creates the component with `createDefaultComponent(type)`, adds it to state, opens `ui/componentModal.js` over that already-existing component to configure it. No type dropdown inside that modal.
- **`ui/componentModal.js`**: create/edit modal, two tabs ("Generales" and "Específicas"), always over an already-existing component (just created or present). See `002-component-model.md` for the "Generales" fields and `003-component-types.md` for the per-type specific fields. Footer with "Cancelar" and "Aceptar" (disabled if the id is invalid), "Eliminar" always present. Exports `createDefaultComponent(type)`, `DEFAULT_BOARD_PROPERTIES`, `DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES`, `DEFAULT_CARTA_PROPERTIES`, `DEFAULT_MAZO_PROPERTIES`.
  - **`workingComponent`**: **shallow** copy (`{ ...component }`) — top-level fields (`bloqueado`/`mostrarTooltip`/`subirAlMoverInteractuar`/`etiquetaIds`, "Generales" tab) are discardable with "Cancelar" because they live in that copy; but `workingComponent.properties` is the **same reference** as `component.properties` — any change inside `properties` (Proporción, face design via `ui/visualEditorModal.js`, "Pegar estilo" blocks) is applied immediately to the real state object, not only on accept.
- **`ui/styleClipboardSelectionModal.js`**: selection modal on clicking "Copiar estilo" from `ui/componentModal.js`. Exposes `openStyleClipboardSelectionModal({ component, onAccept })`: checklist of a single fixed group of 4 elements (Generales, Proporción, Cara frontal, Cara trasera), all checked by default, with an auxiliary note per item. Does not reuse `ui/elementSelectionModal.js` (meant for dynamic collections with `id`/label) — builds its own markup reusing the BEM classes `.element-selection-group*` to inherit the visual language without duplicating CSS. "Copiar" button disabled if no item remains checked. `onAccept(selection)` receives `{ generales, proporcion, caraFrontal, caraTrasera }` (booleans). Convention to follow if "Copiar/Pegar estilo" is extended to other types.
- **`ui/styleClipboardErrorModal.js`**: paste-style error modal, opened when `validateStyleClipboardForPaste` returns issues. Exposes `openStyleClipboardPasteErrorModal(issues)`: error header (`modal__header--error`/`modal__error-icon`) combined with a table, reusing **without own CSS** the classes `.import-report-modal`/`.import-report-modal__table`, three columns (Elemento/Referencia/Detalle). Only a "Cerrar" button — paste is all-or-nothing, there is no "continue without".
- **`ui/boardPatternModal.js`**: sub-modal without tabs for the "Color y patrón" background of a simple board — color, cell shape (cuadrada/hexagonal), rows/columns (1–50). Operates over a working copy, applies to `properties` only on accept.
- **`ui/boardImageModal.js`**: analogous sub-modal for the "Imagen" background — grid gallery (thumbnail + name) of `type === 'imagen'` resources, single selection with click (double click selects and confirms directly, equivalent to click + Aceptar); with no resources, "No hay imágenes disponibles" with "Aceptar" disabled. No upload function (already exists in the "Recursos" panel). Optional `title` parameter (default `"Configurar fondo — Imagen"`) to customize the title without duplicating the module (also used by each `'carta'` face from `ui/visualEditorModal.js`).
- **`ui/imageAdjustModal.js`**: reusable image-adjustment editor (position, zoom, rotation over a square/circular/rounded shape), agnostic of the component type.

  ```js
  openImageAdjustModal({ shape, width, height, resource, adjustment, transparencia, onAccept, faces, initialFocusKey })
  ```

  | Param | Effect |
  |---|---|
  | `shape`, `width`, `height`, `resource`, `adjustment`, `transparencia` | Single-stage mode (no `faces`): describe the one anonymous stage |
  | `faces` | Multi-stage mode: array `{ key, label, shape, width, height, resource, adjustment }`, one stage per entry |
  | `initialFocusKey` | Multi-stage mode: which `key` starts focused (fallback: the first `key` with `resource`) |
  | `onAccept` | Single-stage: receives that stage's adjustment. Multi-stage: receives `{ [key]: { zoom, posX, posY, rotation } }` of all entries |

  No tabs: one or more "stages" with a clipped shape (mask `overflow: hidden`, `border-radius` by `shape` — `'circular'` → `50%`, `'redondeada'` → `8px`, or `clip-path` for hexagonal/triangular) at a preview size that preserves the real `width`×`height` proportion. Inside each stage with a resource, `<img>` + zoom control (`<input type="range" min="100" max="300">`) synced with a text box (`<input type="text">`, clamped to `[100, 300]`, non-numeric value discarded).
  - **Rotation control** (`ui/rotationSlider.js`, `createRotationSliderField`): operates over `focusedKey` like Zoom/Transparencia, resyncing (`setValue`) on changing focused face.
  - **"Transparencia" slider** (`modal__field`, `min="0" max="100"`, synced with a text box like "Zoom"): painted only if some entry brings `transparencia !== undefined` (`hasTransparencia`); operates over `focusedKey` like Zoom/90°; applies `opacity = 1 - transparencia/100` over the preview in real time; on accept, it is included in the returned result (per-`key` in `faces` mode, or direct in single-stage mode) only if `hasTransparencia`.
  - Without `faces`: an anonymous stage with top-level `shape`/`width`/`height`/`resource`/`adjustment`/`transparencia`; `onAccept(adjustment)` receives that stage's adjustment — caller: `ui/cardShapeModal.js` (`adjustImageBtn`), for a `Forma`'s image transparency.
  - With `faces` (array `{ key, label, shape, width, height, resource, adjustment }`): one stage per entry, fixed array order, `label` as an always-visible title; internal state per `key` (`{ zoom, posX, posY, rotation }`) and `focusedKey` (initialized to `initialFocusKey`, or the first `key` with `resource`). Drag listeners and Zoom/Rotation controls operate over `focusedKey`, resyncing on focus change; `mousedown` over the mask of a non-focused face with `resource` changes `focusedKey` and starts a drag in the same gesture (the drag does not account for the current rotation angle). A face with no `resource`: empty slot, no listener, never `focusedKey`. "Aceptar" invokes `onAccept` once with `{ [key]: { zoom, posX, posY, rotation } }` of all entries; "Cancelar" discards everything without invoking `onAccept`. Caller of this mode: `ui/visualEditorModal.js` (`openAdjustSession`) for `cara.transparenciaImagen`.
  - Exports `applyImageAdjustStyle(imgEl, adjustment, boxWidth, boxHeight)`: applies the final result — `object-fit: cover` + `object-position` over the `<img>`, with `width`/`height`/`top`/`left` in pixels always computed over `boxWidth`×`boxHeight` (strict rotation: the image size by zoom does not change with `rotation`, may leave gaps at the corners on rotation, the mask/frame clip hides the overflow); with `rotation !== 0`, adds `transform: rotate(${rotation}deg)` with `transform-origin` at the center of the real frame. Reused by `ui/componentRenderer.js` (final paint of each `'carta'` face and each `Forma` with an image) and by `ui/visualEditorModal.js` (preview in the editor).
- **`core/cardProportions.js`**: pure data module. Exposes `CARD_PROPORTIONS`, `getProporcionRatio(value)`, `getCartaShapeCss`/`isRectShape`/`getHexInnerClipPath`/`getTriangleInnerClipPath` (see `003-component-types.md`). `CARD_DESIGN_WIDTH` (300): historical constant, kept only because the `migrateCartaMedidasReales` migration (see `007-persistence-build.md`) needs the historical reference width for cards saved with the design-canvas system predating real pixels.
- **`ui/visualEditorModal.js`**: large modal ("Editor visual", `.card-editor-modal`) to design one or more faces of a component, opened from the "Específicas" tab of `ui/componentModal.js` ("Editar diseño de la carta" / "Editar diseño del tablero").

  ```js
  openVisualEditorModal({ component, title, faces, showProporcionSelector = true, borderStyle = 'simple', bevelEnabled = true, onAccept })
  ```

  | Param | Default | Effect |
  |---|---|---|
  | `faces` | — | `[{ key, label }]` — two entries `caraFrontal`/`caraTrasera` for `'carta'`; one entry `cara`, `label: null`, for `'tableroPersonalizado'` |
  | `showProporcionSelector` | `true` | Hides the proportion/shape dropdown and the "Esquinas redondeadas" checkbox when the type has no configurable proportion (`'tableroPersonalizado'`) |
  | `borderStyle` | `'simple'` | `'simple' \| 'bisel'`: simple line (`'carta'`) or two-tone bevel (`'tableroPersonalizado'`, via `shadeColor`) |
  | `bevelEnabled` | `true` | Read once on opening the editor: whether the canvas preview draws the two-tone bevel border for `'tableroPersonalizado'` (`biselado` property, see `../style/001-tokens-visual.md`, Bevel/depth) |
  | `onAccept(result)` | — | Invoked from the footer "Aceptar" |

  Operates over a working copy (`working[key]` per face, plus `proporcion`/`esquinasRedondeadas` if `showProporcionSelector`) applied to the component only on accept — `onAccept(result)` receives `{ [proporcion, esquinasRedondeadas,] ...facesByKey }`.
  - Top toolbar with a proportion dropdown if applicable (changes the working copy, does not clear `textBoxes`, only recomputes the canvas size). Body with one column per face: canvas scaled from the face's design size (`getFaceDesignSize()`: always `{ width: working.designWidth, height: working.designHeight }`, initialized to the component's current real size on open — with `showProporcionSelector`, changing "Proporción" recomputes `designHeight = designWidth / getProporcionRatio(newProporcion)`, keeps the real width fixed) with a single `previewScale = currentCanvasMaxSide / max(designWidth, designHeight)` factor. `currentCanvasMaxSide` is set once per `renderFaces()` call, before `facesRow.innerHTML = ''`, from `getEffectiveCanvasMaxSide()`; all faces and the "Ajustar imagen…" margin read that cached value. See "Window size" below for the branches of `getEffectiveCanvasMaxSide()`.
    - [gotcha] `getEffectiveCanvasMaxSide()` NOT called per face — `renderFace()` reads `currentCanvasMaxSide`. Per-face calls would size the first face of a `'carta'` with `facesRow` already emptied (no mounted face for `getEditorWorkArea()` to measure → constant-fallback branch) and the second face with a real measurement → two mismatched faces.
  - Background image (if `imagenResourceId`) painted with `applyImageAdjustStyle`; `textBoxes` positioned/sized by design values × `previewScale`, alignment/margin via `core/textBoxLayout.js`, each draggable (screen delta converted to "design units" by dividing by `previewScale`) and resizable (`ui/resizeHandle.js`, `getScale: () => previewScale`); double click opens `ui/cardTextBoxModal.js`. Per-face buttons: "Elegir imagen…" (`ui/boardImageModal.js`), "+ Cuadro de texto".
  - Single "Ajustar imagen…" button (disabled if no face of `faces` has an image); invokes `openImageAdjustModal` once with a `faces` array built from the editor's own `faces` (fixed positions) and `initialFocusKey` (first face with an image) — the popup itself manages focus internally without closing/reopening. On accept, `onAccept(adjustments)` stores `adjustments[key]` in each face's `working[key].ajusteImagen`; cancel applies nothing.
  - Footer "Cancelar"/"Aceptar" (invokes `onAccept(result)`).
  - **Window sizing.** Two layers, sized in order every `renderFaces()`: **(1)** the modal box (`.card-editor-modal`) gets a width/height; **(2)** `getEffectiveCanvasMaxSide()` derives each face's canvas size from the *measured* interior of that box. History: 00225 (manual resize) → 00233 (carta faces never stack) → 00235 (canvas fills the real work area, not viewport fractions) → 00237 (drop `* 3` ceiling, `min-height: 0`, convergence pass) → 00240 (`--maximized` needs explicit `width`) → 00241 (dead `EDITOR_CHROME_H` removed, this doc consolidated).

    **Layer 1 — the modal box.** Three mutually exclusive states, none persisted between openings (all are `let` locals of `openVisualEditorModal`, reinitialized per call):

    | State | How the modal box gets its size |
    |---|---|
    | default (`!maximized && !manualSize`) | No inline geometry, no `--maximized` class. `.card-editor-modal { width: fit-content }` overrides `.modal { width: 90% }`; `.modal { max-height: 80vh }` still caps it. Centered by the `.modal-overlay` flexbox. |
    | `maximized: boolean` | `.card-editor-modal--maximized` class (toggled by `.card-editor-modal__maximize-btn`, `../style/003-modales-menus.md` §"Modal maximize/restore button"): `width: 90vw; max-width: 90vw; height: 90vh; max-height: 90vh`. Handler clears inline geometry first (`clearModalInlineGeometry()`), so the class wins with no `!important`. |
    | `manualSize: {width,height}` | Set by the two corner handles (`attachResizeHandle` `corner: 'br'` + `'tl'`, `getScale: () => 1`). Each move: `freezeModalGeometry()` (once) switches the modal to `position: fixed` at its current `getBoundingClientRect()` and nulls inline `max-width`/`max-height`; then `modal.style.width`/`height` (+ `left`/`top` for `tl`, via `dx`/`dy`) are set inline, `manualSize` stored, `renderFaces()` called. |

    - [gotcha] `--maximized` must set **both** `width` and `height` as fixed values, not just `max-*` — the modal inherits `width: fit-content`, so a bare `max-width` leaves it content-sized and maximize enlarges only the dimension that does carry a fixed value (bug 00240: maximize only grew the height; masked before 00237 because the `CANVAS_MAX_SIDE * 3` canvas ceiling was indirectly pushing the `fit-content` width to ~1140px).
    - [gotcha] `--maximized`'s `max-height: 90vh` is also there to override `.modal { max-height: 80vh }` (same specificity, `--maximized` is later in the file).
    - `maximized` and `manualSize` coexist without clearing each other: maximize clears inline geometry (`manualSize` kept, the class drives the box); restore reapplies `manualSize` centered if present, else clears everything back to `fit-content`.
    - `handleWindowResize()`: `maximized` → just `renderFaces()` (the `90vw`/`90vh` class re-resolves on its own); `manualSize` → reclamp against the shrunk viewport (anchoring the top-left corner) then `renderFaces()`.
    - `clampModalSize(proposed, {maxWidth, maxHeight})`: min `MIN_EDITOR_MODAL_WIDTH`/`MIN_EDITOR_MODAL_HEIGHT`; max whatever the caller passes — `br` handle: `innerWidth - modal.left` / `innerHeight - modal.top`; `tl` handle: `tlStart.left + tlStart.width` / `tlStart.top + tlStart.height` (the fixed bottom-right corner).
    - [gotcha] the modal is NOT draggable to reposition — only resizable; at rest the `.modal-overlay` flexbox centers it.

    **Layer 2 — the canvas.** `renderFaces()` computes `currentCanvasMaxSide = getEffectiveCanvasMaxSide()` **once, before `facesRow.innerHTML = ''`**; every face's `previewScale = currentCanvasMaxSide / max(designWidth, designHeight)` and the "Ajustar imagen…" margin read that cached scalar.
    - [gotcha] not called per-face: `getEditorWorkArea()` measures the *previous* render's face chrome, and after `facesRow` is emptied the first face of a carta would fall to the constant fallback while the second measures for real → two mismatched faces.

    `getEffectiveCanvasMaxSide()` — returns a scalar "max side":
    ```
    if (!maximized && !manualSize)  return CANVAS_MAX_SIDE           // default: fixed
    { dW, dH } = getFaceDesignSize();  longSide = max(dW, dH)
    { availWidthPerFace, availHeight } = getEditorWorkArea()
    sideFromWidth  = availWidthPerFace * longSide / dW    // → canvasWidth  = availWidthPerFace when width-bound
    sideFromHeight = availHeight       * longSide / dH    // → canvasHeight = availHeight       when height-bound
    return max(CANVAS_MIN_SIDE, min(sideFromWidth, sideFromHeight))  // first constraint wins; only floor is CANVAS_MIN_SIDE
    ```
    - [motivación] the measured branch fits the canvas into BOTH the per-face width and the real interior height, keeping the design aspect ratio — replaced (00235) fixed viewport fractions (`innerHeight * 0.7`, `innerWidth * 0.42`) that left slack in the non-limiting dimension for landscape designs, and dropped (00237) a `min(…, CANVAS_MAX_SIDE * 3)` ceiling that kept a width-bound landscape 'tableroPersonalizado' from filling a maximized window's width.

    `getEditorWorkArea() -> { availWidthPerFace, availHeight }` — measures `.modal__content`'s real interior at render time:
    ```
    inner = content.clientHeight - padY;  rowW = content.clientWidth - padX      // padX/padY from getComputedStyle
    sampleFace = facesRow.querySelector('.card-editor-modal__face')              // the PREVIOUS render's face
    availHeight = sampleFace
      ? max(CANVAS_MIN_SIDE, inner - toolbarH - faceLabelH - actionsH - facesGap(16) - EDITOR_WORK_MARGIN)
      : max(CANVAS_MIN_SIDE, inner - EDITOR_CHROME_V - EDITOR_WORK_MARGIN)       // no face to measure → constant fallback
    adjustBtnSpace = faces.length === 2 ? adjustImageBtn.offsetWidth + 8 : 0     // the interleaved button, carta only
    availWidthPerFace = max(CANVAS_MIN_SIDE, (rowW - adjustBtnSpace - facesRowGaps) / faces.length)
    ```
    - `toolbarH` = `toolbar.offsetHeight`, `0` when `showProporcionSelector` is `false` ('tableroPersonalizado' — the toolbar node is still appended, just empty); `faceLabelH` = `0` for 'tableroPersonalizado' (`label: null`).
    - [gotcha] only ever called from the measured branch of `getEffectiveCanvasMaxSide()` — i.e. after a user gesture with `overlay` already in the DOM. Never from the first render.

    **Convergence pass** (`renderFaces()` tail, when `maximized || manualSize`): `availHeight` above subtracts `actionsH`, measured on the *previous* render, whose `.card-editor-modal__face-actions` height (`flex-wrap: wrap`) depends on canvas width. A width-bound 'tableroPersonalizado' render widens the canvas sharply → the previous actions row had wrapped into more rows → `availHeight` was under-subtracted → new canvas too small, gap below. Fix: one `requestAnimationFrame` re-runs `getEffectiveCanvasMaxSide()` with the *new* render's actions row at its final width; if the side moved `> 1` px it calls `renderFaces()` once more. `convergePending` breaks recursion; `convergeRaf` is `cancelAnimationFrame`'d in `cleanup()`.
    - [gotcha] one extra pass, NOT an iterative loop — same bounded criterion as `ui/progressModal.js`'s double `requestAnimationFrame` (bug 00218). The second measurement is of the final layout, so it settles.
    - carta ('showProporcionSelector: true', two narrow faces): `actionsH` is stable between renders → `abs(after - before) <= 1` → no second pass → carta unaffected by the convergence machinery.

    **Centering + no-scroll** — CSS only, scoped to `.card-editor-modal` so no other modal is touched:
    ```
    .card-editor-modal .modal__content { display: flex; flex-direction: column; min-height: 0 }
    .card-editor-modal__faces          { flex: 1 1 auto; align-items: center; justify-content: center; flex-wrap: nowrap }
    ```
    The faces row fills the leftover vertical space and centers the face block; `justify-content: center` centers horizontally when width is slack; `flex-wrap: nowrap` + the per-face width bound keep carta's two faces side by side.
    - [gotcha] `min-height: 0` on `.card-editor-modal .modal__content` is load-bearing (00237): without it the `overflow-y: auto` inherited from `.modal__content` stops `.card-editor-modal__faces` from actually stretching, so `align-items: center` has no slack and the canvas sits pinned to the top with all the leftover space below. Same idiom as `#content` (`../style/002-componentes-layout.md`, Layout).
    - `overflow-y: auto` (inherited) is the intentional fallback when the window shrinks below the `CANVAS_MIN_SIDE`-floored canvas — the footer stays visible because it is outside `.modal__content`.

    **Module constants** (`ui/visualEditorModal.js` top):

    | Constant | Value | Role |
    |---|---|---|
    | `CANVAS_MAX_SIDE` | `380` | Canvas side in the **default** state only. No `* 3` multiple anywhere since 00237. |
    | `CANVAS_MIN_SIDE` | `140` | Floor for both `availWidthPerFace`/`availHeight` and the `getEffectiveCanvasMaxSide()` return. |
    | `MIN_EDITOR_MODAL_WIDTH` / `_HEIGHT` | `420` / `360` | Floor for `clampModalSize()` (manual resize only). |
    | `EDITOR_CHROME_V` | `210` | Constant vertical-chrome estimate, used **only** in `getEditorWorkArea()`'s no-`sampleFace` fallback. There is no horizontal counterpart — `availWidthPerFace` is always measured (`content.clientWidth`). |
    | `EDITOR_WORK_MARGIN` | `24` | Breathing room subtracted from `availWidthPerFace`/`availHeight` so the canvas doesn't touch the work-area edges or force scroll on rounding. |
- **`ui/cardTextBoxModal.js`**: sub-modal without tabs to edit a face's `textBox`, opened with double click from `ui/visualEditorModal.js`. Exposes `openCardTextBoxModal({ textBox, onAccept, onDelete })`: content (`textarea`), typeface (button reusing `ui/diceFontModal.js`, logic already generic despite the file name), "Posición del texto en el cuadro" block (two `.align-group` for horizontal/vertical alignment, a row of 4 numeric fields for margins — `parseInt` + `Math.max(value, 0)`), size (design units) and color. Operates over a working copy, applied to the original `textBox` only on accept. Footer "Eliminar" (removes the box and closes), "Cancelar", "Aceptar".
- **`ui/diceFontModal.js`**: sub-modal analogous to `ui/boardImageModal.js` for `'dado'`'s `fuenteResourceId` — list (not grid) of `type === 'tipografia'` resources, each with a name and a sample text rendered in that typeface (`ui/fontFaceRegistry.js`, `fontFamilyFor`), single selection with click; with none, "No hay tipografías disponibles" with "Aceptar" disabled.
- **`ui/diceResultModal.js`**: "view the result large" modal of `'dado'`, opened with double click in play mode — no tabs, shows `properties.resultadoActual` at large size, "Cerrar" button.
- **`ui/helpIcon.js`**: generic contextual-help component. Exposes `createHelpIcon({ text, html })` (mutually exclusive) → `span.help-icon` with "?": `text` under 200 characters shows a tooltip (`span.help-icon__tooltip`) on hover; in any other case (`html` present, or `text` ≥200 characters), click opens a modal reusing the `modal-overlay`/`modal` pattern of `ui/componentModal.js` ("Cerrar" button), content via `textContent` or `innerHTML`. Does not know the component model. Used by `ui/componentModal.js` (help for the "Bloqueado" dropdown).
- **`ui/editModeToggle.js`** (reorganized 00244): exposes `renderModeSwitcher` and `renderEditToolbar`.
  - `renderModeSwitcher` runs in **both** modes now (no early return if `!PLAY`). Populates `#mode-switcher` (fixed, top-right, `z-index: 101`) with: play mode → `[Importar] [Exportar] │ [Modo] [Ajustar zoom] [Configuración]` (`│` = a `.toolbar-divider` between the file block and the action block); edit mode → `[Modo] [Ajustar zoom] [Configuración]` only.
  - `renderEditToolbar` builds only the `.edit-toolbar` band (`[Importar] │ [Exportar]`); it no longer mounts the mode button nor "Ajustar zoom".
  - `createModeButton()` — mode-switch button: `"Modo Edición"` (was "Entrar en modo edición") in play, `"Modo Juego"` (was "Salir del modo edición") in edit. Class `mode-switcher__mode-btn`, primary-action blue, always in `#mode-switcher`.
  - `createFitButton(className)` — icon-only "Ajustar zoom" (`getComponentsBounds` → `fitToBounds` of `ui/table.js`), blue, in `#mode-switcher` in both modes.
  - `createSettingsButton(className)` — icon-only 36×36 gear, class `mode-switcher__settings-btn`, "sobre fondo oscuro" scheme (NOT blue). Opens `ui/settingsModal.js`.
  - `createImportControls()` (no more `buttonClassName` param) and `createExportMenu()` — "Importar"/"Exportar", same "ghost on dark" look in both host bars. Text separated from the inline SVG via the `iconTextButton(svg, text)` helper. Still collect file name/selection through their own modals, not a native `prompt()` (see below).
  - All chrome text via `t()` (`../architecture/010-internationalization-i18n.md`).
- **`ui/settingsModal.js`** (new, 00244): `openSettingsModal()`. Standard `.modal-overlay`/`.modal` pattern (ref `ui/helpIcon.js`), footer `.btn-cancel` "Cerrar", ESC/click-outside close. Content: language `<select>` (`Español`/`English`, options fixed literals; `onchange` → `setLanguage`) + read-only version line (`getFullAppTitle(getAppTitle())`). Reserved slot (not painted) for 00231's changelog. Subscribes `on('language:changed', renderContent)` on open, `off()` on any close — rebuilds its own header/content/footer in the new language without closing.
- **`ui/elementSelectionModal.js`**: not a modal itself, but a reusable UI block used by `ui/exportSelectionModal.js`/`ui/importSelectionModal.js`. Exposes `createElementSelectionGroups(container, { components, resources, tags }, { onSelectionChange })`: paints a block per non-empty collection (Componentes/Recursos/Etiquetas), each with a "select the whole block" checkbox and a check per element (all checked by default) — components identified with `"<Type>: <id>"` (`formatComponentIdentifier`, exported from `ui/componentRenderer.js`), resources/tags by `name`. Returns `{ getSelection() }` (`{ componentIds, resourceIds, tagIds }`), notifies changes via `onSelectionChange`.
- **`ui/exportSelectionModal.js`**: replaces the file-name `prompt()` on export. Exposes `openExportSelectionModal({ components, resources, tags, defaultFilename, onAccept })`: a name field + the three `ui/elementSelectionModal.js` blocks, "Exportar" button disabled if nothing is checked. `onAccept({ filename, componentIds, resourceIds, tagIds })`.
- **`ui/importSelectionModal.js`**: first modal of the import flow — same structure as `ui/exportSelectionModal.js` without the name field, elements read from the file (checked by default), "Continuar" button disabled if none is checked. `onAccept({ componentIds, resourceIds, tagIds })`.
- **`ui/importConfirmModal.js`**: second modal of the import flow, no tabs — two dropdowns: "Modo de importación" (`Sobrescribir todo el juego` by default / `Añadir a lo existente`) and "Comportamiento ante id duplicado" (`Sobrescribir el existente` by default / `Mantener ambos`). `onAccept({ mode, conflictMode })`. Initial `working` object: `{ mode: 'overwrite', conflictMode: 'overwrite' }` (change 00242 — `mode` default flipped from `'add'` to `'overwrite'`).
- **`ui/importReportModal.js`**: final import-report modal, a 4-column table ("Componente afectado", "Error", "Solución", "Elemento erróneo/faltante") — one row per broken reference resolved automatically by `core/importMerge.js`. Exposes `openImportReportModal(report)`, invoked only if `report` is non-empty.
- **`ui/importConversionErrorModal.js`**: unlike `ui/importReportModal.js` (informational, after applying), it opens **before** touching the current game, when some selected ficha could not be converted to `'carta'`. Reuses `.import-report-modal` with no own class, an error header (`modal__header--error`) and a 2-column table ("Ficha afectada", "Error", cell `.error-cell`). Exposes `openImportConversionErrorModal({ errors, onContinue, onAbort })` — two buttons ("Abortar importación" / "Continuar sin esas fichas") instead of the single "Cerrar" of `errorModal.js`/`importReportModal.js`; closing by click outside the overlay equals "Abortar" (same criterion as ESC via `ui/globalShortcuts.js`).
- **`ui/toast.js`**: brief non-blocking notice (`showToast(message)`), used by file save (download confirmation) and by startup in two cases — `parseState` returned `{ error: 'version-mismatch' }` (saved state from another app version) or `{ error: 'corrupt' }` (unreadable saved state). [gotcha] neither startup case shows a blocking error modal any more (see `007-persistence-build.md`).
- **`ui/globalShortcuts.js`**: exposes `initGlobalShortcuts({ isEditMode, onDeleteSelected, onMoveSelected })`, initialized once from `main.js` with `document.addEventListener('keydown', ...)`. Four shortcuts, direct equivalents of existing buttons/actions:
  - **ESC**: equals the `.btn-cancel` of the topmost `.modal-overlay` modal.
  - **ENTER**: equals its `.btn-accept`, if it exists and is not `disabled` (does not fire with focus in a `<textarea>`).
  - **DEL**: equals its `.btn-eliminar` if a modal is open; if none is and `isEditMode()` is `true`, invokes `onDeleteSelected()` (with focus outside `<input>`/`<textarea>`).
  - **Arrows** (`ArrowUp`/`Down`/`Left`/`Right`): invoke `onMoveSelected(dx, dy)`, step `1px` (`10px` with Shift) — only with no modal open, focus outside an editable field, `isEditMode()` is `true` (exclusive to edit mode).
  - Domain-agnostic module: does not depend on `modes/*`. Locates the "top" modal as the last `.modal-overlay` direct child of `document.body` (all `position: fixed` with no own `z-index`, the last added is the topmost), searches for buttons **always scoped to `.modal__footer`** (the `.btn-cancel` class is also reused as a secondary button inside the body of several modals, searching for it across the whole modal would give false positives).
  - `main.js` connects `isEditMode` to `getState().mode === MODES.EDIT`; `onDeleteSelected` to `deleteSelectedComponent()` (deletes the whole multi-selection: one element reuses simple confirmation + `removeComponent`; two or more open `ui/bulkDeleteConfirmModal.js` — same path as the "Eliminar" button of a row in that selection); `onMoveSelected` to `moveSelectedComponent(dx, dy)` (applies the same delta to each component of `selectedComponentIds` that does not have `bloqueado === 'todos'`, same criterion as the mouse-drag `canMove` — fixed delta the same for all, no anchor computation needed).
- **`ui/componentList.js`**: floating panel, collapsible/draggable/width-resizable, listing components in a table (Orden/Id/Tipo/Acciones), edit mode. Exposes `renderComponentList(container, components, { onEdit, onRemove, onSelectRow, onAdd, onReorder, selectedIds = new Set(), collapsed = false, onToggleCollapse, onPanelMove, onPanelResize } = {})`: header with title/collapse/drag zone (the header except the collapse button), body with a table (rows by ascending `order`, vertical scroll, row highlighted if `selectedIds.has(id)`), footer with "+ Añadir componente"; body and footer omitted if `collapsed`. Row "Eliminar" button: native `confirm()` unless the row belongs to an active multi-selection (`selectedIds.size > 1 && selectedIds.has(id)`), in which case it delegates to `onRemove(component, { bulk: true })` without confirming (the caller decides, opening `ui/bulkDeleteConfirmModal.js`). First cell: `<input type="number">` with `order` (digits only, sanitized on `input`; on confirm with `change` clamps to `[1, n]` and calls `onReorder(component, value)` — an empty value discards the change). The panel width (300px by default) lives as an inline style on `container` (not on the inner node recreated on every render), resizable (`ui/resizeHandle.js`, horizontal axis only, 290–600px or half the viewport, without leaving the table area); drag restricted to the table's visible area. `onPanelMove`/`onPanelResize` notify final position/width to persist in `core/state.js` (`panelState`, see `007-persistence-build.md`). Not used in play mode.
- **`ui/resourceList.js`**: floating panel analogous to `ui/componentList.js` (same drag/collapse/horizontal-resize pattern), listing resources (Nombre/Tipo/Acciones, no row selection). Exposes `renderResourceList(container, resources, { onEdit, onRemove, onAdd, collapsed = false, onToggleCollapse, onPanelMove, onPanelResize } = {})`, same position/width/collapse contract, persisted as `resourcePanelState` (independent of `panelState`).
- **`ui/resourceModal.js`**: edit modal for an existing resource (creation does not go through here), same visual structure as `ui/componentModal.js` (overlay/modal/header/content/footer) with no tabs, branched by `resource.type`: `'imagen'` — editable name, preview (`<img>`), "Cambiar imagen..." button (hidden file input, same extensions) over a working copy until "Aceptar cambios"; `'tipografia'` — no editable fields, only a preview with sample text (`ui/fontFaceRegistry.js`). "Eliminar" button in both cases, always delegated to the caller's `onDelete` (usage check + confirmation, in `modes/edit/editMode.js`).
- **`ui/fontFaceRegistry.js`**: keeps a single `<style>` (on demand) with one `@font-face` rule per typeface resource. Exposes `fontFamilyFor(resourceId)` (deterministic name, `resource-font-<id>`) and `syncFontFaces(resources)` (recomputes the `<style>`); `main.js` syncs on startup and on every `resources:changed`.
