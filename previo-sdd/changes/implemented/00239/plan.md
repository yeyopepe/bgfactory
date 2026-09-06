- **Creation date**: 2026-09-06

## (a) Functional notes

**Out of scope:**

- No se toca el skill instalado `pv-version` ni ningún fichero bajo `.claude/skills/pv-*/`. Todo el cambio vive en `previo-sdd/stuff/custom-version-pipeline.md` (sección "In the middle"), que es el punto de personalización previsto para esto.
- No se dispara ninguna acción automática sobre los tests fallidos (ni crear correcciones, ni cambios). Solo se informa al usuario de que puede analizarlos por las vías ya existentes o comentarlos en la conversación.
- No se modifica `src/test/*` ni `run.js`: la salida de `npm test` se usa tal cual. No se reprocesa ni reformatea.
- No se toca `TRACEABILITY.md` ni su generación: el informe de tests de la versión es un fichero aparte, propio de cada `versions/{XXXX}/`.
- No se añade un script Python nuevo: la lógica (ejecutar, retry de setup, escribir informe, decidir parada) se expresa en la prosa del paso del pipeline, siguiendo el formato ya usado en la sección "At the end".
- Queda fuera cualquier intento de mover el chequeo a un punto anterior a la generación del entregable: se asume (decisión del usuario) que el ZIP del entregable se construye igualmente aunque los tests fallen, porque no existe ningún hook del custom pipeline entre "resolver XXXX" y "generar el entregable".

**Doubts resolved with the user:**

- **¿Dónde engancha el chequeo, si "In the middle" corre después del build y no hay hook entre resolver XXXX y generar el entregable?** → Se engancha en "In the middle" y se acepta que el ZIP del entregable ya esté construido cuando el chequeo corre. Si los tests fallan, el proceso se detiene igualmente antes de `copy-docs.py` y el changelog (pasos 5–6 de `pv-version`), y esa carpeta de versión no se publica. El informe se guarda directo en `versions/{XXXX}/`.
- **¿Cómo se expresa en el formato `### Step N` un paso interactivo/bloqueante con pregunta al usuario?** → El formato `### Step N: {name}` con `**Command(s) to run**` / `**Generated file(s)**` / `**Notes**` se mantiene; la lógica condicional ("si falla, detener, informar, preguntar") se describe en `**Notes**`. `pv-version` paso 4.1 ya dice explícitamente "si un paso falla, **detente y explícaselo al usuario** — no improvises una alternativa", así que un `exit != 0` de este paso detiene el flujo de forma nativa; el texto de `**Notes**` solo precisa qué mensaje mostrar y qué preguntar.
- **Nombre y ubicación del fichero de informe** → `previo-sdd/versions/{XXXX}/test-report.md`, en la raíz de la carpeta de la versión (junto a `changelog.md`), no en una subcarpeta.

## (b) Technical solution

