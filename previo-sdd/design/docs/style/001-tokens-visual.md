# 001 — Visual tokens, typography, spacing, borders, elevation

**Area**: Tokens

## Design tokens (`:root`)

All colors live as custom properties in `:root`. Never hardcode a color/spacing/radius/shadow/duration that already has a token — reuse the existing one or add a new one to `:root` if a new reusable value is needed. 66 tokens total (00237, from 21).

```css
--bg-table:     #c2c2c2;  /* infinite-table / splash-overlay background base */
--bg-table-dot: rgba(0, 0, 0, 0.09);  /* dot of the table's dotted pattern (see "Table dotted background" below) */
--bg-toolbar:   #333333;  /* header and toolbars */
--bg-card:      #f5f5f5;  /* panels/cards (lists, edit panel) */
--accent-blue:  #2c7dd8;  /* primary action color (buttons, focus, active tabs) */
--accent-blue-dark: #123a66;  /* background of the component identifier label in edit mode (003-modales-menus.md, Component identifier label) */
--accent-blue-light: #eaf3fc;  /* light background for panels that stand out as interactive without the solid blue */
--text-primary: #1a1a1a;  /* text on light backgrounds */
--text-light:   #ffffff;  /* text on dark/accent backgrounds */
--text-muted:   #666666;  /* secondary text */
--error:        #d32f2f;  /* error states and destructive actions */
--success:      #2e7d32;  /* success / positive-confirmation states */
--border-neutral: #dcdcdc;  /* all thin neutral borders */
--bg-subtle:    #f0f0f0;  /* neutral backgrounds at rest: table header, secondary button */
--bg-hover:     #e8e8e8;  /* any neutral hover: row, secondary button, tab */
--radius-sm:    4px;   /* control radius, see Borders and corners */
--radius-lg:    8px;   /* highlighted-container radius, see Borders and corners */
--shadow-1:     0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.08);  /* elevation level 1, see Elevation */
--shadow-2:     0 4px 20px rgba(0,0,0,0.15);  /* elevation level 2, see Elevation */
--transition-fast: 150ms ease;  /* standard hover/focus transition = --duration-fast (unified 00237, no separate token); see Elevation */
--section-accent: #5b5f97;  /* .modal__section title (003-modales-menus.md §12.6), distinct from --accent-blue/--accent-blue-dark (interactive/selected) */

/* Surfaces */
--bg-surface:   #ffffff;  /* white surface for modals and previews */
--bg-overlay:   rgba(0, 0, 0, 0.5);  /* dark veil behind a modal (.modal-overlay) */

/* Blue accent (alphas) */
--accent-blue-alpha-15: rgba(44, 125, 216, 0.15);  /* focus rings, selected rows */
--accent-blue-alpha-25: rgba(44, 125, 216, 0.25);  /* floating menu borders */
--accent-blue-alpha-35: rgba(44, 125, 216, 0.35);  /* elevated hover on controls; primary button hover shadow */

/* Semantic colors */
--error-subtle: rgba(211, 47, 47, 0.08);  /* error zone background */
--error-alpha:  rgba(211, 47, 47, 0.35);  /* error icon shadow; destructive button hover shadow (unified from 0.3/0.4) */
--success-subtle: rgba(46, 125, 50, 0.08);  /* success zone background */
--success-alpha: rgba(46, 125, 50, 0.4);  /* success icon shadow */
--warning:      #e65100;  /* dark orange, non-destructive warnings */
--warning-subtle: rgba(230, 81, 0, 0.08);  /* warning background */
--info:         #0277bd;  /* informational blue, distinct from --accent-blue (informative ≠ interactive) */
--info-subtle:  rgba(2, 119, 189, 0.08);  /* informational message background */

/* Gray scale (9 steps) */
--gray-100: var(--bg-card);        /* alias, no new value */
--gray-200: var(--bg-subtle);      /* alias */
--gray-300: var(--bg-hover);       /* alias */
--gray-400: var(--border-neutral); /* alias */
--gray-500: #cccccc;               /* new — secondary borders (checkerboard border) */
--gray-600: #999999;               /* new — icons/decorative dots (grips, badges) */
--gray-700: var(--text-muted);     /* alias */
--gray-800: #3a3a3a;               /* new — dark end of header gradient */
--gray-900: var(--text-primary);   /* alias */

/* Toolbar colors (white-on-dark) */
--toolbar-hover:   rgba(255, 255, 255, 0.1);
--toolbar-divider: rgba(255, 255, 255, 0.2);
--toolbar-muted:   rgba(255, 255, 255, 0.55);

/* Typography — sizes (8 steps) */
--text-2xs:    0.7rem;   /* 11.2px */
--text-xs:     0.75rem;  /* 12px */
--text-sm:     0.875rem; /* 14px — most-used size */
--text-base:   1rem;     /* 16px */
--text-md:     1.125rem; /* 18px */
--text-lg:     1.5rem;   /* 24px */
--text-xl:     2rem;     /* 32px */
--text-display: 4rem;    /* 64px */

/* Typography — weight and line-height */
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--leading-tight:   1.2;
--leading-normal:  1.5;
--leading-relaxed: 1.65;

/* Spacing (8 steps, multiples of 4px) */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */

/* Corners (6 steps) */
--radius-xs:   2px;
--radius-md:   6px;
--radius-xl:   12px;
--radius-full: 9999px;  /* pill/circle */

/* Shadows — elevation levels */
--shadow-0: none;
--shadow-3: 0 8px 24px rgba(0, 0, 0, 0.18);  /* large modal */
--shadow-lifted: 6px 7px 9px 2px rgba(0, 0, 0, 0.35);  /* drag "lifted" state */

/* Shadows — state */
--shadow-focus:        0 0 0 3px var(--accent-blue-alpha-15);  /* normal focus ring */
--shadow-focus-strong: 0 0 0 3px var(--accent-blue-alpha-25);  /* selected-element focus ring */
--shadow-badge:        0 2px 4px rgba(0, 0, 0, 0.25);  /* floating badges (lock, hidden, copies) */

/* Animation — durations */
--duration-instant: 80ms;
--duration-normal:  250ms;
--duration-slow:    400ms;

/* Animation — easing curves */
--ease-default: ease;
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-in:     cubic-bezier(0.4, 0, 1, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

- [gotcha] `--gray-100`/`--gray-200`/`--gray-300`/`--gray-400`/`--gray-700`/`--gray-900` are aliases (`var(--existing-token)`), not independent values — one source of truth, the existing semantic token stays in place, both names cannot diverge.
- [gotcha] there is no `--duration-fast` token. `--transition-fast: 150ms ease` (pre-existing) is reused for the "fast" duration step instead of introducing a second name for the same 150ms value (00237 decision).
- One-off values remaining after 00237 (deliberately not promoted): `--bg-table-dot` (`rgba(0,0,0,0.09)`, table dotted pattern, too specific), `--section-accent` (`#5b5f97`, single documented exception). `.splash-window__title sup { font-size: 0.5em }` stays relative, out of the type scale (see Typography below).

