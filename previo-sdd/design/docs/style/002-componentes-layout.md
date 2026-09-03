# Buttons, layout, resize, sticky table header

See `INDEX.md` for the full map of the Style Bible.

## 9. Buttons

All buttons share this base (adapt background/border by context):

```css
padding: 0.5rem 1rem;   /* or 0.25rem 0.5rem if a small button inside an item */
border: none;           /* or 1px solid var(--text-light) on a dark background */
border-radius: var(--radius-sm);
cursor: pointer;
font-size: 0.875rem;    /* or 0.75rem if small */
transition: background var(--transition-fast), opacity var(--transition-fast);
```

- Primary action: background `var(--accent-blue)`, text `var(--text-light)`. Hover: `opacity: 0.9` + `transform: translateY(-1px)` + `box-shadow: 0 3px 8px rgba(44,125,216,.35)`.
- Secondary/cancel action: background `var(--bg-subtle)`, text `var(--text-primary)`. Hover: `var(--bg-hover)` — only `background` transition, no `transform`.
- Destructive action (delete/remove): background `var(--error)`, text `var(--text-light)`. Hover: `opacity: 0.9` + `transform: translateY(-1px)` + `box-shadow: 0 3px 8px rgba(211,47,47,.3)` — same treatment as primary, only background/shadow color changes.
  - Applies to `.btn-eliminar` (modals) and the BEM modifier `--danger` (e.g. `.component-list__action-btn--danger`).
  - Any action that deletes an element uses this color across the whole app, never the primary blue.
- Button on a dark background (toolbar): transparent, border `1px solid var(--text-light)`. Hover: `rgba(255,255,255,0.1)` with a `background` transition, no `transform`.
  - Exception: `.edit-toolbar__exit-btn` ("Salir del modo edición", `ui/editModeToggle.js`) uses the **primary action** scheme inside `.edit-toolbar` (background `var(--accent-blue)`, `border-color: var(--accent-blue)`, text `var(--text-light)`; hover `opacity: 0.9` + explicit `background: var(--accent-blue)` to cancel the `rgba(255,255,255,0.1)` inherited from `.edit-toolbar button:hover`). Same visual criterion as "Entrar en modo edición" (`#mode-switcher button`) — the two mode-change actions share a look. The rest of `.edit-toolbar`'s buttons ("Importar", "Exportar") keep the transparent/border style.