- [x] **`previo-sdd/stuff/custom-version-pipeline.md` — añadir un `### Step 1` en la sección `## In the middle`.** Hoy esa sección está vacía. Insertar bajo la cabecera `## In the middle` (y antes de `## At the end`) un bloque con este contenido, respetando el formato `### Step N: {name}` + `**Command(s) to run**` / `**Generated file(s)**` / `**Notes**` que ya usa la sección "At the end":

  ```markdown
  ### Step 1: Ejecutar la batería de tests funcionales

  Antes de copiar la documentación y generar el changelog, ejecutar toda la
  batería de tests funcionales del proyecto (`src/test/functional/*.test.js`)
  contra el código fuente real del repo — el mismo que se acaba de empaquetar en
  el entregable. Guardar siempre un informe del resultado dentro de la carpeta de
  la versión y, si algún test falla, detener aquí la preparación de la versión.

  **Command(s) to run**

  Desde la raíz del repo:

  ```
  npm test
  ```

  Interpretación del código de salida (documentado en
  `previo-sdd/design/docs/architecture/011-functional-test-framework.md`):

  - `0` — todos los tests pasan y sin anomalías de trazabilidad.
  - `1` — algún test falla o hay una anomalía de trazabilidad.
  - `2` — el navegador headless (Playwright/Chromium) no está instalado. En ese
    caso, ejecutar una sola vez:

    ```
    npm run test:setup
    ```

    y volver a ejecutar `npm test`. Si el segundo intento vuelve a dar `2`, es un
    fallo real de entorno: detener la preparación de la versión e informar al
    usuario de que no se ha podido preparar el entorno de tests (mostrando la
    salida de `npm run test:setup` / `npm test`). No reintentar más veces.

  **Generated file(s)**

  `previo-sdd/versions/{XXXX}/test-report.md` — informe de esta ejecución
  concreta. Se genera SIEMPRE, haya o no fallos. Formato (texto plano dentro del
  `.md`, sin tablas):

  ```
  Versión: {XXXX}
  Fecha: {YYYY-MM-DD HH:MM}

  Resultado: Correcto            <- "Con fallos" si hubo algún fallo
  Total: {N} — Correctos: {X} — Fallidos: {Y}
  ```

  Los totales se leen de la línea `Total: N — OK: X — FALLOS: Y` que imprime
  `npm test` en su resumen final. Si `Fallidos` > 0, añadir a continuación:

  ```

  Tests fallidos:

  {bloque de fallos copiado literalmente de la salida de `npm test`}
  ```

  El bloque de fallos es tal cual lo imprime `npm test`: por cada fallo, la línea
  `  ✗ <fichero> › <caso>` seguida de `      esperado:` / `      obtenido:` (o
  `      error:` si no es un fallo de aserción). No reformatear.

  **Notes**

  - Este paso corre después de que el ZIP del entregable ya está construido y
    copiado a `files/` (paso 4 de `pv-version`), y antes de `copy-docs.py` y del
    changelog (pasos 5–6). Se acepta que el entregable ya exista aunque los tests
    fallen.
  - **Si `npm test` termina con código `0`**: continuar con el flujo normal de
    `pv-version` (copiar documentación, changelog, resumen). No hace falta
    informar nada especial salvo que el paso se ejecutó correctamente.
  - **Si `npm test` termina con código `1`** (algún test falla): NO continuar con
    el resto de `pv-version`. El `test-report.md` ya queda guardado con el detalle
    de los fallos. Informar al usuario de que hay tests fallidos e indicarle la
    ruta `previo-sdd/versions/{XXXX}/test-report.md` para consultar el detalle —
    **no volcar la lista completa de fallos en la conversación**. A continuación
    preguntarle explícitamente si quiere analizar esos fallos:
    - Si responde que sí: indicarle que cada fallo puede tratarse como una
      corrección (`/pv-fix`) o un cambio (`/pv-new`) del proyecto, o simplemente
      comentarse en la conversación; no se dispara ninguna acción automática. La
      preparación de la versión queda detenida en este punto.
    - Si responde que no: la preparación de la versión queda detenida, sin
      generar nada más.
  - `pv-version` paso 4.1 ya establece que un fallo de un paso de "In the middle"
    detiene la release; este paso se apoya en ese comportamiento nativo para los
    casos de parada.
  ```

- [x] **`previo-sdd/changes/inProgress/00239/description.md` — ya actualizado durante el análisis** (punto de enganche, se acepta el build previo). No requiere más cambios; se lista aquí solo para que `pv-do` no lo vuelva a tocar.

## (c) Architecture changes

Actualizar `previo-sdd/design/docs/architecture/011-functional-test-framework.md`:

- En la sección **"Install and run"** (o en una nota nueva al final del documento), añadir que la batería de tests se ejecuta además automáticamente como paso de la preparación de una versión (`pv-version`, sección "In the middle" de `custom-version-pipeline.md`), que en ese contexto un `exit 2` dispara `npm run test:setup` + un reintento, y que el resultado se archiva en `previo-sdd/versions/{XXXX}/test-report.md` (fichero distinto de `TRACEABILITY.md`, este sí con fecha y resultado de ejecución).
- Mantener explícito el contraste ya presente en el documento: `TRACEABILITY.md` no lleva fecha ni estado de ejecución a propósito; `test-report.md` sí, y por eso es un fichero aparte y propio de cada versión.

## (d) Style changes

No aplica: el cambio no toca el estilo visual del proyecto ni `previo-sdd/design/docs/style/`.

## (e) Verification

- [x] `previo-sdd/stuff/custom-version-pipeline.md` tiene, bajo `## In the middle`, un `### Step 1: Ejecutar la batería de tests funcionales` con sus tres subsecciones `**Command(s) to run**` / `**Generated file(s)**` / `**Notes**`, y la sección `## At the end` sigue intacta con su `### Step 1: Empaquetar el ZIP del entregable`. — Verificado: el fichero tiene ambas secciones con sus Step 1 respectivos.
- [x] Lanzar `/pv-version <XXXX>` en un estado del repo donde `npm test` pasa en verde: el proceso ejecuta `npm test` tras copiar los artefactos a `files/`, crea `previo-sdd/versions/<XXXX>/test-report.md` con `Resultado: Correcto` y los totales, y a continuación continúa con `copy-docs.py`, el changelog y el resumen final con normalidad. — Parcial: se verificó que `npm test` corre y devuelve `exit 0` con el resumen `Total: 66 — OK: 66 — FALLOS: 0` (formato que el Step parsea). El flujo `/pv-version` completo se validará en la próxima preparación de versión real (no se ejecuta aquí para no crear una carpeta `versions/` espuria).
- [ ] Forzar un fallo de test (p. ej. romper temporalmente una aserción en un `*.test.js`) y lanzar `/pv-version <XXXX>`: se crea `previo-sdd/versions/<XXXX>/test-report.md` con `Resultado: Con fallos`, los totales y el bloque `Tests fallidos:` con las líneas `✗ ... › ...` + `esperado:`/`obtenido:`; el proceso se detiene sin ejecutar `copy-docs.py` ni generar `changelog.md`; en la conversación se informa de que hay fallos y se indica la ruta del informe (sin volcar la lista), y se pregunta si se quieren analizar. — Diferido: solo verificable ejecutando una preparación de versión real con un test roto; la prosa del Step lo describe explícitamente.
- [ ] En el escenario de fallo, comprobar que sí puede haberse generado el ZIP del entregable en `files/` (paso previo) pero NO existen los zips de documentación en `previo-sdd/versions/<XXXX>/docs/` ni `changelog.md`. — Diferido: mismo motivo; depende del comportamiento nativo de parada de `pv-version` paso 4.1.
- [ ] Simular entorno sin Playwright (p. ej. renombrar `node_modules/playwright` temporalmente) y lanzar `/pv-version <XXXX>`: el proceso detecta el `exit 2`, ejecuta `npm run test:setup`, reintenta `npm test` una sola vez y, si ya pasa, continúa; el informe refleja la ejecución final. Si el reintento vuelve a fallar con `exit 2`, el proceso se detiene informando de un fallo de entorno de tests. — Diferido: solo verificable manipulando el entorno de Playwright durante una preparación de versión real; la prosa del Step describe el retry único y la parada.
- [x] `previo-sdd/design/docs/architecture/011-functional-test-framework.md` menciona la ejecución automática de tests dentro de `pv-version` y el fichero `test-report.md` por versión, manteniendo el contraste con `TRACEABILITY.md`. — Verificado: nueva sección `## Release pipeline gate` con la tabla del artefacto `test-report.md` y la línea `[gotcha]` que lo contrasta con `TRACEABILITY.md`.
