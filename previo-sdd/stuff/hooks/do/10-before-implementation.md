# do/10 — before-start

Project-specific steps `pv-do` runs **before it starts implementing** (at the top of step 2, before any code is edited). LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/do/10-before-start.md` — created only if absent, never overwritten, so steps you add here survive a framework update.



### Step 1: Ejecutar la cobertura de tests planificada en `plan.md`

**Command(s) to run**

Ninguno (paso de verificación de alcance, no de ejecución). Aplica al implementar el código de `2.1`, antes de darlo por terminado.

**Notes**

- `pv-how` (hook `how/10-before-analysis.md`, Step 1) ya identifica durante el análisis qué tests funcionales hay que añadir/actualizar/borrar y los deja como checklist items en `plan.md` sección (b), antes de las tareas de implementación que cubren. Este step consiste en tratarlos como parte obligatoria del propio checklist: no se marcan como completos ni se da el cambio por terminado si quedan pendientes.
- Si al implementar surge la necesidad de un test no anticipado en `plan.md` (o uno planificado deja de tener sentido), créalo/ajústalo igualmente — `plan.md` es la base, no el techo, de la regla de cobertura por cambio. Formato y convenciones de los tests: `previo-sdd/design/docs/architecture/011-functional-test-framework.md`.
- El step `20-after-implementation` solo verifica que `npm run test:all` pase — eso no sustituye este step, ya que la suite puede pasar en verde sin cubrir la funcionalidad nueva o sin haberse actualizado tras un cambio de comportamiento.

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
