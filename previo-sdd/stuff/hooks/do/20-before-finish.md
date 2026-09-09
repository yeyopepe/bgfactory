# do/20 — before-finish

Project-specific steps `pv-do` runs **as the last thing before finishing** — after the code is implemented and the synced documentation is updated (end of step 2.1), and before the change/fix folder is moved to `implemented/` (step 3). LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/do/20-before-finish.md` — created only if absent, never overwritten.

Substitutable here: `{workFolder}` and `{xxxx}` (the change/fix folder is still at `{workFolder}/changes/inProgress/{xxxx}/` at this point). No `### Step` blocks below = hook skipped silently. If any step's command fails or its expected output doesn't appear, `pv-do` stops and explains — it doesn't work around it.

### Step 1: Lanzar la batería de tests

**Command(s) to run**

```
npm run test:all
```

**Generated file(s)**

No genera ficheros. Se verifica por el código de salida: `0` = todos los tests pasan. Cualquier otro código, o salida que reporte tests fallidos, cuenta como fallo del step.

**Notes**

- Se ejecuta **siempre** al terminar de implementar cada cambio/fix, tras código + documentación y antes de mover la carpeta a `implemented/`.
- Si los tests **no pasan**, `pv-do` se detiene aquí (no mueve la carpeta) y hay que **revisar el desarrollo**: corregir la implementación —o los tests si el fallo revela que el propio plan/test estaba mal— y volver a lanzar `npm run test:all` hasta que pase en verde. No dar por terminado el cambio con tests en rojo.
- Requiere las dependencias de desarrollo instaladas (`npm install`, Playwright). Si faltan, instálalas antes de reintentar; no es motivo para saltarse el step.
