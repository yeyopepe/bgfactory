# fix/10 — before-entry

Project-specific steps `pv-fix` runs on the **fast-track branch** (trivial change, bug or not), right after `description.md`/`history.md` are created and before the change is applied to code. It's the fast-track's own barrier — distinct from the `do/10-before-implementation` / `do/20-after-implementation` hooks the fast-track also runs (those are `pv-do`'s, shared because the fast-track edits code the same way `pv-do` does). This one exists because a trivial change skips `plan.md` and `pv-how` entirely, so it's the only insertion point a project has before a fast-tracked edit lands. LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/fix/10-before-entry.md` — created only if absent, never overwritten, so steps you add here survive a framework update.


### Step 1: Verificar cobertura de test del bug

**Command(s) to run**

Solo para fixes de bug (no aplica si `description.md` documenta un cambio trivial que no es un bug). Con la causa raíz ya identificada en `description.md`, revisar si existe un test que reproduzca el caso incorrecto (busca en la suite de tests del área/módulo afectado por la causa raíz).

Si ya existe un test que cubre ese caso y actualmente falla (reproduce el bug), continuar sin más acción.

Si no existe ningún test que cubra el caso, escribir uno nuevo que ejercite exactamente el comportamiento incorrecto descrito como causa raíz, con el resultado correcto esperado como aserción. Ejecutarlo y confirmar que falla (si no falla, el test no está capturando la causa raíz — corregirlo antes de continuar).

**Generated file(s)**

El test nuevo o localizado, y confirmación de que falla en este punto (antes de aplicar el fix). Si se escribió un test nuevo, añadirlo a `description.md` (ruta del test).

**Notes**

El objetivo es que al terminar el fix (tras `FT2` en el flujo), volver a ejecutar ese mismo test debe pasar — es la verificación de que el bug quedó realmente arreglado. No relajar la aserción para que pase artificialmente.

