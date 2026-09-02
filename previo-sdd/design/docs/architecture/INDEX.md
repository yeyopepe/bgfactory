# Technical design — "BF Factory" digital prototype

Map of the architecture documentation. This file covers goal/constraints, layers, code conventions and the checklist to review when adding a new type/collection. For data model, modes, UI and persistence, see the sibling-file table at the end.

## 1. Goal and constraints

- Digital prototype runs in any modern browser.
- Deliverable: a single self-contained HTML file (JS and CSS embedded, any external library embedded in the file itself).
- Opens with a double click (`file://`), no server or installation.
- Build does not depend on Node.js or complex build tools: uses Python.
- Source code organized in separate files/layers inside `/src`.
- `src/scripts/build.py` transforms the source code into a single versioned file under `src/_output/versions/`.

## 2. Layered architecture

```
core/    → application state, data model (components and resources), event bus, persistence and file export
modes/   → play mode and edit mode, each in its own folder
ui/      → interface elements reused across modes
data/    → app version data and default gallery resources
main.js  → bootstrap: wires the previous layers
```

Dependencies between layers (arrow = "depends on"):

```
modes/* ──▶ ui/* ──▶ core/*
modes/* ──────────▶ core/*
main.js ──▶ data/*, ui/*, modes/*, core/*
```

- `core` depends on no other layer.
- `ui` depends only on `core` (reads/writes state).
- `modes` composes `ui` and `core` to build each screen.
- `main.js` is the only point that knows and wires all layers.
- State (`core/state.js`) is the single source of truth.
- Changes are notified via a simple event bus (`core/eventBus.js`, `emit`/`on`) so the UI re-renders without coupling modules to each other.

## 7. Code conventions

- ES modules (`import`/`export`) organized by layer/responsibility, one file per functional module.
- No external dependencies by default.
- A new library is only incorporated if its bundle can be embedded whole in the final HTML (no CDN at runtime, no additional installation).
- Graphic resources go in `/src/img`, organized by component type.
- Visual conventions (color tokens, typography, spacing, BEM naming, component patterns) documented in `design/docs/style/`.
- `src/test/` contains `.json` example files in the format exported by "Guardar a fichero" (`core/fileExport.js`: `{ version, components, resources }`), to import manually (pasting into `#initial-state`, or via `localStorage`) and test already-configured component types.
- Code comments: only the necessary ones. They explain the non-obvious why (hidden constraint, invariant, one-off workaround), never the what (the code already says it). No comment if removing it would not confuse a later reader.
- Comment style, when needed: same as the technical documentation — telegraphic. No superfluous articles, no filler adverbs, verbs in present, implicit subject. References (field name, type, file) always explicit, unambiguous.
- Exception: `src/vendor/` and `src/scripts/vendor/` are third-party code as-is (§2) — their comments are not touched.

## 8. Checklist when adding a new type/collection

Cross-cutting features, not tied to a single type — they iterate "all there are". Review each when adding a component type or a new collection at the `core/state.js` level:

- **Persistence and file save** (`core/persistence.js`, `core/fileExport.js`): both serialize a fixed list of fields (`components`, `panelState`, `resources`, `resourcePanelState`, `resourcesSeeded`, `tags`, `tagPanelState`, `appTitle`). A new collection/field at the `state.js` level must be added explicitly in both places, and in the autosave event subscription — otherwise it is neither saved nor exported.
- **Resource-usage detection** (`core/resource.js`, `isResourceInUse`/`getComponentsUsingResource` + helper `collectDeepValues`): traverses `component.properties` deeply to find any reference to a `resourceId`. If a new type stores references outside plain objects/arrays (e.g. `Map` keys), deleting that resource is not blocked even if it is in use.
- **Creation of a new component type** (`ui/componentTypeModal.js` + `createDefaultComponent`/`DEFAULT_*_PROPERTIES` of `ui/componentModal.js`): the list of available types and default values (initial size, `bloqueado`, starting `properties`) are hardcoded there. A new type does not appear in the creation selector nor has default values if not added in both places.
- **Rendering on the table** (`ui/componentRenderer.js`): each type needs its own drawing branch inside `renderComponentsOnTable`. It must respect cross-cutting rules: overflow of clipped content in an inner container (never the outer one, because of the `identifyMode: 'label'` label and the state badges — see `05-ui-layer.md`), drawing order by `order` (visual z-index), support for `onSelect`/`onToggleSelect`/`onMove`/`onResize` if applicable.
- **Resize with proportion constraint** (`ui/resizeHandle.js`, `clamp` parameter): types that force a fixed proportion (`'dado'` with 1:1, `'carta'` with `getProporcionRatio`) pass their own `clamp`. A new type with that need replicates the pattern — `resizeHandle.js` does not do it on its own.
- **`getComponentsBounds`** (`ui/componentRenderer.js`): uses the same defaults as rendering (`x`/`y`/`width`/`height` minimums) for the "Ajustar zoom" bounding box. If a new type changes those default-size criteria, the function may fall out of sync with the real rendering.
- **Default resources and their seeding** (`data/defaultResources.js`, `main.js`): a new resource type (beyond `'imagen'`/`'tipografia'`) or a new file extension requires reviewing `resourceTypeForFileName` (`core/resource.js`).
- **Style guide** (`design/docs/style/03-modales-menus.md` and others): review already-catalogued exceptions (bevel of `'tableroSimple'`/`'dado'`, `border-radius` of "highlighted containers" reused by `'carta'`) before introducing a new exception.
- **Context menu, lock badge, hidden indicator** (`ui/componentRenderer.js`): a new type using `renderComponentsOnTable` automatically gets a `contextmenu` listener (`onContextMenu`), lock badge (`showLockIndicator`) and "Oculto" badge (`showHiddenIndicator`) with nothing type-specific. "Nothing type-specific" applies to the **logic** of when each badge is painted; a type with no fill box of its own (like `'texto'`, `.text-box`) also needs to respect the inner-container pattern (`05-ui-layer.md`) so the outer badges are neither clipped nor detached from the content, and it anchors its badges with its own offsets (`.text-box > .component-*-badge`). Review only if the new type needs a **specific** context-menu action — it is passed via `specificItems` of `openContextMenu` from the mode that invokes it, not from `componentRenderer.js`.
- **Test files** (`src/test/*.json`): not updated automatically. Add an example of the new type already configured.

## Sibling files

| File | Covers |
|---|---|
| `01-component-model.md` | Generic component model (fields, table), `order` logic, linked copies (`copyOf`) |
| `02-component-types.md` | The eight implemented component types and their type-specific properties |
| `03-groups-resources.md` | Tag model, resource/gallery model, `'ficha'` migration, style clipboard |
| `04-modes.md` | Play mode vs edit mode: panels, selection, context menus, indicators, z-index, editable title |
| `05-ui-layer.md` | UI-layer modules reused across modes |
| `06-persistence-build.md` | Development/build flow and persistence/file save |
