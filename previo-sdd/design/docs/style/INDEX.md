# Style Bible — index

The app's current style conventions in `/src` (`src/styles/main.css` + `src/ui/*.js` + `src/modes/*`). All new UI follows these rules.

General technical architecture (layers, data model, build): see `design/docs/architecture/INDEX.md`.

## 1. Style stack

- Plain CSS, a single file: [main.css](../../src/styles/main.css). No preprocessor or CSS-in-JS.
- DOM built with vanilla JS (`document.createElement`, `className`, `classList`). No component framework.
- Files in `src/ui/*.js` = the "components".
- Do not add UI dependencies (React, Tailwind, etc.) without agreeing it first. App = vanilla JS + plain CSS.

## 7. Class naming — BEM

Convention: `block__element--modifier`.

- Block in kebab-case: `.component-list`, `.modal`, `.infinite-table`, `.edit-mode-panel`, `.help-icon`, `.board`, `.board-image-modal`, `.component-type-modal`. Names in English, unrelated to the `'tableroSimple'` component-type identifier — they are not renamed when that type is renamed.
- Element with a double underscore: `.component-list__item`, `.modal__header`, `.modal__tabs`, `.modal__field`, `.infinite-table__world`, `.help-icon__tooltip`.
- Modifier with a double dash: `.text-box--selectable`, `.text-box--movable`, `.modal__field--checkbox`.
- Transient states (not BEM, simple classes added/removed by JS): `.grabbing`, `.active`, `.lifted`, `.drop-target`.
  - No block prefix, used as-is.
  - Always with `classList.add/remove`, never replacing the whole `className`.
  - Exception: `.carta--flip-feedback` does carry the `carta--` prefix despite being transient — it describes a state exclusive to that block, not a generic one like `.lifted`.
  - `.is-copy`: the same "no block prefix" criterion even though it is not transient (kept while `component.copyOf` is not `null`). Cross-cutting over the 7 component types. Added by `ui/componentRenderer.js` alongside the type's own `--selectable` class. Used by `main.css` to paint the selection outline and `.component-id-label` red (see `03-modales-menus.md` §12.3).
  - `.is-group-passenger`: same criterion as `.is-copy` (no block prefix, cross-cutting over the 7 types, added by `ui/componentRenderer.js` alongside `--selectable`/`--selected`). Applied when the component belongs to a group (`groupId` non-null, see `design/docs/architecture/04-modes.md`, "Groups in edit mode") and is selected as a passenger — dragged into the selection by belonging to the group, without being the direct target of the click. `main.css` paints it gray (`var(--text-muted)`) instead of the usual blue/red, with no `:hover` variant (it only applies alongside `--selected`). If it coincides with `.is-copy` on the same element, `.is-group-passenger` wins (declared later in the cascade).
- Historical exception (do not follow BEM): `.btn-cancel`, `.btn-accept`, `.btn-eliminar`.
  - New standalone button variants (not tied to an existing block): use the `.btn-<intent>` pattern.
  - `.btn-duplicate`: same look as `.btn-cancel` (identical background/color/hover/disabled). Used when a modal footer needs a non-destructive/non-primary action distinct from "Cancelar" — lets `ui/globalShortcuts.js` locate the real "Cancelar" unambiguously on ESC (`querySelector('.modal__footer .btn-cancel')`).
  - `.btn-sacar` (`ui/mazoContentModal.js`): a small per-row button of `.mazo-contenido__item`. Background `var(--bg-subtle)`, hover `var(--accent-blue)`/light text — the same criterion as `.context-menu__item:hover`.
- A button that belongs to an already-existing block (e.g. a `.component-list` row): does not use the `.btn-*` exception. Normal BEM with a modifier: `.component-list__action-btn--danger`.
- IDs (`#mode-switcher`, `#content`, `#app-version`, `#edit-toolbar`): reserved for unique layout containers in `index.html`. Never for reusable components.

## 8. Component patterns (JS)

Each "component" = a function that creates and returns an `HTMLElement` via `document.createElement`, assigns `className` once on creation, uses `classList.add/remove/toggle` only for later dynamic states.

