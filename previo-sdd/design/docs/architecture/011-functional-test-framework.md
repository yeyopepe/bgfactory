# 011 — Functional test framework

**Area**: Testing

Location: `src/test/`. Dev-only. Nothing here enters the deliverable: `src/scripts/build.py` walks imports from `src/main.js` only (`ENTRY_MODULE = 'main.js'`, `visit_module(ENTRY_MODULE)`), and no `src/test/` file is reachable from `src/main.js`. `src/scripts/generate-version.py` unchanged.

## Files and responsibilities

| File | Runtime | Responsibility |
|---|---|---|
| `package.json` (repo root) | — | Dev project descriptor. `"private": true`, `"type": "module"`. `devDependencies.playwright` pinned. Scripts: `test`, `test:setup`, `test:all` (see *Install and run*). Not consumed by `build.py` or the deliverable. |
| `src/test/setup.js` | Node | Orchestrates `npm install` (skipped if `node_modules/playwright/package.json` exists) then `npx playwright install chromium`. Idempotent. |
| `src/test/run.js` | Node | Only file importing Node built-ins and `playwright`. Static HTTP server over `src/` + Chromium headless driver + per-file navigation + summary + screenshot + `generateTraceability` call + exit code. |
| `src/test/runner-page.html` | Browser (headless) | Page loaded per test file. Replicates the 5 containers of `src/index.html` (`#app-title`, `#edit-toolbar`, `#mode-switcher`, `#content`, `#app-version`) + `<script type="application/json" id="initial-state">`. Inline `<script type="module">` reads `?file=`, imports `./harness.js`, dynamic-imports the test file, runs `harness.run()`, publishes results on `window`. Does NOT load `main.js` or `styles/main.css`. |
| `src/test/harness.js` | Browser | Own test engine. No Node/Playwright import. Runs inside the headless page. |
| `src/test/helpers.js` | Browser | State reset, mode mounting, fixture loading, deterministic mocks. Imports from `../core/*`, `../modes/*`, `../ui/editModeToggle.js`. |
| `src/test/traceability.js` | Node | `generateTraceability(featuresDir, features, outPath)`. Invoked by `run.js` after the batch. |
| `src/test/functional/*.test.js` | Browser | One file per feature or feature group. Test cases. |
| `src/test/fixtures/*.json` | data | Games in `buildComponentsExport` format (`{ version, components, resources, tags, componentGroups, appTitle }`), loaded via `loadFixture(...)`. `errantes-componentes.json`, `mazo-repetido.json` = stress fixtures. |
| `src/test/TRACEABILITY.md` | generated | Feature ↔ test map. Regenerated on every `npm test`. `[gotcha]` not hand-editable — overwritten. Versioned; no dates or last-run status inside, so its diff only reflects coverage changes. |
| `src/test/_screenshots/` | generated | Per-file failure screenshot. Git-ignored. |

## Test levels

| Level | Mounts | Asserts on |
|---|---|---|
| state | nothing (imports `core/*`, calls actions directly) | `state.js` getters, emitted events |
| ui | `mountEditMode()` / `mountPlayMode()` (see `helpers.js` contract) | `#content` DOM + state |

Each test picks its level. A test file declares which `design/docs/features/` entry it validates via `registerFeature`.

## Engine contract (`harness.js`)

```
describe(name: string, fn: () => void)
it(name: string, fn: () => void | Promise<void>)          name starts with FT-<NNN>-<nn>
beforeEach(fn) / afterEach(fn)                             root-level or inside a describe; async allowed
expect(actual) -> { toBe, toEqual, toBeTruthy, toBeFalsy, toBeNull,
                    toContain, toHaveLength, toBeGreaterThan, toThrow }
registerFeature({ primary: number, secondary?: number[] = [] })   once per test file
getRegisteredFeature() -> { primary, secondary } | null
run() -> Promise<Array<{ name, status: 'pass' | 'fail', expected?, actual?, error? }>>
```

- `expect` matcher failure throws `Error` with `.expected`, `.actual`, `.isAssertion = true`.
- `toEqual` = deep structural equality (plain objects/arrays).
- `run()` order per `it`: root `beforeEach` -> block `beforeEach` -> body -> block `afterEach` -> root `afterEach`. `afterEach` runs even if the body threw. An `afterEach` throw fails an otherwise-passing case.
- `registerFeature` stores into a module variable; `getRegisteredFeature()` reads it back.

