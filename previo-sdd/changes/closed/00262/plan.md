- **Creation date**: 2026-09-09

## (a) Functional notes

**Out of scope:**
- No se modifica ningún módulo de producción de la app: ni `src/main.js`, ni nada bajo `src/core/`, `src/ui/`, `src/modes/`, `src/data/`. Solo `src/test/**`.
- No se refactoriza ni se amplía la funcionalidad de arranque. Solo se añaden pruebas que la observan.
- No se tocan los tests existentes `fresh-boot.test.js`, `autosave.test.js`, `version-indicator.test.js` — se complementan con ficheros nuevos, no se reescriben. (Excepción menor admitida: si al añadir un caso nuevo a una feature ya cubierta por uno de esos ficheros conviene ponerlo en el mismo fichero para no partir la feature en dos, se hace; la numeración de casos continúa la existente.)
- No se centraliza el literal de URL del repositorio (hoy triplicado). Fuera de alcance, es asunto de 00261.
- El cambio 00261 sigue siendo responsable de sus propias actualizaciones de test cuando mueva el código (adaptar `fresh-boot.test.js` para importar el `seedDefaultResources` real, mover el helper `renderAppVersionInto` a un import de `ui/appVersion.js`, etc.). Este cambio no adelanta ese trabajo.

**Doubts resolved with the user:**
- *¿Se permite tocar la maquinaria de la batería de pruebas (`run.js`, contenedores) para poder cargar `main.js` real, aunque `description.md` diga "solo añade pruebas"?* → Sí. `src/test/**` no es producto entregable (no entra en el bundle: `build.py` recorre imports desde `main.js`). Es la única vía de cubrir de verdad el arranque real y el invariante de orden (escenario 5). La restricción firme es no tocar ningún módulo de la app.
- *¿Reparto de tests a funcionalidades?* → Entre las tres funcionalidades existentes: **036** (contenido de ejemplo al arrancar), **029** (autoguardado en el navegador), **037** (indicador de versión). El vínculo es por fichero de test (`registerFeature`), con `secondary` donde un fichero toque más de una. No se crea funcionalidad nueva.
- *¿Cómo se cubre el escenario 5 (invariante de orden) sin poder inspeccionar variables internas de `main.js`?* → Observando el efecto externo: tras el arranque real con un guardado del usuario que NO trae `resourcesSeeded`, el `localStorage` reescrito por el autoguardado síncrono debe contener `resourcesSeeded: false` de forma consistente con el guardado original (no debe haberse sembrado ni marcado), y `getResourcesSeeded()` debe ser `false`. Si el orden se rompiera (hidratar `resourcesSeeded` después de `loadComponents`/`loadResources`), el `components:changed`/`resources:changed` que emiten esas cargas dispararía `persistState` con el flag aún en su valor por defecto y el guardado quedaría alterado — el test lo detecta comparando el `resourcesSeeded` del `localStorage` antes y después del arranque.

## (b) Technical solution

### Infra de la batería de pruebas

- [x] **`src/test/runner-page-boot.html` (nuevo) — contenedor de prueba que carga `main.js`.** Copia de `src/test/runner-page.html` con dos diferencias:
  1. Antes del `<script type="module">` que corre el harness, el fichero de test se importa PRIMERO y se le da la oportunidad de preparar el entorno (`localStorage`, `#initial-state`) ANTES de cargar `main.js`. Estructura del `<script type="module">`:
     ```js
     import * as harness from './harness.js';
     const file = new URLSearchParams(location.search).get('file');
     async function main() {
       if (!file) throw new Error('Falta ?file=');
       const mod = await import('./' + file);           // el test exporta setup() y, opcionalmente, run hooks
       if (typeof mod.setupBoot === 'function') await mod.setupBoot();  // prepara localStorage / #initial-state
       await import('../main.js');                        // arranque real, una sola vez
       if (typeof mod.afterBoot === 'function') await mod.afterBoot();  // deja que el test registre sus it() ahora que main.js ya corrió
       const results = await harness.run();
       window.__BGF_TEST_FEATURES__ = harness.getRegisteredFeature();
       window.__BGF_TEST_RESULTS__ = results;
     }
     main().catch((err) => { window.__BGF_TEST_FEATURES__ = harness.getRegisteredFeature(); window.__BGF_TEST_RESULTS__ = [{ name: '(carga del fichero de test)', status: 'fail', error: String(err && err.stack ? err.stack : err) }]; });
     ```
     `pv-do` ajustará el contrato exacto (`setupBoot`/`afterBoot` vs. el test hace todo en el cuerpo del módulo) al implementar el primer fichero; el principio es: **`setup` del entorno → `import('../main.js')` una vez → registro de aserciones → `harness.run()`**.
  2. Ruta de `main.js`: desde `src/test/runner-page-boot.html` es `../main.js` (el servidor de `run.js` sirve todo `src/`).
  - `<title>` y comentario adaptados ("runner de arranque — SÍ carga main.js").