```js
const modal = document.createElement('div');
modal.className = 'modal';
```

See the full form in [componentModal.js](../../src/ui/componentModal.js).

- One file per component in `src/ui/`, camelCase (`componentList.js`, `componentModal.js`, `table.js`).
- UI states (active tab, dragging, selectable): always a class, never an inline style.
- Do not use `style.xxx =` from JS for anything expressible as a CSS class/token.
  - Legitimate exception: dynamically computed transforms (e.g. pan/zoom of `.infinite-table__world`) — a purely numeric value, meaningless as a class.

**Color field + associated thickness, same row.** When a modal has conceptually linked color and thickness (border/stroke), they go in the same row, not stacked.

- Pattern: `componentModal.js` (board border), `cardEditorModal.js` (border of each face of a card).
- Structure: outer `div.modal__field` → inner `div` (`style.display='flex'; style.gap='0.5rem'`) → two sub-`div` with `style.flex='1'` (color first, thickness second).
- The only admitted exception to "no `style.xxx=` from JS": one-off layout for that pair of fields, not a state/value reusable as a class.
- **Caution in a variable/bounded-width container**: the `flex:1` fields contain an `<input>` with `width:100%`. If the container has no explicit width anywhere in the ancestor chain (e.g. a column sized by its content, like each face of `cardEditorModal.js`), the `100%` does not resolve and the browser falls back to the `<input>`'s native width (much larger than expected). Fix: the row's container sets its own explicit width (`cardEditorModal.js` uses `faceCol.style.width` with the same value computed for the card canvas).
- **Extension to N related numeric fields**: same row pattern (`display:flex; gap:0.5rem`, one sub-`div` per `flex:1` field) when there are more than 2 related numeric fields. Example: `ui/cardTextBoxModal.js`, a row of 4 "Arriba"/"Derecha"/"Abajo"/"Izquierda" fields (`TextBox` margins, `<input type="number" min="0">` each) — a single row of 4, not two rows of 2.

## 13. What NOT to do

- Do not introduce a second color-token system (Tailwind, another palette) — extend `:root` in `main.css`.
- Do not mix inline `style="color:#..."` for colors in the token catalog (`01-tokens-visual.md` §2).
- Do not create single-use classes without BEM unless they fit the `.btn-*` exception.
- Do not add flashy gradients (beyond the existing subtle header gradient) or complex animations/transitions (`@keyframes`, narrative animations).
  - Shadows and radii are allowed: they always follow the elevation system (`01-tokens-visual.md` §6) and the radius scale (`01-tokens-visual.md` §5), never an ad-hoc per-component value.

### Bevel/depth — "Tablero simple", "Tablero personalizado", "Dado"

Complementary to their contact shadow.

- `'tableroSimple'` (`ui/componentRenderer.js`): simulates relief on the border by splitting the chosen color into two tones (lighter top/left, darker bottom/right), computed with `shadeColor` (`core/colorUtils.js`). No shadow or gradient — the contact shadow (`.board`, level 1) is a separate CSS `box-shadow`, not computed by this helper.
- `'dado'` (`ui/componentRenderer.js`, `renderDiceSilhouette`): draws only the main silhouette, a thin outline and internal faceting lines (4/8/9+ results), all with `shadeColor` — it no longer draws depth as a duplicated SVG polygon. `'dado'`'s depth/extrusion becomes "one more type" of the general property `profundidad`/`colorExtrusion` (see "Configurable extrusion", `01-tokens-visual.md` §6), applied as stacked `filter: drop-shadow` over the `.dice` container. Its contact shadow (`.dice`) still uses `filter: drop-shadow` (non-rectangular silhouette), independent of the extrusion.
- `'tableroPersonalizado'`: same two-tone criterion as `'tableroSimple'` (`.tablero-personalizado`, same level-1 shadow).
  - Difference from "Carta" (they share the same visual editor `ui/visualEditorModal.js` but not this treatment): parameter `borderStyle: 'bisel'` reuses `shadeColor` for the design canvas border, instead of the simple border of `'carta'` (`borderStyle: 'simple'`).
