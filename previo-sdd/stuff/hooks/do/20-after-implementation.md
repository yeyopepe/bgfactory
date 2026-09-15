# do/20 — before-finish

Project-specific steps `pv-do` runs **as the last thing before finishing** — after the code is implemented and the synced documentation is updated (end of step 2.1), and before the change/fix folder is moved to `implemented/` (step 3). LITERAL seed copied by `pv-init`/`pv-update` to `{workFolder}/stuff/hooks/do/20-before-finish.md` — created only if absent, never overwritten.


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
- `0` en el exit code **no basta por sí solo**: confirma también que se cumplió el Step 1 de `10-before-implementation.md` (tests funcionales añadidos/actualizados/borrados según lo que cambió) y que `src/test/TRACEABILITY.md` (regenerado por este mismo `npm run test:all`) no reporta anomalías de "funcionalidad inexistente". Una suite en verde puede no cubrir la funcionalidad nueva si el step anterior se saltó.
- Requiere las dependencias de desarrollo instaladas (`npm install`, Playwright). Si faltan, instálalas antes de reintentar; no es motivo para saltarse el step.