- [x] **`src/test/run.js` — enrutar ciertos ficheros al contenedor de arranque.** Hoy l.128 navega siempre a `runner-page.html?file=functional/<file>`. Cambiar a: si el nombre del fichero termina en `.boot.test.js`, navegar a `runner-page-boot.html?file=functional/<file>`; si no, a `runner-page.html` como hasta ahora.
  ```js
  const runnerPage = file.endsWith('.boot.test.js') ? 'runner-page-boot.html' : 'runner-page.html';
  await page.goto(`${base}/test/${runnerPage}?file=functional/${file}`, { waitUntil: 'load' });
  ```
  Todo lo demás de `run.js` (recogida de `window.__BGF_TEST_RESULTS__`/`__BGF_TEST_FEATURES__`, screenshot, trazabilidad, `caseCodes` con regex `FT-\d+-\d+`) sigue igual — el contrato de `window` es el mismo.
  - El `readdir(...).filter(f => f.endsWith('.test.js'))` ya recoge los `.boot.test.js` sin cambios.

- [x] **`src/test/helpers.js` — helper de preparación de arranque (si hace falta).** Implementado: `seedLocalStorageState(obj)` y `setInitialStateSeed(obj)`, compartidos por los 6 ficheros `.boot.test.js`. Evaluar al implementar si conviene un helper `seedLocalStorageState(obj)` / `setInitialStateSeed(obj)` reutilizable por los ficheros `.boot.test.js` (rellena `localStorage['bgfactory:state']` o el `#initial-state`.textContent con un estado en formato de guardado). Si un solo fichero lo usa, va local en ese fichero (patrón `persist()` de `autosave.test.js`); si lo comparten varios, a `helpers.js`. No añadir a `helpers.js` nada que no se comparta.

### Ficheros de test nuevos

Un fichero `.boot.test.js` por escenario que necesite `main.js` real (para no ejecutar `main.js` más de una vez por página). Los escenarios que se cubren bien a nivel estado van en un fichero `.test.js` normal.

- [x] **`src/test/functional/boot-fresh-session.boot.test.js` (nuevo) — escenario 1.** `registerFeature({ primary: 36 })`. `setupBoot`: `resetState()` + asegurar `bgfactory:state` ausente + `#initial-state` vacío + fijar idioma activo conocido (p. ej. `localStorage['bgfactory:lang'] = 'es'` antes de que `initI18n` corra dentro de `main.js`). Tras el arranque real:
  - `FT-036-06` · la galería tiene exactamente los 2 recursos de ejemplo (`getResources()` → ids `example-image`, `example-font`).
  - `FT-036-07` · el nombre de cada recurso está traducido al idioma activo: `getResources().find(r => r.id === 'example-image').name === t('defaultResource.exampleImage')` y equivalente para `example-font`. (Este es el caso que hoy `fresh-boot.test.js` NO cubre — su copia local siembra sin `name`.)
  - `FT-036-08` · `getResourcesSeeded()` es `true` tras el arranque.
  - `FT-036-09` · no hay `.toast` en el documento (arranque nuevo, sin aviso).

