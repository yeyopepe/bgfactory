# Visual tokens, typography, spacing, borders, elevation

See `INDEX.md` for the full map of the Style Bible.

## 2. Design tokens (`:root`)

All colors live as custom properties in `:root`. Never hardcode a color that already has a token — reuse the existing one or add a new one to `:root` if a new reusable tone is needed.

```css
--bg-table:     #c2c2c2;  /* infinite-table background */
--bg-toolbar:   #333333;  /* header and toolbars */
--bg-card:      #f5f5f5;  /* panels/cards (lists, edit panel) */
--accent-blue:  #2c7dd8;  /* primary action color (buttons, focus, active tabs) */
--accent-blue-dark: #123a66;  /* background of the component identifier label in edit mode (03-modales-menus.md §12.3) */
--accent-blue-light: #eaf3fc;  /* light background for panels that stand out as interactive without the solid blue */
--text-primary: #1a1a1a;  /* text on light backgrounds */
--text-light:   #ffffff;  /* text on dark/accent backgrounds */
--text-muted:   #666666;  /* secondary text */
--error:        #d32f2f;  /* error states and destructive actions */
--success:      #2e7d32;  /* success / positive-confirmation states */
--border-neutral: #dcdcdc;  /* all thin neutral borders */
--bg-subtle:    #f0f0f0;  /* neutral backgrounds at rest: table header, secondary button */
--bg-hover:     #e8e8e8;  /* any neutral hover: row, secondary button, tab */
--radius-sm:    4px;   /* control radius, see §5 */
--radius-lg:    8px;   /* highlighted-container radius, see §5 */
--shadow-1:     0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.08);  /* elevation level 1, see §6 */
--shadow-2:     0 4px 20px rgba(0,0,0,0.15);  /* elevation level 2, see §6 */
--transition-fast: 150ms ease;  /* standard hover/focus transition, see §6 */
--section-accent: #5b5f97;  /* .modal__section title (03-modales-menus.md §12.6), distinct from --accent-blue/--accent-blue-dark (interactive/selected) */
```

- All neutral grays and reusable shadows/radii are already tokens — no "one-off" colors remain unpromoted.
- Overlays that are still one-off values (not repeated enough to deserve a token): `rgba(0,0,0,0.5)` (`.modal-overlay` background), `rgba(255,255,255,0.1)` (hover on the dark toolbar).

## 3. Typography

- Global font: `system-ui, sans-serif`. No external webfonts.
- Sizes used, largest to smallest — reuse these, do not invent intermediate sizes:

| Size | Use |
|---|---|
| `4rem` | Large result of the "Dado" component (`ui/diceResultModal.js`) — one-off exception for readability from a distance, only intended use |
| `1.5rem` | Main title (`h1`) |
| `1.125rem` | Panel titles (`.edit-mode-panel h2`) |
| `0.875rem` | Default UI text (buttons, tabs, labels, inputs, list items) |
| `0.75rem` | Auxiliary text (small buttons, validation error, version footer) |

- `font-weight: 500` for form labels. Rest: the browser's normal weight.

## 4. Spacing

Scale based on `rem`, steps of `0.25rem`: `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`. Do not use pixels for padding/margin except already-existing cases (`1px`/`2px` borders).

- Standard container padding: `1rem`.
- Control padding (buttons, tabs): `0.5rem 1rem`.
- Gap between flex elements: `0.5rem` (tight) or `1rem` (loose).

## 5. Borders and corners

Two-radius scale:

- `var(--radius-sm)` (4px) — controls: buttons (incl. small ones inside list items), inputs, small list/gallery items.
- `var(--radius-lg)` (8px) — highlighted containers: modal, floating panels (`.component-panel`, `.resource-panel`), "Carta" component.
- Borders: `1px solid var(--border-neutral)`, or `1px solid var(--text-light)` on a dark background (toolbar).

## 6. Elevation, shadow and transition

A 3-level elevation system, reusable across the app.

- **Level 0 — flat**: infinite table and any content embedded inside another element (e.g. `.document-viewer__content`). No shadow.
- **Level 1 — subtle float** (`box-shadow: var(--shadow-1)`): work panels (`.component-panel`, `.resource-panel`), header/toolbar (`h1`, `.edit-toolbar`), `.toast`, game pieces on the table (`.board`, `.tablero-personalizado`, `.carta`, `.document-viewer`).
  - `.dice`: uses `filter: drop-shadow(...)` instead of `box-shadow`, so the shadow follows the real silhouette (triangle/square/rhombus/decagon) instead of the container's square box.
  - `.carta--hex` (hexagonal-proportion card): same criterion as `.dice` — non-rectangular silhouette, uses `filter: drop-shadow(...)`.
  - `.text-box` (loose text on the table, no box/background): uses `text-shadow` instead of `box-shadow`, only for readability over any table color.
- **Level 2 — overlay** (`box-shadow: var(--shadow-2)`): modals (`.modal`) and `.help-icon__tooltip` — the highest level.
- **Optional shadow of `'tableroSimple'`/`'tableroPersonalizado'`**: unlike the rest of the level-1 pieces, their contact shadow can be disabled per component.
  - "Sombra" checkbox in the "Visual" section (`.modal__field--checkbox`, see `03-modales-menus.md` §12.6).
  - `properties.sombra` (boolean, `true` by default).
  - Unchecked: modifier `.board--sin-sombra`/`.tablero-personalizado--sin-sombra` (`box-shadow: none`) — the component drops to level 0.
  - A board saved without this property behaves as if checked (with shadow) — no visual change.
- The transient state `.lifted` on dragging a component in play mode is the "in the air" state of this same system (a more pronounced shadow + fixed offset during the drag) — not an isolated exception. Full detail in `INDEX.md` §13.
- **Configurable extrusion** (`profundidad`/`colorExtrusion`, general component field, `core/component.js`): stacked solid layers with no blur, not a diffuse shadow. A concept independent of and compatible with the 3 elevation levels — it does not introduce a fourth level. Elevation = contact shadow with the table; extrusion = thickness/body of the component itself.
  - `profundidad`: number, px, `0` by default (no effect), cap `40`.
  - `colorExtrusion`: color string or `null` (automatic computation `shadeColor(colorBase, -0.25)`, `colorBase` by type — see `ui/componentRenderer.js`, `resolveExtrusionColor`).
  - Technique: `Array.from({length: profundidad}, (_, i) => i+1)` layers of 1px accumulated offset — `box-shadow: ${i+1}px ${i+1}px 0 0 ${color}` (types with no `clip-path`) or `filter: drop-shadow(${i+1}px ${i+1}px 0 ${color})` (types with `clip-path`: `'carta'` hex/triangle, `'dado'`), joined with the existing level-1 contact shadow where applicable.
  - No effect on `'texto'`, whatever `properties.colorFondo` is.
  - `'dado'` no longer has its own depth mechanism (duplicated SVG polygon) — it uses this general mechanism like any other type, applied over `.dice`.
- **Transitions**: interactive elements (buttons, list rows, tabs, selectable items, help icon, form fields) carry `transition: <property> var(--transition-fast)` (150ms) on `:hover`/`:focus` changes — background/border color, `opacity`, `box-shadow`, and on primary/destructive action buttons a slight `transform: translateY(-1px)`.
  - Do not use `:active`.
  - Do not use transitions on the dashed selection outline (`--selectable`/`--selected`) nor on the die's shake/flicker — they are functional state indicators and pure JS, not decoration (see `INDEX.md` §13).
