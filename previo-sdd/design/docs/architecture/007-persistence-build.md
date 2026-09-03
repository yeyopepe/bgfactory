# 007 — Development/build flow and persistence

**Area**: Persistence & build

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
- `persistence.serializedFields` (see `00-namespace.md`): `saveState()` serializes `{ version: CURRENT_VERSION, components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, componentGroups, appTitle }` to `localStorage` on any of those changes.
- A save with no `appTitle`, or with an empty/non-string value, is treated as `core/appTitle.js` → `DEFAULT_APP_TITLE`.
- `tags:changed` also triggers a full repaint (`renderAll`), not only autosave.
- A single slot per browser/profile (`localStorage` is not isolated per file under `file://`), with no persistence across browsers/devices.
- On startup, with a valid save in `localStorage` that brings `panelState`/`resourcePanelState`/`tagPanelState`, they are hydrated with `loadPanelState()`/`loadResourcePanelState()`/`loadTagPanelState()` before the first render; if they are not there, each panel uses its default values (expanded, default position/width/height).
- `resources` and `tags`: if they are missing or not an array in the save/seed, `[]` is assumed instead of invalidating the whole state (`resources` also triggers a default-resources backfill; `tags` needs no backfill). `componentGroups` follows the same criterion (`[]` if missing/not an array).
- Row selection (`selectedComponentIds`) is not part of any `panelState`, is never persisted.
- **Backward compatibility**: `parseState`/`parseImportedComponents` read `tags`/`tagPanelState`, with a chained fallback to `groups`/`groupPanelState` and then to the oldest keys `decks`/`deckPanelState` if the previous ones are not present (see `group.persist.decision.key-componentGroups` and the "Backward compatibility" table in `004-groups-resources.md`). `componentGroups` has no such alias — it is a new collection.

### File save

[gotcha] there is no whole-app "Guardar" action any more — `src/ui/editModeToggle.js` (`.edit-toolbar`) only offers "Importar"/"Exportar"; a full-app HTML download (`buildExportHtml`/`downloadHtml`) existed in earlier versions of `core/fileExport.js` but has since been removed (only present today inside `src/_output/versions/index-v*.html`, past build artifacts, not in current `/src`). `core/fileExport.js` now exposes only `downloadJson(filename, data)`, used by the "Exportar" flow below.

### Export/Import with selection (`core/importMerge.js` + `ui/exportSelectionModal.js`/`ui/importSelectionModal.js`/`ui/importConfirmModal.js`/`ui/importReportModal.js` in `ui/editModeToggle.js`)

The lightweight JSON of `core/persistence.js` (`buildComponentsExport(components, resources, tags, componentGroups, appTitle)` / `parseImportedComponents`) has shape `{ version, components, resources, tags, componentGroups, appTitle }` — a selectable subset of components/resources/tags, but always the full `componentGroups`/`appTitle` (no panel state: `panelState`/`resourcePanelState`/`tagPanelState`/`resourcesSeeded` are never included).

**Export**:
1. `openExportSelectionModal` shows a modal with a file-name field (prefilled with `getFullAppTitle(getAppTitle())` + `.json`) plus the three selection blocks (`ui/elementSelectionModal.js`), instead of a native `prompt()`.
2. On confirm, `ui/editModeToggle.js` filters `getComponents()`/`getResources()`/`getTags()` by the checked ids (those functions' signatures unchanged — they receive already-filtered lists; no orphan-reference validation on the exported selection).
3. `buildComponentsExport(...)` builds the JSON, `downloadJson` triggers the download.

**Import**:
1. `parseImportedComponents` reads the file.
2. `openImportSelectionModal` shows the file's elements to choose which to import.
3. On confirm, `openImportConfirmModal` asks for mode (`add`/`overwrite`) and duplicate-id behavior (`overwrite`/`keepBoth`).
4. Before `mergeImportedGame` (see `004-groups-resources.md`), `ui/editModeToggle.js` runs each selected component of type `'ficha'` through `migrateFichaComponent`; if any returns errors, `openImportConversionErrorModal` opens with the list before touching state — "Abortar importación" does not call `mergeImportedGame` or `loadComponents`/`loadResources`/`loadTags` (current game intact); "Continuar sin esas fichas" follows the flow excluding them from `selectedComponents`.
5. With the fichas already migrated (or none to migrate), `core/importMerge.js` (`mergeImportedGame`) computes the final state:

   | Mode | Existing id | Effect |
   |---|---|---|
   | `overwrite` | — | Starts from empty lists, inserts the selection directly (no conflict possible) |
   | `add` | Not present | Merges the selection with the existing by type (components/resources/tags, each with its own id space) |
   | `add` | Present, `conflictMode: 'overwrite'` | Replaces the existing element |
   | `add` | Present, `conflictMode: 'keepBoth'` | Renames the imported one with a `-imported`/`-imported(n)` suffix (`nextImportedId`, analogous to `nextCloneId` but generic per type) — references of imported components to a renamed resource/tag are rewritten to the new id before merging (`etiquetaIds` is a flat top-level property of the component, like `image`, not a key inside `properties`) |

   Already-existing components are not touched in `add` mode.
6. After the merge: a reference of a freshly imported component to a resource absent from the final state is discarded (field to `null`, tolerated like a deleted resource in use); each id absent from `etiquetaIds` (there may be several per component) is processed separately — a tag with that id is auto-created (once per id even if several components reference it), or it is linked to the existing tag with the same name if there is one. Each case generates a report row (`{ componentId, tipoError, solucion, elemento }`); if there is any, `ui/editModeToggle.js` opens `openImportReportModal(report)` on finishing.

The previous functions `getComponentsWithMissingResources` (`core/resource.js`) and `getComponentsWithMissingDeck` (`core/deck.js`) of the earlier import flow (all-or-nothing with `confirm()`) have been removed for being unused — `mergeImportedGame`'s report replaces them with more detail.

### Default resources and backfill (`data/defaultResources.js`, `main.js`)

| State on load | Action |
|---|---|
| Fully new session (nothing saved, no embedded seed, or corrupt/incompatible save) | `seedDefaultResources()` seeds the 2 entries of `DEFAULT_RESOURCES` (see `004-groups-resources.md`), sets `resourcesSeeded = true` (`markResourcesSeeded()`) |
| Valid save or seed (with existing components) but `resourcesSeeded` not `true` (typically a save predating this feature, `resources` empty or nonexistent) | `backfillDefaultResourcesIfNeeded()` seeds them that one time anyway |
| `resourcesSeeded` already `true` | No backfill — if the user deletes the default resources, they do not reappear on later loads |
