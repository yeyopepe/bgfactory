- **Creation date**: 2026-09-15

## (a) Functional notes

**Out of scope:** no other button, mode transition, or app-title behavior (title editing, pencil icon, version display) is touched. No changes to data, persistence, or roles.

**Doubts resolved with the user:** none beyond what's already recorded in `description.md` (mockup validation rounds: indicator size raised twice, from a small/muted badge to `--text-md` in accent blue; a subtle diagonal-stripe texture added to the edit-mode header background; buttons corrected to match the real markup — icon+text only on the edit→play button, plain text on the play→edit one).

## (b) Technical solution

- [x] **`src/test/functional/app-title.test.js` — add functional test cases for the new mode indicator (FT-030-10 to FT-030-13).** Per the project's mandatory per-change test coverage rule (this change adds new visible behavior to feature 030, "Título de cabecera editable"), add to this existing file (continuing from `FT-030-09`, same `registerFeature({ primary: 30 })`, no new file/feature number needed):
  - `FT-030-10`: `mountEditMode()` + `mountAppTitle()` (hoverable sub-state, not editing) → a `.app-title__mode-indicator` element exists inside `#app-title`, with `textContent === t('toolbar.modeEdit')`.
  - `FT-030-11`: same mount, then click the title to enter the inline-edit sub-state → `.app-title__mode-indicator` is still present (the indicator's visibility is scoped to edit mode as a whole, not to the hoverable/editing sub-state).
  - `FT-030-12`: `mountPlayMode()` + `mountAppTitle()` → `document.getElementById('app-title').querySelector('.app-title__mode-indicator')` is `null`.
  - `FT-030-13`: mount in edit mode (indicator present), call `setMode(MODES.PLAY)` then re-run `renderAppTitle` (same pattern existing tests already use to check mode transitions) → the indicator node is gone (no residual node), covering the "disappears completely" scope point from `description.md`.
- [x] **`src/ui/appTitle.js` — restructure `h1#app-title`'s content into a title+indicator column wrapper, and render the new indicator.** `renderAppTitle(h1)` fully owns `h1`'s content every call (`h1.innerHTML = ''`), so the new element is created here, not appended externally:
  - Introduce a small local helper, e.g. `renderModeIndicator(container)`, that appends a `<span class="app-title__mode-indicator">` with `textContent = t('toolbar.modeEdit')` to `container` (import `t` from `../core/i18n.js`, not currently imported in this file).
  - In the `MODES.EDIT` branch of `renderAppTitle` (both the `editing` and hoverable sub-branches), wrap the existing title content (what `renderHoverable`/`renderEditing` build today) together with the new indicator in an inner column wrapper, e.g. `<div class="app-title__block">`, containing a `<div class="app-title__row">` (the existing title row: text/input/pencil/version, unchanged internally) followed by the mode-indicator span. Concretely: `renderAppTitle` creates the `.app-title__block` and its `.app-title__row` child, passes the `.app-title__row` element (not `h1` itself) to `renderHoverable`/`renderEditing`, then appends the indicator span after it.
  - The `mode !== MODES.EDIT` branch (early `return` with `h1.textContent = ...`) stays untouched — no wrapper, no indicator, exactly as today. This alone guarantees the indicator never appears in play mode and never leaves a residual node (item covered by FT-030-12/13 above).
  - `renderHoverable`/`renderEditing` keep setting their own `className` (`app-title--hoverable` / `app-title--editing`) on the element they receive — now the inner `.app-title__row` instead of `h1` — so their existing hover/pencil/input CSS selectors keep working unchanged once the corresponding CSS is re-scoped (see next task).
- [x] **`src/styles/main.css` — re-scope the existing `h1`/`.app-title--*` rules to the new wrapper, add `.app-title__block`/`.app-title__mode-indicator`, and add the edit-mode header texture.**
  - Change `h1`'s fixed `height: 3.5rem` to accommodate two lines only in edit mode — simplest approach consistent with the rest of the file's token usage: keep `h1` as `display: flex; align-items: center;` (unchanged, still valid for play mode's single text line and for centering the new two-line block vertically), but drop the fixed `height` in favor of a `min-height: 3.5rem` so it naturally grows when the `.app-title__block` column (title row + indicator) needs more vertical space in edit mode, without a separate edit-mode-only override.
  - `.app-title--hoverable`/`.app-title--editing`/`.app-title__pencil`/`.app-title__input`/`.app-title__version` rules are unchanged as-is (they still target the same class names, now living on the inner `.app-title__row` instead of directly on `h1` — no selector rewrite needed since none of them qualify by parent).
  - Add:
    ```css
    .app-title__block {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      line-height: 1.2;
      min-width: 0;
    }

    .app-title__row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .app-title__mode-indicator {
      font-size: var(--text-md);
      font-weight: 600;
      color: var(--accent-blue);
      letter-spacing: 0.02em;
      line-height: 1;
    }
    ```
    (validated mockup values: `--text-md` = 18px, `--accent-blue` = `#2c7dd8` — reusing existing tokens, no new ones needed.)
  - Add a new modifier class for the edit-mode header texture, gated by JS (CSS alone can't detect edit mode without a class on `h1`):
    ```css
    h1.app-title-bar--edit {
      background-image:
        repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0px, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 8px),
        linear-gradient(180deg, var(--gray-800), var(--bg-toolbar));
    }
    ```
    This overrides `h1`'s existing plain `background` only when the modifier class is present (rule specificity: same element, later declaration — keep this rule after the base `h1` rule in the stylesheet, or use `background-image` only as done here so it layers over the base rule's `background` shorthand without needing `!important`).
- [x] **`src/ui/appTitle.js` — toggle the `app-title-bar--edit` modifier class on `h1` from `renderAppTitle`.** Since `h1.className = ''` is already reset unconditionally at the top of `renderAppTitle`, add `h1.classList.add('app-title-bar--edit')` right after that reset, only inside the `MODES.EDIT` branch (both sub-states) — never in the `mode !== MODES.EDIT` branch, so the texture disappears immediately on returning to play mode, consistent with the indicator's own visibility rule.
- [x] **`src/data/i18n.es.js` (line 39) — change `toolbar.modePlay`'s value from `'Modo Juego'` to `'Ir al Modo Juego'`.** Only this key's value changes; `toolbar.modeEdit` (line 38) is untouched.
- [x] **`src/data/i18n.en.js` (line 41) — change `toolbar.modePlay`'s value from `'Play Mode'` to `'Go to Play Mode'`.** Equivalent English copy, same key, `toolbar.modeEdit` (line 40) untouched.

## (e) Verification

- [x] Run the project's functional test suite (`app-title.test.js`, `top-controls.test.js`, and the full suite for regressions) and confirm all cases pass, including the new FT-030-10 to FT-030-13. `npm run test:all` → 402/402 passing, build check OK.
- [x] Load the app in a browser in edit mode: below the game title, a visibly-sized ("Modo Edición"/"Edit Mode" per active language) blue-accented text indicator appears, and the header bar shows a subtle diagonal-stripe texture over its existing dark gradient. Verified visually (screenshot) via a real Chromium session.
- [x] In edit mode, click the title to enter inline rename mode: the indicator stays visible below the input/version row; confirm or cancel the rename and check the indicator is still there afterward. Verified visually: input appears with indicator still below it; confirming via Enter renames the title and the indicator remains.
- [x] In edit mode, the primary mode button reads "Ir al Modo Juego" ("Go to Play Mode" in English) with its existing play icon; clicking it switches to play mode. Verified visually and interactively.
- [x] In play mode: the indicator and the header texture are both completely gone (no residual node/class), the title shows as a single plain line, and the primary mode button reads "Modo Edición" ("Edit Mode") with no icon, unchanged from before this change. Verified visually.
- [x] Switch edit → play → edit a few times and confirm the indicator and texture reliably reappear/disappear each time, with no leftover DOM node or stale class from a previous render. Covered by FT-030-13 (automated) plus manual browser toggling.
