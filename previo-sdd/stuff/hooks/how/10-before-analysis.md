# how/10 — before-analysis

Project-specific steps `pv-how` runs **at the start of step 3 (analyze and write `plan.md`)**, before it invokes `pv-internal-tech-analysis` to gather technical context. Runs on a re-analysis too (step 2 → "re-analyze"); it does **not** run when the user chooses "implement the current `plan.md`" (step 2 → jump to 3.1), since that path does no analysis. LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/how/10-before-analysis.md` — created only if absent, never overwritten, so steps you add here survive a framework update.



### Step 1: Identificar los tests funcionales afectados

**Command(s) to run**

Ninguno (paso de análisis). Se hace junto al resto del análisis técnico, antes o durante la redacción de `plan.md`.

**Notes**

- Regla de cobertura por cambio: todo cambio que **añada** funcionalidad requiere tests funcionales nuevos (`src/test/functional/*.test.js`, con `registerFeature` y códigos `FT-<NNN>-<nn>`); todo cambio que **modifique** funcionalidad requiere actualizar los tests existentes que la cubren; todo cambio que **elimine** funcionalidad requiere borrar los tests que la validaban (y sus fixtures si procede). Formato y convenciones de los tests: `previo-sdd/design/docs/architecture/011-functional-test-framework.md`.
- Como parte del análisis, identifica qué ficheros de `src/test/functional/` están afectados (existentes a actualizar/borrar) y qué casos nuevos harán falta (existentes o a crear), y refleja esa lista en `plan.md` sección (b) como checklist items propios (`- [ ]`), antes de las tareas de implementación que cubren.
- Esto aplica siempre, con independencia del riesgo calculado en el paso 3.1 — no confundir con `how/20-after-plan.md` Step 1, que solo añade tests *adicionales* cuando el riesgo persistido es ≥ 4 para reducirlo. Este step cubre la cobertura mínima obligatoria; aquel cubre cobertura extra en cambios de alto riesgo.

<!-- Add one "### Step N: {name}" block per step, in run order. Delete this comment when you add the first. -->

<!--
### Step 1: {name}

**Command(s) to run**

[Exact command(s), in order, from the repo root.]

**Generated file(s)**

[What the step produces and how to verify it — a path, a log line, an exit code. Omit if the step only checks a precondition.]

**Notes**

[Prerequisites, side effects, what not to touch. Optional.]
-->
