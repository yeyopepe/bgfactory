# how/20 — after-plan

Project-specific steps `pv-how` runs **after step 3.1 (the risk median is written to `.metadata.json` and verified)** and before step 3.2 (asking whether to implement). The point is after 3.1 on purpose, so a step here can read the already-persisted risk median and publish it where the team consumes it. LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/how/20-after-plan.md` — created only if absent, never overwritten, so steps you add here survive a framework update.



<!-- Add one "### Step N: {name}" block per step, in run order. Delete this comment when you add the first. -->

### Step 1: High-risk review (additional tests and decomposition)

**Command(s) to run**

Skip this step entirely if `.metadata.json`'s just-persisted `risk` is below 4 — continue silently to the next step (or to 3.2 if this is the last one).

If `risk` is 4 or higher, read `plan.md` (sections (b)/(c)/(d)/(e)) and `description.md`, then do both of the following in order:

1. **Additional tests to reduce risk.** Check whether there are tests not yet in the codebase that, written *before* implementation, would validate the implementation afterward and lower the risk (most directly the "Test coverage" factor, but potentially others too — e.g. a contract test also touches "Depth of change"). If you identify any:
   - Add them to `plan.md`'s section (b) as their own checklist items (`- [ ]`), placed before the implementation tasks they validate, clearly marked as tests to write first.
   - Re-invoke `pv-internal-tech-risks` on the updated `plan.md`/`description.md` and overwrite the median via `set-metadata.py --set-risk` (same command as step 3.1), the same way it was first computed. Re-verify the written value.
2. **Decomposition into smaller changes.** Independently of point 1, check whether the change as planned can be split into two or more smaller changes/fixes, each with materially lower individual risk than the current combined one (not merely relocating the same total risk into more entries). If a decomposition like that exists:
   - Don't write anything yet. Propose it to the user: what the current entry (`{xxxx}`) would keep/become, and what each new entry would cover (a short description for each, as it would go in its own `description.md`) — plus each piece's expected risk relative to the original.
   - Ask for explicit confirmation before creating anything.
   - If confirmed: keep working on the current `{xxxx}` entry with its reduced scope (update `description.md` and `plan.md` accordingly, re-run `pv-internal-tech-risks` and persist the new median as in point 1) and invoke `pv-internal-workflow` to create one new `{changesDir}/inProgress/` entry per additional piece, from the descriptions just confirmed with the user (those new entries are left undocumented-technically, i.e. without their own `plan.md`, for a later `pv-how` run — don't plan them here).
   - If the user declines: leave `plan.md`/`.metadata.json` as they are (only point 1's test additions, if any, persist) and continue.

**Generated file(s)**

`plan.md` (section (b) test items, if any were added) and `.metadata.json`'s `risk` field (if recalculated) for the current `{xxxx}`. If decomposition was confirmed: `description.md` (and `plan.md`/`.metadata.json` again) updated for `{xxxx}`, plus one new `{changesDir}/inProgress/{new-xxxx}/description.md` per additional piece.

**Notes**

This step reasons over the plan and talks to the user when proposing a decomposition — it isn't a shell script, `pv-how` carries it out directly. Never create the additional entries without the user's explicit confirmation. Never decompose silently or implement anything here — decomposed entries are planned later, each via its own `pv-how` invocation.