- Technique scoped to these three types — not applied to any other type without an explicit decision.
- In `'tableroSimple'` and `'tableroPersonalizado'` (not in `'dado'`, always beveled) the bevel is optional: property `biselado` (boolean, `true` by default), "Biselado en el borde" checkbox in the "Visual" section (informational, first of the specific-properties tab, see `03-modales-menus.md` §12.6).
  - Unchecked: paints the same `bordeColor` on all four sides without splitting into two tones (does not omit the property).
  - Points where it is applied: the table (`ui/componentRenderer.js`, both types) and, for `'tableroPersonalizado'`, the canvas preview in the Visual editor (`ui/visualEditorModal.js`, parameter `bevelEnabled` of `openVisualEditorModal`, read once on opening the editor).

### Rounded corners of "Carta"

- `'carta'` (`ui/componentRenderer.js`, `.carta` in `main.css`) uses `var(--radius-lg)` as the base in the CSS class — the same radius as "highlighted containers" (`.modal`, floating panels). Not a special value.
- For the five rectangular/square proportions: `8px` (`var(--radius-lg)`) is the default result of the `esquinasRedondeadas` property (boolean; see `design/docs/architecture/02-component-types.md`, type `'carta'`), applied as an inline style (`getCartaShapeCss`, `core/cardProportions.js`) — priority over the class.
- "Esquinas redondeadas" checkbox (`ui/visualEditorModal.js`, toolbar next to the Proporción selector, visible only if `showProporcionSelector` is `true`, i.e. only for `'carta'`) unchecked → `border-radius: 0`.
- Circular and Hexagonal are unaffected: they keep a fixed clip (`50%`/`clip-path`).
- Reuses `.modal__field--checkbox` as-is (the same pattern as "Bloqueado"/"Oculto" in `ui/componentModal.js`) — no new visual pattern.
- A card also carries a level-1 contact shadow (like the rest of the game pieces), unaffected by this property.

### "Mazo" reuses the `.carta` class

- `'mazo'` (`ui/componentRenderer.js`): no new BEM block for its box — being visually "a face-down card", it reuses `.carta` as-is (same `--radius-lg`, same level-1 shadow, same `--selectable`/`--selected`/`--movable` modifiers).
  - It only adds `.mazo--clickable` ("draw a card" cursor, equivalent to `.carta--clickable`/`.dice--clickable`).
- `.mazo-reveal-zone` ("reveal zone"): an own block, does not share a look with `.carta` — a box with a dashed border `var(--border-neutral)`, text `var(--text-muted)`, `pointer-events: none`. The same neutral tone as a read-only informational row (`.context-menu__info-row`, see `03-modales-menus.md` §12.8).
- `.btn-sacar` (`ui/mazoContentModal.js`): a standalone button that does not hang off any existing BEM block (historical exception of §7).

### Circular shape of "Mazo"

