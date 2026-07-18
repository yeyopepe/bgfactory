- **Nombre**: Mostrar la versión en el título de la pestaña del navegador
- **Código**: 00022
- **Tipo**: change

## Prompt original del usuario

Quiero que el control d la numeración de la versión se lleve dentro del html principal, que es lo que se debe ver en el titulo de la página después del titulo (<titulo> v.XXXX)
Ese número se debe incrementar en 1 cada vez que se genere una nueva versión con el script build.py o ms-version

## Descripción completa

Cuando se genera una versión del entregable (a través de la skill `ms-version`), el HTML resultante debe mostrar el número de versión también en el título de la pestaña del navegador, con el formato "Errantes v.XXXX" (con punto antes del número). Esto se suma a la versión que ya se muestra hoy al pie de la página; no la sustituye.

En el HTML de desarrollo (el que no ha pasado por el proceso de generación de versión) el título se mantiene tal cual está hoy, sin número de versión.

**Preguntas de alcance resueltas con el usuario:**

- *¿El script de generación de versión debería autoincrementar el número cada vez que se ejecuta, aunque sea fuera de `ms-version`?* No: se mantiene la regla existente del proyecto de que solo la skill `ms-version` puede fijar y generar una nueva versión. El proceso de generación de versión solo lee el número ya fijado y lo muestra en el título; no lo cambia por su cuenta.
- *¿Se elimina la fuente actual del número de versión para que pase a vivir "dentro del html"?* No: la fuente del número de versión sigue siendo la misma que hoy (la que fija `ms-version`); lo que cambia es que ese número, además de mostrarse al pie de página como ya ocurre, se muestra también en el título de la pestaña.
- *Formato del número en el título:* con punto, tal como se pidió — "v.XXXX" (a diferencia del formato sin punto usado en el pie de página, que se mantiene igual).

**Casos límite:** si no hay un número de versión válido fijado, el proceso de generación debe seguir fallando de forma explícita como hace hoy, en vez de generar un título sin versión o con un valor inválido.

**Alcance de datos / quién puede usarlo:** no aplica — es un valor fijado durante la generación del entregable, no hay datos de usuario ni restricciones por modo o rol implicadas.

## Apuntes técnicos

- Fuente del número de versión: `CURRENT_VERSION` en `src/data/version.js`, fijada por la skill `ms-version`.
- Hoy el número de versión solo se muestra en `<footer id="app-version">` (rellenado en `src/main.js` a partir de `CURRENT_VERSION`).
- El título se fija actualmente en dos sitios: `src/index.html` (`<title>Errantes (dev)</title>`, versión de desarrollo) y `src/scripts/build.py` (línea ~179, que lo sustituye por `<title>Errantes</title>` en el HTML generado). Este cambio afecta al reemplazo que hace `build.py`, que deberá inyectar también el número de versión leído de `version.js` (mismo `version_match` que ya usa en la línea ~187 para nombrar el fichero de salida), con formato `v.{version}`.
- Origen: idea apuntada en `changes/todo/vfix1`. Se documenta como `change` (no `fix`): tras el análisis, el mecanismo de `ms-version` como único punto de generación de versión se mantiene sin cambios — no hay ningún comportamiento roto que corregir, solo una mejora de visibilidad del número de versión ya existente.
- **Restricción dura a respetar al implementar:** ningún fichero ni proceso salvo la skill `ms-version` puede escribir/fijar `CURRENT_VERSION` en `src/data/version.js`. Verificado en el análisis de este change: hoy solo `ms-version` (paso 2 de su skill) escribe ese fichero; el resto de puntos que lo referencian (`src/main.js`, `src/core/persistence.js`, `src/core/fileExport.js`, `src/scripts/build.py`) solo lo **leen**. La solución técnica de este change (inyectar la versión en el `<title>` desde `build.py`) debe seguir siendo una lectura, nunca una escritura de `version.js`.