- [x] **`src/test/functional/boot-valid-save.boot.test.js` (nuevo) — escenario 2** (escenario 5 movido a `boot-seed-order.boot.test.js` con `FT-029-13`, ver la nota en (e) sobre por qué el guardado sin clave no lo observa).** `registerFeature({ primary: 29, secondary: [36] })`. `setupBoot`: `resetState()` luego `localStorage['bgfactory:state'] = JSON.stringify({ version: CURRENT_VERSION, components: [<1-2 piezas>], resources: [<1 recurso propio, id distinto de los de ejemplo>], tags: [<1 etiqueta>], componentGroups: [], appTitle: 'Partida guardada', tableText: 'nota', panelState: { collapsed: true, width: 321 }, resourcePanelState: {...}, tagPanelState: {...} })` — **sin** la clave `resourcesSeeded` (o `false`). Guardar una copia del raw original para comparar. Tras el arranque real:
  - `FT-029-10` · `getComponents()`/`getResources()`/`getTags()` reflejan el guardado; `getAppTitle() === 'Partida guardada'`; `getTableText() === 'nota'`; `getPanelState().collapsed === true` y `.width === 321`.
  - `FT-029-11` · no se han sembrado recursos de ejemplo: `getResources()` no contiene `example-image` ni `example-font`; `getResourcesSeeded()` es `false`.
  - `FT-029-12` · no hay `.toast` (guardado válido).
  - `FT-029-13` · **invariante de orden**: el `localStorage['bgfactory:state']` tras el arranque (reescrito por el autoguardado síncrono que disparan `loadComponents`/`loadResources`) tiene `JSON.parse(...).resourcesSeeded === false` — coincide con el guardado original, no se ha marcado como sembrado por un orden de hidratación incorrecto. (Si `main.js` cargara `resourcesSeeded` después de `loadComponents`/`loadResources`, este valor podría alterarse; el test fija el comportamiento correcto.)
  - `FT-036-10` (secundaria) · con guardado válido, la lógica de siembra NO corre aunque falte la marca — mismo assert que FT-029-11 desde la óptica de la feature 036.

- [x] **`src/test/functional/boot-corrupt-save.boot.test.js` (nuevo) — escenario 3.** `registerFeature({ primary: 29, secondary: [36] })`. Un `it` por variante de guardado no recuperable, pero **una sola carga de `main.js` por fichero** obliga a partirlo: dado que `main.js` corre una vez, este fichero prueba UNA variante (p. ej. JSON ilegible) y se crean dos hermanos análogos si se quieren las otras dos variantes cubiertas de extremo a extremo — o bien se acepta que las variantes "sin components" y "otra versión" ya están cubiertas a nivel `parseState` por `autosave.test.js` FT-029-08 y aquí solo se prueba una de extremo a extremo. **Decisión para `pv-do`**: cubrir la variante "JSON ilegible" end-to-end aquí; anotar en el fichero que las otras dos comparten camino (`parseState` → `{ error: 'corrupt' }` → misma rama) y están cubiertas a nivel unidad. `setupBoot`: `resetState()` + `localStorage['bgfactory:state'] = '{ esto no es json'` + `#initial-state` vacío. Tras el arranque:
  - `FT-029-14` · hay un `.toast` en el documento con el texto de `t('toast.stateRecoverFailedCorrupt')`.
  - `FT-029-15` · la app arrancó desde valores por defecto: `getComponents()` vacío, y (al no haber semilla embebida) `getResourcesSeeded()` es `true` con los 2 recursos de ejemplo sembrados.
  - `FT-036-11` (secundaria) · el fallback de arranque siembra los recursos de ejemplo cuando no hay ni guardado recuperable ni semilla.

- [x] **`src/test/functional/boot-embedded-seed.boot.test.js` (nuevo) — escenario 4.** `registerFeature({ primary: 36, secondary: [29] })`. `setupBoot`: `resetState()` + `bgfactory:state` ausente + `document.getElementById('initial-state').textContent = JSON.stringify({ version: CURRENT_VERSION, components: [<1 pieza>], resources: [<1 recurso propio>], tags: [], componentGroups: [], appTitle: 'Semilla', tableText: '', resourcesSeeded: false })`. Tras el arranque:
  - `FT-036-12` · se recuperó la semilla: `getComponents()` con la pieza de la semilla, `getAppTitle() === 'Semilla'`.
  - `FT-036-13` · NO se sembraron recursos de ejemplo: `getResources()` no contiene `example-image`/`example-font` (aunque la semilla traía `resourcesSeeded: false`).
  - `FT-029-16` (secundaria) · no hay `.toast` (semilla válida, sin aviso).