## Helper contract (`helpers.js`)

```
resetState()                     loadComponents/Resources/Tags/Groups([]) + loadPanelState/
                                 ResourcePanelState/TagPanelState({}) + loadAppTitle(DEFAULT_APP_TITLE) +
                                 loadTableText('') + loadResourcesSeeded(false) +
                                 localStorage.removeItem('bgfactory:state' | 'bgfactory:lang')
mountChrome()                    renderModeSwitcher(#mode-switcher) + renderEditToolbar(#edit-toolbar)
                                 [motivación] in production main.js#renderAll mounts these, not renderEditMode/renderPlayMode
mountEditMode() -> HTMLElement    ensureI18n (idempotent) + setMode(EDIT) + mountChrome() + renderEditMode(#content); returns #content
mountPlayMode() -> HTMLElement    same, PLAY
loadFixture(name) -> merged       fetch ./fixtures/<name>.json -> parseImportedComponents -> mergeImportedGame(mode:'overwrite') -> loadComponents/Resources/Tags
mockRandom(seq: number[])         Math.random cycles through seq
captureDownload()                 patches URL.createObjectURL + HTMLAnchorElement.prototype.click; records { filename, _pending: Promise<parsed> }
getLastDownload() -> Promise<{ filename, data }>   [async] Blob.text() is async
injectFileImport(obj, { mode='overwrite', conflictMode='overwrite' })   mergeImportedGame directly, bypasses ui/editModeToggle.js modals
restoreAllMocks()                 restores Math.random, URL.createObjectURL, HTMLAnchorElement.prototype.click
```

## Batch execution flow (`run.js`)

1. Start `node:http` static server over `src/` on `127.0.0.1`, ephemeral port (`listen(0)`). Handler resolves the request path and serves only if it stays within `SRC_DIR` (path-traversal block -> `403`); `Content-Type` by extension; `404` if absent.
2. `import('playwright')` -> `chromium.launch({ headless: true })`. If the import fails: instructions + `exit(2)`.
3. `readdir('src/test/functional')` filtered to `*.test.js`, sorted.
4. Per file: `page.goto('/test/runner-page.html?file=functional/<file>')`; `waitForFunction(window.__BGF_TEST_RESULTS__ !== undefined)`; read `window.__BGF_TEST_RESULTS__` and `window.__BGF_TEST_FEATURES__`.
5. First `fail` of a file -> `page.screenshot()` into `src/test/_screenshots/<file>.png`.
6. Print `Total: N — OK: X — FALLOS: Y`; per failure: `file › name`, `esperado:` / `obtenido:` or `error:`.
7. `generateTraceability(FEATURES_DIR, allFeatures, TRACEABILITY_OUT)`.
8. `browser.close()`, `server.close()`.
9. `process.exit(anyFailure || traceOutcome.hasAnomaly ? 1 : 0)`.

`FEATURES_DIR` = `previo-sdd/design/docs/architecture/../features` resolved from `run.js`.

### Isolation

One page navigation per test **file** (not per case). Navigation re-instantiates the ES module graph: fresh `core/state.js`, `core/eventBus.js` `listeners` `Map` empty — no leak between files. `beforeEach` inside a file only does `resetState()` + `localStorage` clear.

### Page ↔ driver contract

| `window` global | Set by | Read by | Shape |
|---|---|---|---|
| `__BGF_TEST_RESULTS__` | `runner-page.html` after `harness.run()` | `run.js` step 4 | `Array<{ name, status, expected?, actual?, error? }>` |
| `__BGF_TEST_FEATURES__` | `runner-page.html` from `harness.getRegisteredFeature()` | `run.js` step 4 | `{ primary: number, secondary: number[] } \| null` |

## Traceability (`traceability.js`)

`generateTraceability(featuresDir, features, outPath) -> { hasAnomaly: boolean }`