### Table dotted background

The game table's ground: solid `var(--bg-table)` + a dotted pattern.

| Property | Value |
|---|---|
| `background-color` | `var(--bg-table)` |
| `background-image` | `radial-gradient(circle, var(--bg-table-dot) 1.5px, transparent 1.5px)` |
| `background-size` | `32px 32px` |

- Used by `.infinite-table` (the game table, adds `background-position: -8px -8px` to align the grid to the table's coordinate origin) and by `.splash-overlay` (00248, no `background-position` — static full-screen overlay; the startup splash shows "over the table"). See `003-modales-menus.md`, "Startup splash / welcome screen".
- [gotcha] the pattern is duplicated in those two rules, not extracted to a shared utility. `body` only carries `background: var(--bg-table)` — the solid ground, NOT the dots. Change the pattern → update both rules.

### Color dedicated to the `.modal__section` title

- Token `--section-accent` (`#5b5f97`): exclusive use in the text of a framed section's `<legend class="modal__section-title">` (see `003-modales-menus.md` §12.6).
  - Not on any other element, nor on the `fieldset` frame (which uses the standard `--border-neutral`).
- Does not reuse `--accent-blue`/`--accent-blue-dark` (in the rest of the app they mean "interactive/selected": "Aceptar" button, selection outline, active tab) — a section title is not interactive.
- Exception scoped to this single use — do not reuse `--section-accent` for another purpose without an explicit decision.

## Typography

- Global font: `system-ui, sans-serif`. No external webfonts.
- 8-step size scale (00237, from 5 fixed sizes with no intermediate steps allowed) — every step has real usage, none reserved:

| Token | Value | px | Use |
|---|---|---|---|
| `--text-2xs` | `0.7rem` | 11.2 | Component labels in table cells (also absorbs `0.72rem`) |
| `--text-xs` | `0.75rem` | 12 | Errors, hints, toasts, small badges (also absorbs `0.8125rem`/13px) |
| `--text-sm` | `0.875rem` | 14 | Default UI text: controls, labels, inputs, list items (also absorbs `0.9375rem`/15px and `0.95rem`/~15.2px) |
| `--text-base` | `1rem` | 16 | Panel-header buttons |
| `--text-md` | `1.125rem` | 18 | Modal titles, dice-font preview |
| `--text-lg` | `1.5rem` | 24 | Main title (`h1`) |
| `--text-xl` | `2rem` | 32 | `.splash-window__title` (consolidated from `2.25rem`/36px) |
| `--text-display` | `4rem` | 64 | Large "Dado" result (`ui/diceResultModal.js`) |

- [gotcha] `.splash-window__title sup { font-size: 0.5em }` is NOT on this scale — relative to its parent's font-size by design (a superscript scales with its container's text), stays a literal value.
- Intermediate values consolidated into the nearest step (accepted 1-4px visual difference, no new step added): `0.8125rem`→`--text-xs` (−1px), `0.9375rem`→`--text-sm` (−1px), `0.95rem`→`--text-sm` (~−1.2px), `2.25rem`→`--text-xl` (−4px, largest jump — splash title legibility checked visually in 00237).
- Weight: `--font-normal` (400, browser default), `--font-medium` (500, form labels), `--font-semibold` (600, group names / emphasis). [gotcha] `.splash-window__title` keeps a literal `font-weight: 700`, not `--font-semibold` — deliberate exception for the app's largest title, decided case-by-case (00237).
- Line-height: `--leading-tight` (1.2, titles/headers — incl. `.splash-window__title`), `--leading-normal` (1.5, general UI text), `--leading-relaxed` (1.65, long-form embedded content). Only exact literal matches were migrated in 00237; other line-height values in the codebase (`1`, `1.3`, `1.35`, `1.4`) are close but not exact — left as literals, not forced onto this scale.