- [x] **`src/test/functional/boot-group-backfill.boot.test.js` (nuevo) — escenario 6.** `registerFeature({ primary: 29 })`. `setupBoot`: `resetState()` + `localStorage['bgfactory:state'] = JSON.stringify({ version: CURRENT_VERSION, components: [<2 piezas con groupId: 'g1'>, <1 pieza con groupId: 'g2'>], resources: [], tags: [], /* SIN componentGroups */ appTitle: 'BG Factory', tableText: '' })`. Tras el arranque:
  - `FT-029-17` · `getGroups()` tiene una entrada por cada `groupId` distinto presente en las piezas (`g1`, `g2`) — reconstrucción vía `deriveMissingGroups`.
  - `FT-029-18` · las piezas conservan su `groupId` tras el arranque.

- [x] **`src/test/functional/boot-app-version.boot.test.js` (nuevo) — escenario 7.** `registerFeature({ primary: 37 })`. Dos casos requieren estado distinto (con y sin texto libre), pero `main.js` corre una vez por fichero → o dos ficheros, o un fichero que arranca CON texto libre y comprueba también que la estructura base está. **Decisión para `pv-do`**: fichero único, `setupBoot` con un guardado válido que trae `tableText: 'nota de la mesa'`. Tras el arranque:
  - `FT-037-07` · `#app-version` contiene `.app-version__name` con el texto del nombre + versión y `.app-version__repo a` con `href` = URL del repo, `target="_blank"`, `rel="noopener"`, y `textContent === t('appVersion.repoLink')`.
  - `FT-037-08` · con `tableText` no vacío: el primer hijo de `#app-version` es `.app-version__table-text` con el texto exacto, el segundo es un `HR.app-version__separator`, y `.app-version__name`/`.app-version__repo` van detrás (4 hijos en total).
  - `FT-037-09` · el texto libre se pinta como texto plano: si `tableText` contiene `<b>x</b>`, `.app-version__table-text` no tiene un `<b>` hijo y su `textContent` contiene la cadena literal.
  - Caso "sin texto libre" (`FT-037-10`): si se quiere end-to-end, fichero hermano `boot-app-version-plain.boot.test.js` con `tableText: ''`; si no, queda cubierto por `version-indicator.test.js` FT-037-03 a nivel réplica. `pv-do` decide según cueste.

- [x] **Ejecutar `npm test` y regenerar `TRACEABILITY.md`.** `npm test` → `Total: 326 — OK: 326 — FALLOS: 0`; `TRACEABILITY.md` regenerado sin anomalías (sección "funcionalidad inexistente" vacía), con los códigos `FT-036-06..13`, `FT-029-10..18`, `FT-037-07..09`. Queda en el working tree para que el usuario lo commitee (esta skill no commitea sin permiso). Confirmar que todos los ficheros nuevos pasan, que `run.js` enruta correctamente los `.boot.test.js`, y que `src/test/TRACEABILITY.md` se regenera sin anomalías (los `NNN` 36/29/37 existen en `previo-sdd/design/docs/features/INDEX.md`). Commitear el `TRACEABILITY.md` regenerado.

## (c) Architecture changes — APLICADO

Aplicado en `previo-sdd/design/docs/architecture/011-functional-test-framework.md` (fila `runner-page-boot.html`, flujo de `run.js` por sufijo, decisión `test.decision.no-main-js` matizada, nivel `*.boot.test.js` documentado, filas de los 6 ficheros nuevos) y en `00-namespace.md` (`test.boot.rule` nuevo, `test.helpers` con los 2 helpers nuevos, `test.decision.no-main-js` con la excepción).



