# do/10 — before-start

Project-specific steps `pv-do` runs **before it starts implementing** (at the top of step 2, before any code is edited). LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/do/10-before-start.md` — created only if absent, never overwritten, so steps you add here survive a framework update.



### Step 1: Run the test coverage planned in `plan.md`

**Command(s) to run**

None (a scope-verification step, not an execution one). Applies while implementing `2.1`'s code, before considering it done.

**Notes**

- `pv-how` (hook `how/10-before-analysis.md`, Step 1) already identifies during the analysis which functional tests need to be added/updated/deleted, and leaves them as checklist items in `plan.md` section (b), before the implementation tasks they cover. This step consists of treating them as a mandatory part of that same checklist: they aren't marked complete, and the change isn't considered done, while any remain pending.
- If, while implementing, the need for a test not anticipated in `plan.md` comes up (or a planned one stops making sense), create/adjust it anyway — `plan.md` is the baseline, not the ceiling, of the per-change coverage rule. Test format and conventions: `previo-sdd/design/docs/architecture/011-functional-test-framework.md`.
- The `20-after-implementation` step only verifies that `npm run test:all` passes — that doesn't replace this step, since the suite can pass green without covering the new functionality or without having been updated after a behavior change.
