# new/20 — after-entry

Project-specific steps `pv-new` runs **at the end of step 5 (state the next step)**, after step 4 validated the `design_*` files with the user and before the skill hands off to `pv-how`. It's `pv-new`'s single otherwise-non-customizable exit point. In `todo` mode (`/pv-new todo <code>`) it runs **after** the `todo/` idea is deleted, with the entry already in `inProgress/`. LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/new/20-after-entry.md` — created only if absent, never overwritten, so steps you add here survive a framework update.