- **`previo-sdd/design/docs/architecture/011-functional-test-framework.md`** — actualizar:
  - Tabla "Files and responsibilities": añadir fila `src/test/runner-page-boot.html` (Browser headless — réplica de `runner-page.html` que **sí** carga `src/main.js`, para casos de arranque de extremo a extremo).
  - Sección "Batch execution flow (`run.js`)": el paso 4 pasa a elegir contenedor según el sufijo del fichero (`*.boot.test.js` → `runner-page-boot.html`, resto → `runner-page.html`).
  - Sección "Decisions", `test.decision.no-main-js`: matizar — sigue siendo cierto para la batería general, pero ya existe la excepción materializada: los ficheros `*.boot.test.js` cargan `main.js` en `runner-page-boot.html`. Actualizar el texto "not needed by the current batch" → "materializado en los `*.boot.test.js` (cambio 00262)".
  - Sección "Test files": añadir las filas de los ficheros `boot-*.boot.test.js` nuevos con su feature (36/29/37) y nivel (state, arranque real).
  - Añadir una nota sobre la convención de sufijo `.boot.test.js` y la regla "una sola ejecución de `main.js` por fichero → un escenario de arranque por fichero".

## (e) Verification

- [x] `npm test` pasa en su totalidad, incluidos todos los ficheros `boot-*.boot.test.js` nuevos, sin fallos. → `Total: 328 — OK: 328 — FALLOS: 0`.
- [x] `src/test/TRACEABILITY.md` se regenera sin la sección de anomalías ("Tests que declaran una funcionalidad inexistente" → "_Ninguna._"). Las funcionalidades 036, 029 y 037 muestran los nuevos códigos `FT-036-06..13`, `FT-029-10..20`, `FT-037-07..09`.
- [x] Un fichero `*.boot.test.js` se ejecuta en `runner-page-boot.html`: forzado un fallo temporal de `FT-036-08` en `boot-fresh-session.boot.test.js` → `run.js` lo reportó por nombre y generó `_screenshots/boot-fresh-session.boot.test.png`. Revertido y de nuevo en verde.
- [x] Los ficheros de test existentes (`fresh-boot.test.js`, `autosave.test.js`, `version-indicator.test.js`, resto de la batería) siguen pasando sin cambios y se ejecutan en `runner-page.html` (la ruta solo desvía los `*.boot.test.js`). No se ha tocado ninguno.
- [x] **Prueba de que la red detecta una regresión de orden** (revertida): al mover `loadResourcesSeeded(...)` al final de la rama `else if (saved)` de `src/main.js`, `npm test` falla en `FT-029-13` (`boot-seed-order.boot.test.js`). Restaurado `main.js` → `npm test` vuelve a verde.
  - **Desviación respecto al plan**: `FT-029-13` se movió de `boot-valid-save.boot.test.js` a un fichero propio `boot-seed-order.boot.test.js`. Motivo: el invariante SOLO es observable con un guardado que traiga `resourcesSeeded: true`; con la clave ausente (escenario 2) el valor por defecto es `false` y coincide con lo esperado, así que el orden de hidratación no cambia el resultado y la aserción sería un no-op. Además, hidratar `loadResourcesSeeded` solo "después de `loadComponents`/`loadResources`" (pero antes de `loadTags`/`loadGroups`) tampoco basta: el autoguardado de `loadTags`/`loadGroups` lo corrige; hay que moverlo al final. El fichero nuevo usa un guardado con `resourcesSeeded: true` y comprueba que el guardado reescrito lo conserva.
- [x] Escenario nuevo cubierto de extremo a extremo (reporte de `npm test`): nombre de recursos de ejemplo traducido (`FT-036-07`), toast de estado corrupto (`FT-029-14`), no re-siembra con guardado válido (`FT-029-11`), no re-siembra con semilla embebida (`FT-036-13`), backfill de grupos (`FT-029-17`), bloque de versión con texto libre como texto plano (`FT-037-08`/`FT-037-09`). Todos en verde.
- [x] El fichero entregable no se ve afectado: `python src/scripts/build.py` corre con éxito y el bundle generado tiene 0 referencias a `test/`/`runner-page-boot`/`*.boot.test.js` (`build.py` recorre imports desde `main.js`, y nada de `src/test/` es alcanzable). El nombre `index-v00273.html` refleja un bump de `src/data/version.js` ajeno a este cambio (ya presente en el working tree al empezar), no algo introducido aquí.