## Spacing

8-step scale, multiples of 4px (00237, from an unscaled `0.25rem`-increment convention):

| Token | Value | px |
|---|---|---|
| `--space-1` | `0.25rem` | 4 |
| `--space-2` | `0.5rem` | 8 |
| `--space-3` | `0.75rem` | 12 |
| `--space-4` | `1rem` | 16 |
| `--space-5` | `1.25rem` | 20 |
| `--space-6` | `1.5rem` | 24 |
| `--space-8` | `2rem` | 32 |
| `--space-12` | `3rem` | 48 |

- `1.75rem` (28px, between `--space-8` and the step below) consolidates into `--space-8` (32px): `.progress-modal` padding, `.splash-window` padding, `.component-list__row--member .component-list__id-cell` indentation.
- [gotcha] `1.75rem` used as icon `width`/`height` (not spacing) is untouched — out of this scale by definition.
- Standard container padding: `1rem` (`--space-4`). Control padding (buttons, tabs): `0.5rem 1rem`. Gap between flex elements: `0.5rem` (`--space-2`, tight) or `1rem` (`--space-4`, loose).

## Borders and corners

6-step scale (00237, from 2 steps):

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | `2px` | Very small details (rotation-control marks) |
| `--radius-sm` | `4px` | Controls: buttons (incl. small ones inside list items), inputs, small list/gallery items |
| `--radius-md` | `6px` | Medium elements |
| `--radius-lg` | `8px` | Highlighted containers: modal, floating panels (`.component-panel`, `.resource-panel`), "Carta" component |
| `--radius-xl` | `12px` | Large/highlighted elements |
| `--radius-full` | `9999px` | Pill/circle — spinners, circular badges, "has copies" badge (replaces a literal `9px`, no longer height-dependent) |

- Borders: `1px solid var(--border-neutral)`, or `1px solid var(--text-light)` on a dark background (toolbar).

## Elevation, shadow and transition

5-level elevation system (00237, from 3), reusable across the app.

| Token | Value | Level / use |
|---|---|---|
| `--shadow-0` | `none` | Flat — active-drag state with no shadow |
| `--shadow-1` | `0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.08)` | Subtle float — work panels (`.component-panel`, `.resource-panel`), header (`h1`), `.toast`, game pieces at rest (`.board`, `.tablero-personalizado`, `.carta`, `.document-viewer`) |
| `--shadow-2` | `0 4px 20px rgba(0,0,0,0.15)` | Overlay — regular modals (`.modal`), `.help-icon__tooltip` |
| `--shadow-3` | `0 8px 24px rgba(0,0,0,0.18)` | Large modal — `.component-editor-modal` (visual editor), `.element-selection-modal` (complex selection modal), `.splash-window` (startup splash) |
| `--shadow-lifted` | `6px 7px 9px 2px rgba(0,0,0,0.35)` | Active drag — `.lifted` transient state |

State shadows:

| Token | Value | Use |
|---|---|---|
| `--shadow-focus` | `0 0 0 3px var(--accent-blue-alpha-15)` | Focus ring, normal fields |
| `--shadow-focus-strong` | `0 0 0 3px var(--accent-blue-alpha-25)` | Focus ring, selected/edit-mode elements |
| `--shadow-badge` | `0 2px 4px rgba(0,0,0,0.25)` | Floating badges: lock, hidden, copies; floating-panel header count badge (00268, `003-modales-menus.md` "Floating-panel header: icon + title + count badge") |

- [gotcha] two separate focus-ring tokens are kept (not consolidated) because they reflect a real existing distinction: normal fields use the lighter opacity, selected elements the stronger one.
- `.dice`: uses `filter: drop-shadow(...)` instead of `box-shadow`, so the shadow follows the real silhouette (triangle/square/rhombus/decagon) instead of the container's square box.
- `.carta--hex` (hexagonal-proportion card): same criterion as `.dice` — non-rectangular silhouette, uses `filter: drop-shadow(...)`.
- `.carta--triangle` (triangular-proportion card): same criterion as `.dice`/`.carta--hex`.
- `.text-box` (loose text on the table, no box/background): uses `text-shadow` instead of `box-shadow`, only for readability over any table color.
- **Optional shadow of `'tableroSimple'`/`'tableroPersonalizado'`**: unlike the rest of the level-1 pieces, their contact shadow can be disabled per component.
  - "Sombra" checkbox in the "Visual" section (`.modal__field--checkbox`, see `003-modales-menus.md` §12.6).
  - `properties.sombra` (boolean, `true` by default).
  - Unchecked: modifier `.board--sin-sombra`/`.tablero-personalizado--sin-sombra` (`box-shadow: none`) — the component drops to level 0.
  - A board saved without this property behaves as if checked (with shadow) — no visual change.
