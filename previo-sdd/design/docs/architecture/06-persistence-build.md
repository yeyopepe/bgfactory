# Development/build flow and persistence

## Development and build

- **Development**: `src/index.html` (not the deliverable) is opened with a local static server (e.g. VSCode's "Live Server" extension) — native ES modules (`<script type="module">`) do not load correctly via `file://`. This file references the `/src` modules directly.
- **Build**: `src/scripts/build.py` walks the `import`/`export` graph from `src/main.js`, transforms each module to a small runtime `require`/`module.exports` system (no bundlers or Node.js, only Python), inserts the result together with the CSS of `src/styles/main.css` inside a copy of `src/index.html`. Result: a single self-contained file written to `src/_output/versions/index-v{NNNN}.html` (`NNNN` = `CURRENT_VERSION` of `src/data/version.js`) — the portable deliverable.

## Persistence and file save

`src/index.html` includes an empty `<script type="application/json" id="initial-state"></script>` that survives the build (copied as-is) and the runtime download (filled before downloading) — the state seed embedded in each copy of the HTML.

```
Startup (main.js):
  loadState() [core/persistence.js, localStorage]
    → valid          → loadComponents(...) + loadResources(...) + backfillDefaultResourcesIfNeeded(...)
    → corrupt/incompatible → showToast(notice) + example component + default resources
    → nothing saved   → readSeedState() [<script id="initial-state">]
                          → has seed → loadComponents(...) + loadResources(...) + backfillDefaultResourcesIfNeeded(...)
                          → no seed  → example component + default resources
```

### Autosave (`core/persistence.js`)

- Subscribed to `components:changed`, `panelState:changed`, `resources:changed`, `resourcePanelState:changed`, `tags:changed`, `tagPanelState:changed`, `appTitle:changed` (`core/eventBus.js`) from `main.js`.
- Serializes `{ version: CURRENT_VERSION, components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, appTitle }` to `localStorage` on any of those changes.
- A save with no `appTitle`, or with an empty/non-string value, is treated as `core/appTitle.js` → `DEFAULT_APP_TITLE`.
- `tags:changed` also triggers a full repaint (`renderAll`), not only autosave.
- A single slot per browser/profile (`localStorage` is not isolated per file under `file://`), with no persistence across browsers/devices.
- On startup, with a valid save in `localStorage` that brings `panelState`/`resourcePanelState`/`tagPanelState`, they are hydrated with `loadPanelState()`/`loadResourcePanelState()`/`loadTagPanelState()` before the first render; if they are not there, each panel uses its default values (expanded, default position/width/height).
- `resources` and `tags`: if they are missing or not an array in the save/seed, `[]` is assumed instead of invalidating the whole state (`resources` also triggers a default-resources backfill; `tags` needs no backfill).
- Row selection (`selectedComponentIds`) is not part of any `panelState`, is never persisted.
- "Guardar a fichero" (`core/fileExport.js`) includes the seven fields: `components`, `panelState`, `resources`, `resourcePanelState`, `resourcesSeeded`, `tags`, `tagPanelState`.
- **Backward compatibility**: `parseState`/`parseImportedComponents` read `tags`/`tagPanelState`, with a chained fallback to `groups`/`groupPanelState` and then to the oldest keys `decks`/`deckPanelState` if the previous ones are not present.

### File save (`core/fileExport.js`, "Guardar" button in `ui/editModeToggle.js`)

- `buildExportHtml(components, resources, panelState, resourcePanelState, resourcesSeeded, tags, tagPanelState, appTitle)` clones `document.documentElement` (CSS/JS already embedded by the build), replaces the content of `#initial-state` with the current state, `downloadHtml()` downloads it as a `Blob`.
- The button asks for a file name, prefilled with the full header title (`getFullAppTitle(getAppTitle())` + `.html`).
- The browser decides, by its configuration, whether or not it replaces a previous file with the same name.

### Export/Import with selection (`core/importMerge.js` + `ui/exportSelectionModal.js`/`ui/importSelectionModal.js`/`ui/importConfirmModal.js`/`ui/importReportModal.js` in `ui/editModeToggle.js`)

Unlike "Guardar" (full app), "Exportar"/"Importar" work with the lightweight JSON of `core/persistence.js` (`buildComponentsExport`/`parseImportedComponents`: `{ version, components, resources, tags }`, no `appTitle` — a partial selection, not "the whole game"), allowing a subset to be chosen.

- **Export**: `openExportSelectionModal` replaces the file-name `prompt()` with a modal with that field (prefilled with the same full title + `.json` that "Guardar" uses with `.html`) plus the three selection blocks (`ui/elementSelectionModal.js`); on confirm, `ui/editModeToggle.js` filters `getComponents()`/`getResources()`/`getTags()` by the checked ids before calling `buildComponentsExport`/`downloadJson` (those functions' signatures unchanged — they receive already-filtered lists). No orphan-reference validation on the exported selection.
- **Import**: after `parseImportedComponents`, `openImportSelectionModal` shows the file's elements to choose which to import; on confirm, `openImportConfirmModal` asks for mode (`add`/`overwrite`) and duplicate-id behavior (`overwrite`/`keepBoth`). Before `mergeImportedGame` (see `03-groups-resources.md`), `ui/editModeToggle.js` runs each selected component of type `'ficha'` through `migrateFichaComponent`; if any returns errors, `openImportConversionErrorModal` opens with the list before touching state — "Abortar importación" does not call `mergeImportedGame` or `loadComponents`/`loadResources`/`loadTags` (current game intact); "Continuar sin esas fichas" follows the flow excluding them from `selectedComponents`. With the fichas already migrated (or none to migrate), `core/importMerge.js` (`mergeImportedGame`) computes the final state:
  - `overwrite` (mode): starts from empty lists, inserts the selection directly (no conflict possible).
  - `add` (mode): merges the selection with the existing by type (components/resources/tags, each with its own id space); on an already-existing id, `conflictMode: 'overwrite'` replaces the existing element, `conflictMode: 'keepBoth'` renames the imported one with a `-imported`/`-imported(n)` suffix (`nextImportedId`, analogous to `nextCloneId` but generic per type) — references of imported components to a renamed resource/tag are rewritten to the new id before merging (`etiquetaIds` is a flat top-level property of the component, like `image`, not a key inside `properties`); already-existing components are not touched.
  - After the merge: a reference of a freshly imported component to a resource absent from the final state is discarded (field to `null`, tolerated like a deleted resource in use); each id absent from `etiquetaIds` (there may be several per component) is processed separately — a tag with that id is auto-created (once per id even if several components reference it), or it is linked to the existing tag with the same name if there is one. Each case generates a report row (`{ componentId, tipoError, solucion, elemento }`); if there is any, `ui/editModeToggle.js` opens `openImportReportModal(report)` on finishing.
  - The previous functions `getComponentsWithMissingResources` (`core/resource.js`) and `getComponentsWithMissingDeck` (`core/deck.js`) of the earlier import flow (all-or-nothing with `confirm()`) have been removed for being unused — `mergeImportedGame`'s report replaces them with more detail.

### Default resources and backfill (`data/defaultResources.js`, `main.js`)

- Fully new session (nothing saved, no embedded seed, or corrupt/incompatible save): the 38 resources of `DEFAULT_RESOURCES` are seeded (`seedDefaultResources()`) — 3 location background images + 35 backpack/objects/events images, embedded as data URIs with a fixed id (file name) instead of a UUID — and `resourcesSeeded = true` is set (`markResourcesSeeded()`).
- A valid save or seed (with existing components) but `resourcesSeeded` not `true` (typically a save predating this feature, `resources` empty or nonexistent): `backfillDefaultResourcesIfNeeded()` seeds them that one time anyway, and from then on they stay as normal resources — if the user deletes them, they do not reappear on later loads (backfill does not repeat once `resourcesSeeded` is `true`).