- Disabled: `opacity: 0.5; cursor: not-allowed`, no `transform` on hover.
- No `:active` — interaction feedback is the `opacity`/`background`/`box-shadow`/`transform` change on `:hover`, with a 150ms transition (`var(--transition-fast)`).
- **Icon-only button** (action with no visible text): SVG icon with `stroke="currentColor"` (inherits the context's text/border color), always with `title`/`aria-label` as an accessible label.
  - Inside an existing bar button (e.g. `.edit-toolbar button`): same padding/size as that block's text buttons — only the content changes.
  - Standalone square floating button (e.g. `.mode-switcher__fit-btn`): `padding: 0`, fixed width/height (`36px`), centered icon (`display: inline-flex; align-items: center; justify-content: center`), same background/color as the context's primary action.
    - `.mode-switcher__fit-btn` ("Ajustar zoom" button, `createFitButton` in `ui/editModeToggle.js`): shown **in both modes** with the same look and the same position — floating in the top-right corner (`position: fixed; top: 0.5rem; right: 1rem; z-index: 101`), `36×36`, background `var(--accent-blue)`. In play mode it hangs off `#mode-switcher` (receives the `#mode-switcher` container's position and the blue background of `#mode-switcher button`). In edit mode it is mounted as a direct child of `#edit-toolbar` (outside `.edit-toolbar`), and the rule `#edit-toolbar > .mode-switcher__fit-btn` reapplies `position: fixed`/coordinates/`z-index: 101` and the primary-action background, because the `#mode-switcher` selectors do not reach it there. Hover `opacity: 0.9` in both cases.
    - The size rule block (`padding: 0; width: 36px; height: 36px; inline-flex; centered`) uses the selector `#mode-switcher .mode-switcher__fit-btn, #edit-toolbar > .mode-switcher__fit-btn` — it explicitly lists the two containers to win by specificity over `#mode-switcher button` (which sets `padding: 0.5rem 1rem` on every button descending from `#mode-switcher`; a bare `.mode-switcher__fit-btn` loses against it and the icon ends up distorted inside the `36×36`). The inner icon sizing (`.mode-switcher__fit-btn .icon-frame { 18×18 }`) is autonomous — it competes with no other rule.
- **Full-text button in a tight space**: when a text button is wedged between narrow elements (not in a loose action row) — e.g. `.card-editor-modal__adjust-image`, between the two faces of a card — it uses `padding: 0.5rem 0.75rem` as an intermediate variant between the standard (`0.5rem 1rem`) and the small item one (`0.25rem 0.5rem`). Reuse `0.75rem` instead of introducing a fourth ad-hoc value.

## 10. Layout

- App = full-height flex column: `html, body { height: 100% }`, `body { display:flex; flex-direction:column; height:100vh }`. Fixed header (`h1`, `3.5rem`) + flexible `#content` (`flex: 1 1 auto; min-height: 0`).
- Fixed-width side panels: `400px` (`.component-list`, `.edit-mode-panel`).
- Default initial position of edit-mode floating panels: both anchored to the right side, stacked vertically (`.component-panel-container` on top, `.resource-panel-container` below) — only a starting position, the user can drag each panel freely afterward.
- `z-index` of `.component-panel-container`/`.resource-panel-container`/`.tag-panel-container`: not a fixed CSS value — computed in `modes/edit/editMode.js` (`applyPanelStackOrder`, base `15`, one per position in `panelStackOrder`) to reflect which of the three is in front after the user's last interaction.
  - Being `position: absolute` inside `tableContainer` (not `fixed`), they fall outside the next layer table, but always well below its first layer (`99`, edit toolbar).

### Z-index of overlays (`position: fixed`)

| z-index | Layer |
|---|---|
| `10` | Version footer |
| `99` | Edit toolbar |
| `100` | Header |
| `101` | Mode switcher (`#mode-switcher`) and the floating "Ajustar zoom" button (`.mode-switcher__fit-btn`, in both modes) |
| `1000` | Modal overlay |
| `1050` | Component context menu (`.context-menu`, `03-modales-menus.md` §12.8) and column-header menu (`.column-header-menu`, `03-modales-menus.md` §12.7) |

- `1050` is the app's highest level, not the modal overlay — both menus can open with a modal already visible behind (e.g. the card editor) and must be in front of it.
- When adding a new fixed/absolute element: choose its `z-index` respecting this order (below the modal, above normal content).

## 11. Resize (corner handle)

Standard pattern to make any element in the app resizable (not exclusive to a component): `.resize-handle`, a standalone block (does not follow any other block's BEM, an exception similar to `.btn-*`), implemented in `ui/resizeHandle.js` (`attachResizeHandle`).

- Position: bottom-right corner of the element (`position: absolute; right: 0; bottom: 0`) — the host must be a positioned container (`position: relative/absolute`).
- Look: `18px` container with a `9px` diagonal grip (`::after` with gradients). Neutral gray by default, `var(--accent-blue)` + `transform: scale(1.15)` with a 150ms transition on `:hover`/`.resize-handle--active`. No own shadows or rounded corners.
- Cursor: `nwse-resize`, the same in all uses even if the element only resizes one axis (the same recognizable visual drag point across the app).
- Do not introduce a second resize pattern (side borders, multiple corners, etc.) without deciding it explicitly — reuse `ui/resizeHandle.js`.

### Second handle, top-left corner

`.resize-handle--tl`, applied alongside `.resize-handle` on the same host (same `ui/resizeHandle.js` mechanism, parameter `corner: 'tl'` — the same handle anchored to the opposite corner, not a second pattern).

- Any resizable element in the app can have this second handle.
- Differences from `.resize-handle`: position `left: 0; top: 0` instead of `right: 0; bottom: 0`. Same container/grip size, same `::after`, same look at rest/`:hover`/`.resize-handle--active`, same `nwse-resize` cursor (both corners on the same diagonal).
- When dragging it, the bottom-right corner stays fixed (the existing handle acts as an anchor). Whoever calls `attachResizeHandle` is responsible for also applying the position offset (`dx`/`dy` that `corner: 'tl'` exposes) to the host's model, not only the size.
- Hosts with a double handle (`.resize-handle` + `.resize-handle--tl`): floating panel `.component-panel`/`.resource-panel`; modal `.card-editor-modal` (visual editor — on starting the drag the JS pulls it out of the flexbox centering by switching it to `position: fixed` with its current geometry, so the corner opposite the handle has something to anchor to).

### Variant for a table column border

`.column-resize-handle`, applied alongside `.resize-handle` (same `ui/resizeHandle.js` mechanism, reused via `ui/tableColumnResize.js` — the same interaction oriented to a different border, not a second system).

- Differences from `.resize-handle`: occupies the full right border of the header cell (`top/bottom: 0`, not just the corner). Cursor `col-resize` instead of `nwse-resize`. Graphic: a thin vertical line (not a `::after` diagonal grip).
- Same neutral gray at rest and `var(--accent-blue)` on `:hover`/`.resize-handle--active`, same 150ms transition.

## 11.1 Table header sticky on scroll (`position: sticky`)

First use of `position: sticky` in the project: `.component-list th`/`.resource-list th`/`.tag-list th` — `position: sticky; top: 0; z-index: 2;`, inside their own scrolling container (`.component-panel__body`/`.resource-panel__body`/`.tag-panel__body`, `overflow-y: auto`).

- Goal: the column header always visible when scrolling down a long list, instead of scrolling away with the rows.
- Condition for it to work: the header needs an opaque background (`background: var(--bg-subtle)`, all three already had it) — without it, row content would show through as it passes underneath.
- `z-index: 2` is local to the table itself (above the rows, which have no own `z-index`) — unrelated to the fixed `position: fixed` levels of the Layout section (panels, modal, menus).
- `position: sticky` is still a positioned element for the purpose of containing `position: absolute` descendants — `.column-resize-handle` keeps working with no changes over a `sticky` header, just like over a `relative` one.
- Any future table with its own internal scroll: reuse this same pattern (`sticky` header + opaque background + local `z-index`) instead of creating an ad-hoc one.

## 11.2 Nested row under a parent block (`.component-list__row--member`, 00204)

First use of visual nesting inside a table row: a group's members are always shown right below their group's row in `.component-list`, indented and with a different background — like a folder's expanded content.

- **Background**: `var(--accent-blue-light)` at rest (same token as "light background for interactive panels" of `01-tokens-visual.md` §2 — not a new ad-hoc value), `#ddebf9` on `:hover` (a darker tone of the same family), and the standard selection blue (`rgba(44,125,216,.15)`) if it is also selected — same priority criterion as any `.component-list__row--selected` row.
- **Indentation**: additional `padding-left` on `.component-list__id-cell` (not the whole row) — only the Id cell shifts, the rest of the columns (Orden, Tipo, Copia, Acciones) keep their normal table alignment.
- **No connector line or icon**: unlike a file tree with visual guides, here the indentation + the different background are enough to read as "content of the block above" — an explicit decision (confirmed on a mockup) to avoid adding visual noise.
- **Disabled field inside a nested row**: `.component-list__order-input:disabled` — background `var(--bg-subtle)`, text `var(--text-muted)`, `cursor: not-allowed` — same criterion as any disabled control in the app (§9, "Disabled").
- Pattern scoped to this case for now — any other table that needs to nest rows under a parent can reuse it (background from the `--accent-blue-light` token, indentation only on the "identifying" cell, no connector line) instead of creating a new one.