- Parses `<featuresDir>/INDEX.md` lines `- [NNN — Title](NNN-slug.md)` -> `Map<number, "NNN — Title">`. Non-matching lines skipped.
- `features`: `Array<{ file, primary: number, secondary: number[], caseCodes: string[] }>`. `caseCodes` = `FT-\d+-\d+` prefixes extracted by `run.js` from each `it` name.
- Writes `outPath`: `<!-- GENERADO AUTOMÁTICAMENTE ... -->` header, `| Funcionalidad | Tests |` table ordered by number (primary codes, then `<code> (secundaria)`, or `—`), then two sections:
  - "Tests que declaran una funcionalidad inexistente" — any `primary`/`secondary` `NNN` with no `INDEX.md` entry. Non-empty -> `hasAnomaly: true` -> `run.js` exit `1`.
  - "Funcionalidades sin ningún test" — informational only, never sets `hasAnomaly`.

### Test code convention

`FT-<NNN>-<nn>`: `<NNN>` = `design/docs/features/` entry number of the test's `primary` feature, `<nn>` = two-digit sequence within that feature. Carried as the `it` name prefix. `registerFeature({ primary, secondary })` per file supplies the feature link; `run.js`/`traceability.js` associate a file's `it` cases with its `primary`.

- Anomaly `NNN` inexistent = batch failure (`exit 1`). Feature with no test = report line only.
- `design/docs/features/` entries are never edited to record tests — the only test↔feature materialization is `TRACEABILITY.md`.

## External dependencies

- `playwright` — `devDependency`, pinned version. Chromium binary via `npx playwright install chromium`.
- `[gotcha]` Node/npm are test-only. `src/scripts/build.py` and the deliverable do not depend on them. `src/test/` never enters the bundle (`build.py` walks imports from `src/main.js` only).
- `.gitignore` (repo root): `node_modules/`, `/src/test/_screenshots/`.

## Install and run

| Command | Effect |
|---|---|
| `npm run test:setup` | `npm install` (if needed) + `npx playwright install chromium`. Run once, or after cloning. |
| `npm test` | `node src/test/run.js` — the batch. Requires setup done. |
| `npm run test:all` | `test:setup` then the batch, in one command. |

Exit code `0` = all pass and no traceability anomaly; `1` = any failure or any `NNN` inexistent; `2` = `playwright` not installed.

## Decisions

- `test.decision.no-main-js` — the headless page does not load `src/main.js`. `[motivación]` `main.js` bootstrap wires ~18 `eventBus` listeners (`renderAll`/`persistState` on every `*:changed`) and the autosave; per-test explicit mounting (`mountChrome` + `renderEditMode`/`renderPlayMode`) keeps `resetState` deterministic and avoids listener accumulation. A boot/persistence case that genuinely needs the full `main.js` sequence would load it in its own `runner-page` (Playwright reloads per file, so it would not contaminate other files) — not needed by the current batch.
- `test.decision.page-reload-isolation` — isolation is one page navigation per test file. `[motivación]` `eventBus` `listeners` live in a module-level `Map`; a fresh module graph per file zeroes it with no manual `off()` bookkeeping.
- `test.decision.own-engine` — own `describe`/`it`/`expect` engine instead of a third-party runner. `[motivación]` the engine runs inside the browser page with no Node; the project takes no runtime dependency, and a third-party runner would not run in that context unbundled.
- `test.decision.playwright-over-jsdom` — real headless Chromium, not jsdom. `[motivación]` the fragile features (block drag with relative distances, `fitToBounds`, panel resize, card-over-deck overlap, `position: fixed` menu placement, dice/deck canvas) need real layout and canvas; jsdom provides neither.

## Initial batch

| File | Feature | Cases |
|---|---|---|
| `functional/component-crud.test.js` | 002 | `FT-002-01/02/03` (state) |
| `functional/top-controls.test.js` | 039 | `FT-039-01` (state), `FT-039-02` (ui) |
| `functional/fresh-boot.test.js` | 036 | `FT-036-01` (state) |
| `functional/autosave.test.js` | 029 | `FT-029-01/02` (state) |
| `functional/hidden-in-play.test.js` | 016 | `FT-016-01` (ui) |
| `functional/export-import.test.js` | 032 | `FT-032-01` (state) |
| `functional/synced-copies.test.js` | 005 (primary), 022 (secondary) | `FT-005-01` (ui) — worked example |

See also [007 — Development/build flow and persistence](007-persistence-build.md), [008 — Code conventions](008-code-conventions.md).