- The transient state `.lifted` on dragging a component in play mode is the "in the air" state of this same system (`--shadow-lifted` + fixed offset during the drag) — not an isolated exception. See "'Lift' effect on dragging in play mode" below.
  - `.dice.lifted`, `.carta--hex.lifted`, `.carta--triangle.lifted`: same `filter: drop-shadow(...)` criterion as their rest-state rule above, applies to `.lifted` too — `box-shadow` would paint the container's rectangular box regardless of the `clip-path` on an inner child, not the real silhouette.
  - [gotcha] a component with extrusion (`profundidad > 0`, see "Configurable extrusion" below) sets its rest-state shadow as an **inline** `style.filter`/`style.boxShadow` — an inline style always wins over any stylesheet rule, `.lifted`/`.dice.lifted`/`.carta--hex.lifted`/`.carta--triangle.lifted` included, no matter their specificity. `beginDragLift`/`endDragLift` (`ui/componentRenderer.js`) remove that inline value (saved in `el.dataset`) right before adding `.lifted`, and restore it as-is right after removing it — otherwise the lift effect would silently do nothing on any extruded piece (`'dado'` reproduces it by default, since it's created with `profundidad: 4`).
- **Configurable extrusion** (`profundidad`/`colorExtrusion`, general component field, `core/component.js`): stacked solid layers with no blur, not a diffuse shadow. A concept independent of and compatible with the 5 elevation levels — it does not introduce a new level. Elevation = contact shadow with the table; extrusion = thickness/body of the component itself.
  - `profundidad`: number, px, `0` by default (no effect), cap `40`.
  - `colorExtrusion`: color string or `null` (automatic computation `shadeColor(colorBase, -0.25)`, `colorBase` by type — see `ui/componentRenderer.js`, `resolveExtrusionColor`).
  - Technique: `Array.from({length: profundidad}, (_, i) => i+1)` layers of 1px accumulated offset — `box-shadow: ${i+1}px ${i+1}px 0 0 ${color}` (types with no `clip-path`) or `filter: drop-shadow(${i+1}px ${i+1}px 0 ${color})` (types with `clip-path`: `'carta'` hex/triangle, `'dado'`), joined with the existing level-1 contact shadow where applicable.
  - No effect on `'texto'`, whatever `properties.colorFondo` is.
  - `'dado'` no longer has its own depth mechanism (duplicated SVG polygon) — it uses this general mechanism like any other type, applied over `.dice`.
- **Transitions**: interactive elements (buttons, list rows, tabs, selectable items, help icon, form fields) carry `transition: <property> var(--transition-fast)` (150ms) on `:hover`/`:focus` changes — background/border color, `opacity`, `box-shadow`, and on primary/destructive action buttons a slight `transform: translateY(-1px)`.
  - Do not use `:active`.
  - Do not use transitions on the dashed selection outline (`--selectable`/`--selected`) nor on the die's shake/flicker — they are functional state indicators and pure JS, not decoration (see "The die roll's flicker and shake — not a CSS animation" below).
  - **Startup splash progress bar** (`.splash-window__progress-fill`, `003-modales-menus.md`, changes 00245/00246/00247): `animation: splash-progress-fill 3s linear forwards` (00247, was 5s), keyframes on `transform: scaleX(0 → 1)` — a long-duration functional animation (3s time indicator), not a hover/focus micro-transition. `@keyframes splash-progress-fill` is the **2nd `@keyframes` in the project**, alongside `@keyframes progress-modal-spin`. [gotcha] `width`-based approaches (00245 JS-toggled `transition`, 00246 `@keyframes` on `width`) did not animate in the real browser — `main.js`'s blocking bootstrap defers the paint they rely on; `transform: scaleX` (compositor-only) starts reliably on render-tree entry.
- **Animation tokens** (`--duration-instant`/`--duration-normal`/`--duration-slow`, `--ease-default`/`--ease-out`/`--ease-in`/`--ease-spring`, 00237): defined as a base ahead of their intensive use, which arrives with the microinteractions area — no consumer yet in the codebase beyond `--transition-fast` (pre-existing, reused as the "fast" duration step). Not dead code: shared foundation for future work.

### z-index scale

Highest-to-lowest, for stacking new overlays:

| z-index | Element |
|---|---|
| `1300` | `.splash-overlay` (startup splash, `003-modales-menus.md`, 00245) — project maximum |
| `1200` | `.export-menu` |
| `1100` | `.toast` |
| `1050` | `.context-menu`, `.column-header-menu` |
| `1000` | `.modal-overlay` (all modals, incl. `.progress-modal`) |
| `101` / `100` | `#mode-switcher` / `h1` header |

- Floating panels (`.component-panel`, `.resource-panel`) get their z-index assigned dynamically in JS (`editMode.js`, `applyPanelStackOrder`), below the modal layer.
- A new always-on-top overlay goes above `1300`; anything modal-like reuses `1000`.

### Motion-reduction (`prefers-reduced-motion`)

- Not used anywhere in the project. The 2 animations (`progress-modal-spin`, `splash-progress-fill`) are functional indicators (operation-in-progress, time-remaining), not decoration — both run unconditionally. A `@media (prefers-reduced-motion: reduce)` block for the splash bar existed briefly (00246) and was removed in the same session.

### "Lift" effect on dragging in play mode

Integrated into the elevation system above.

- Transient state `.lifted` (`src/styles/main.css`), added/removed by `ui/componentRenderer.js` (`beginDragLift`/`endDragLift`).
- Only when `renderComponentsOnTable` receives `liftOnDrag: true` (exclusive to `modes/play/playMode.js`, never `modes/edit/editMode.js`).
- Applies a fixed offset (`transform: translate(-2px, -4px)`) and `box-shadow: var(--shadow-lifted)` while dragging — simulates the component lifting and settling back on release.
- [gotcha] `.dice.lifted`, `.carta--hex.lifted`, `.carta--triangle.lifted` override that `box-shadow` with `none` and use `filter: drop-shadow(6px 7px 6px rgba(0,0,0,0.40))` instead — same rest-state criterion (non-rectangular silhouette clipped in an inner child, `box-shadow` on the outer box would paint a rectangle regardless). Every other piece keeps `.lifted`'s plain `box-shadow` unchanged.
- Transitions with `var(--transition-fast)`, symmetric on lift and release — not instant.
- Does not reopen the general ban on complex animations (`@keyframes`, narrative): it keeps applying unchanged to the rest of the cases (die shake/flicker, `--selectable`/`--selected` outline).
- It is the "in the air" state of the same elevation system the rest of the pieces use at rest — scoped only to this transient state and this gesture (drag in play mode).

### The die roll's flicker and shake — not a CSS animation

- The `'dado'` "roll" effect (~1s of random results changing fast before fixing the final result, `ui/componentRenderer.js`): repeated `textContent` change via a JS timer (`setInterval`/`setTimeout`), with no `transition` or `@keyframes`.
- Shake (a small random displacement of the die during that same second): same timer, recomputes `transform: translate()` on each tick — a purely numeric value in JS, the same exception documented in `004-naming-and-patterns.md` (Component patterns) for dynamic transforms (table pan/zoom), not a CSS animation/transition.
- Neither falls under the general ban on complex animations (`004-naming-and-patterns.md`, "What NOT to do") nor requires its own exception.
