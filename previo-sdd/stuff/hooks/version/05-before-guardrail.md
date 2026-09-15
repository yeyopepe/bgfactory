# version/05 — before-guardrail

Project-specific steps `pv-version` runs **at the very start**, before step 0.5 (the `implemented/` must be empty guardrail) and before the version code `{XXXX}` is resolved or `versions/{XXXX}/` is created. It's the earliest possible abort point — it can stop the release before even checking `implemented/`. LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/version/05-before-guardrail.md` — created only if absent, never overwritten, so steps you add here survive a framework update.


