# version/20 — post-build

### Step 1: Run the functional test suite

Before copying the documentation and generating the changelog, run the
project's entire functional test suite (`src/test/functional/*.test.js`)
against the real source code in the repo — the same code that was just
packaged into the deliverable. Always save a report of the result inside the
version folder, and if any test fails, stop the version preparation here.

**Command(s) to run**

From the repo root:

```
npm test
```

Exit code interpretation (documented in
`previo-sdd/design/docs/architecture/011-functional-test-framework.md`):

- `0` — all tests pass and no traceability anomalies.
- `1` — some test fails or there's a traceability anomaly.
- `2` — the headless browser (Playwright/Chromium) isn't installed. In that
  case, run once:

  ```
  npm run test:setup
  ```

  and run `npm test` again. If the second attempt returns `2` again, it's a
  real environment failure: stop the version preparation and tell the user
  the test environment couldn't be set up (showing the output of
  `npm run test:setup` / `npm test`). Don't retry further.

**Generated file(s)**

`previo-sdd/versions/{XXXX}/test-report.md` — report of this specific run.
Always generated, whether there are failures or not. Format (plain text
inside the `.md`, no tables):

```
Version: {XXXX}
Date: {YYYY-MM-DD HH:MM}

Result: Passed                 <- "Failed" if there was any failure
Total: {N} — Passed: {X} — Failed: {Y}
```

The totals are read from the `Total: N — OK: X — FALLOS: Y` line that
`npm test` prints in its final summary. If `Failed` > 0, append:

```

Failed tests:

{failure block copied literally from `npm test`'s output}
```

The failure block is exactly as `npm test` prints it: for each failure, the
line `  ✗ <file> › <case>` followed by `      esperado:` / `      obtenido:`
(or `      error:` if it isn't an assertion failure). Don't reformat.

**Notes**

- This step runs after the deliverable's ZIP is already built and copied to
  `files/` (`pv-version` step 4), and before `copy-docs.py` and the changelog
  (steps 5–6). It's acceptable for the deliverable to already exist even if
  the tests fail.
- **If `npm test` ends with exit code `0`**: continue with `pv-version`'s
  normal flow (copy documentation, changelog, summary). No need to report
  anything special beyond the step having run correctly.
- **If `npm test` ends with exit code `1`** (some test fails): do NOT continue
  with the rest of `pv-version`. `test-report.md` is already saved with the
  failure detail. Tell the user there are failing tests and point them to
  `previo-sdd/versions/{XXXX}/test-report.md` for the detail — **don't dump
  the full failure list into the conversation**. Then explicitly ask whether
  they want to analyze those failures:
  - If they say yes: tell them each failure can be handled as a fix
    (`/pv-fix`) or a change (`/pv-new`) of the project, or simply discussed in
    the conversation; no automatic action is triggered. The version
    preparation stays stopped at this point.
  - If they say no: the version preparation stays stopped, nothing else is
    generated.
- `pv-version` step 4.1 already establishes that a failure in an "In the
  middle" step stops the release; this step relies on that native behavior
  for the stopping cases.