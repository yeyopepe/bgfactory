# fix/10 — before-entry

Project-specific steps `pv-fix` runs on the **fast-track branch** (trivial change, bug or not), right after `description.md`/`history.md` are created and before the change is applied to code. It's the fast-track's own barrier — distinct from the `do/10-before-implementation` / `do/20-after-implementation` hooks the fast-track also runs (those are `pv-do`'s, shared because the fast-track edits code the same way `pv-do` does). This one exists because a trivial change skips `plan.md` and `pv-how` entirely, so it's the only insertion point a project has before a fast-tracked edit lands. LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/fix/10-before-entry.md` — created only if absent, never overwritten, so steps you add here survive a framework update.


### Step 1: Verify the bug's test coverage

**Command(s) to run**

Only for bug fixes (doesn't apply if `description.md` documents a trivial change that isn't a bug). With the root cause already identified in `description.md`, check whether a test exists that reproduces the incorrect case (search the test suite of the area/module affected by the root cause).

If a test already covers that case and currently fails (reproduces the bug), continue without further action.

If no test covers the case, write a new one that exercises exactly the incorrect behavior described as the root cause, with the correct expected result as the assertion. Run it and confirm it fails (if it doesn't fail, the test isn't capturing the root cause — fix it before continuing).

**Generated file(s)**

The new or located test, and confirmation that it fails at this point (before applying the fix). If a new test was written, add it to `description.md` (test path).

**Notes**

The goal is that once the fix is done (after `FT2` in the flow), running that same test again must pass — that's the verification that the bug was actually fixed. Don't relax the assertion just to make it pass artificially.

