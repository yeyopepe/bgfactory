# how/10 — before-analysis

Project-specific steps `pv-how` runs **at the start of step 3 (analyze and write `plan.md`)**, before it invokes `pv-internal-tech-analysis` to gather technical context. Runs on a re-analysis too (step 2 → "re-analyze"); it does **not** run when the user chooses "implement the current `plan.md`" (step 2 → jump to 3.1), since that path does no analysis. LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/how/10-before-analysis.md` — created only if absent, never overwritten, so steps you add here survive a framework update.



### Step 1: Identify the affected functional tests

**Command(s) to run**

None (an analysis step). Done alongside the rest of the technical analysis, before or while drafting `plan.md`.

**Notes**

- Per-change coverage rule: any change that **adds** functionality requires new functional tests (`src/test/functional/*.test.js`, with `registerFeature` and `FT-<NNN>-<nn>` codes); any change that **modifies** functionality requires updating the existing tests that cover it; any change that **removes** functionality requires deleting the tests that validated it (and its fixtures if applicable). Test format and conventions: `previo-sdd/design/docs/architecture/011-functional-test-framework.md`.
- As part of the analysis, identify which files under `src/test/functional/` are affected (existing ones to update/delete) and what new cases will be needed (existing or to create), and reflect that list in `plan.md` section (b) as its own checklist items (`- [ ]`), before the implementation tasks they cover.
- This always applies, regardless of the risk computed in step 3.1 — don't confuse it with `how/20-after-plan.md` Step 1, which only adds *additional* tests when the persisted risk is ≥ 4 to reduce it. This step covers the mandatory minimum coverage; that one covers extra coverage for high-risk changes.