- The `forma` property of `'mazo'` sets `border-radius: 50%` inline when it is `'circular'` — priority over the class `.carta`'s `var(--radius-lg)`. The same mechanism as the `'circular'` proportion of "Carta", not a new exception.
- Applied to the deck box and to its inner clipped content (back of the top card, or "empty deck" icon).
- Contact shadow: no special treatment (unlike "Carta"'s hexagonal silhouettes) — `box-shadow` already follows the element's `border-radius`, projects a circular shadow automatically.
- `.mazo-reveal-zone` adopts the same criterion: `border-radius: 50%` inline if the deck is circular, instead of the default `var(--radius-sm)`.

### Card thumbnail in the "Deck content" modal

- `.mazo-contenido__thumb` (`ui/mazoContentModal.js`, block `.mazo-contenido__item`): an adjustable thumbnail of each card's front face in the "Ver contenido del mazo" modal's list (source: the deck's context menu in play mode or the deck's tab in edit mode).
  - Dimensions: the card's real width and height, scaled proportionally to fit within a maximum `THUMB_MAX_WIDTH` × `THUMB_MAX_HEIGHT` (42 × 58 pixels).
  - Shape: reuses `getCartaShapeCss` (`core/cardProportions.js`) to apply the same `border-radius` and `clip-path` as the real card by its `proporcion` (rectangular with rounded corners by default, circular, hexagonal, triangular).
  - Border: a neutral decorative "slot" border (`1px solid var(--border-neutral)`) only in rectangular/square proportions (where `clip-path: 'none'`). In hexagonal and triangular proportions (`clip-path` active) it is omitted, because CSS `border` does not follow the clipped silhouette — consistent with the real card on the table also not simulating a uniform-thickness border in those proportions (that two-nested-layer mechanism belongs to the card's choosable-color border, not applicable here).

### Hexagonal clip of "Carta"

- Proportions `'hex-vertical'`/`'hex-horizontal'`: do not use `var(--radius-lg)` or `border-radius: 50%` — clip with `clip-path` (exact regular-hexagon polygon, sharp vertices with no bevel or rounding). The only way to achieve a straight-edged silhouette.
- Applied at three points: card on the table (play/edit), each face's canvas in the card editor, image-adjust mask.
- Contact shadow: cannot be `box-shadow` (it would follow the rectangular box, not the hexagon) — uses `filter: drop-shadow` (class `.carta--hex`), the same criterion as `.dice`.

**Border in hexagonal proportions.**

- The border also cannot be painted with the CSS `border` property (always parallel to the rectangular box; clipping with `clip-path` cuts through the border at an angle instead of following the edges).
- Fix (`ui/componentRenderer.js`, `ui/visualEditorModal.js`): two nested, concentric `clip-path` layers.
  - Outer layer: filled with the border color, clipped with the full hexagon.
  - Inner layer: content (image, text boxes), clipped with a smaller hexagon.
  - The gap between the two = border, uniform thickness.
- The inner hexagon is computed with `getHexInnerClipPath` (`core/cardProportions.js`): these proportions' `ratio` always forces a regular hexagon, so shifting the six edges inward by a constant distance is equivalent to scaling the vertices from the center by a factor obtained from the apothem (`width/2` in `'hex-vertical'`, `height/2` in `'hex-horizontal'`).
- Technique scoped to these two proportions — the rest keep using normal CSS `border` (box and visible silhouette coincide).

### Triangular clip and border of "Carta"

- Proportions `'triangulo'`/`'triangulo-invertido'`: same mechanism as the hexagonal ones.
  - Clip with `clip-path` (straight-edged silhouette, not a strictly equilateral triangle — it occupies the full width and height of the square box, see `design/docs/architecture/02-component-types.md`).
  - Contact shadow with `filter: drop-shadow` (shared class `.carta--hex, .carta--triangle` in `main.css` — same reason: a non-rectangular silhouette cannot project a `box-shadow`).
  - Border via two nested `clip-path` layers.
- Technical difference: computing the inner clip.
  - Regular hexagon: the incenter coincides with the box center (`50%, 50%`), inradius = half the side.
  - This triangle: the incenter is **not** at the box center. `getTriangleInnerClipPath` (`core/cardProportions.js`, sibling of `getHexInnerClipPath`, not a generalization) scales from the real incenter of each variant (`TRIANGLE_GEOMETRY`, standard incenter/inradius formulas from the vertices).

### Color dedicated to the `.modal__section` title

- Token `--section-accent` (`#5b5f97`): exclusive use in the text of a framed section's `<legend class="modal__section-title">` (see `03-modales-menus.md` §12.6).
  - Not on any other element, nor on the `fieldset` frame (which uses the standard `--border-neutral`).
- Does not reuse `--accent-blue`/`--accent-blue-dark` (in the rest of the app they mean "interactive/selected": "Aceptar" button, selection outline, active tab) — a section title is not interactive.
- Exception scoped to this single use — do not reuse `--section-accent` for another purpose without an explicit decision.

### The die roll's flicker and shake — not a CSS animation

- The `'dado'` "roll" effect (~1s of random results changing fast before fixing the final result, `ui/componentRenderer.js`): repeated `textContent` change via a JS timer (`setInterval`/`setTimeout`), with no `transition` or `@keyframes`.
- Shake (a small random displacement of the die during that same second): same timer, recomputes `transform: translate()` on each tick — a purely numeric value in JS, the same exception documented in §8 for dynamic transforms (table pan/zoom), not a CSS animation/transition.
- Neither falls under this section's ban on complex animations nor requires its own exception.

### "Lift" effect on dragging in play mode

Integrated into the elevation system (see `01-tokens-visual.md` §6).

- Transient state `.lifted` (`src/styles/main.css`), added/removed by `ui/componentRenderer.js` (`beginDragLift`/`endDragLift`).
- Only when `renderComponentsOnTable` receives `liftOnDrag: true` (exclusive to `modes/play/playMode.js`, never `modes/edit/editMode.js`).
- Applies a fixed offset (`transform: translate(-2px, -4px)`) and a shadow (`box-shadow: 6px 7px 9px 2px rgba(0,0,0,0.35)`) while dragging — simulates the component lifting and settling back on release.
- Transitions with `var(--transition-fast)`, symmetric on lift and release — not instant.
- Does not reopen the general ban on complex animations (`@keyframes`, narrative): it keeps applying unchanged to the rest of the cases (die shake/flicker, `--selectable`/`--selected` outline).
- It is the "in the air" state of the same elevation system the rest of the pieces use at rest — scoped only to this transient state and this gesture (drag in play mode).

### Drop-zone highlight on a deck — "Mazo" during a card drag

Transient state while a card (or a cards-only selection, in edit mode) is dragged over a deck.

- Transient state `.drop-target` (`src/styles/main.css`), added/removed by `ui/componentRenderer.js` (`updateMazoDropHighlight`/`clearMazoDropHighlight`) on the `'mazo'` element.
- Applies in both modes (play and edit) equally — it lives in the shared render point (`renderComponentsOnTable`).
- Trigger: when the dragged card's rectangle overlaps a deck (same overlap criterion as the insertion drag&drop). Highlighted only if the dragged selection contains cards only (in play mode it is always a single card, in edit mode it can be a multi-selection if all are cards; if the selection mixes component types, nothing is highlighted).
- Solid blue outline + halo (`outline: 3px solid var(--accent-blue)` + `box-shadow` with `var(--accent-blue-light)`) — visually distinct from the dashed selection outline (`.carta--selected`, `dashed`), so as not to confuse the "drop zone" semantics with "selected element".
- Always removed on mouse release, whether or not the card is inserted into the deck — the table is fully redrawn if the insertion runs anyway.

### "Carta" flip feedback

A second transient state distinct from `.lifted`.

- State `.carta--flip-feedback` (`src/styles/main.css`): visually confirms a card changed face (click on `'carta'` in play mode, `onCartaFlip`).
- Unlike `.lifted`, it is not added/removed from the drag code (`mousedown`/`mousemove`/`mouseup`).
  - `ui/componentRenderer.js` detects the flip by data diff: it compares each card's current `caraActual` against the last seen, in an own module `Map` (`lastCaraById`), unrelated to any drag state.
  - It is applied/removed on creating the node in each render, with its own `setTimeout` (`flipFeedbackTimeouts`) — needed because `onCartaFlip` triggers a synchronous re-render that already destroyed the original node before any added class could be seen.
- Applies a vertical offset + a slight scale (`transform: translate(0, -6px) scale(1.03)`) alongside `box-shadow: var(--shadow-2)`, transitioning with `var(--transition-fast)` like `.lifted`.
- Does not replace or reuse `.lifted`: independent states, no shared variables or code paths, do not coexist in practice (a click without a drag never activates the lift).
- Does not reopen the general ban on complex animations: no `@keyframes` or narrative animations.

## Sibling files

| File | Covers |
|---|---|
| `01-tokens-visual.md` | Design tokens (`:root`), typography, spacing, borders/corners, elevation/shadow/transition |
| `02-componentes-layout.md` | Buttons, general layout (flex column, overlay z-index), resize (corner handle), sticky table header (`sticky`) |
| `03-modales-menus.md` | Help icon, error/success modals, cursors, component labels/badges, wide modals, maximize button, grouped checklist, sections inside tabs, actions dropdown menu, context menu, copy/paste style, icon-only button group, editable header title, slider with magnetic marks, illustrative per-row icon in "Add component" |
