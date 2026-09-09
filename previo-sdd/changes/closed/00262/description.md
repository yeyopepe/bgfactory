- **Name**: Red de pruebas del arranque de la aplicación (previa a 00261)
- **Code**: 00262
- **Type**: change
- **Creation date**: 2026-09-09

## Full description

### Qué se pide

Ampliar la batería de pruebas funcionales para cubrir el **camino de arranque de la aplicación**: lo que ocurre desde que se abre la aplicación hasta que queda lista para usar, con su estado recuperado y su interfaz montada. Hoy ese camino no tiene ninguna prueba automática que lo ejercite de principio a fin.

Este cambio es una **mejora deliberada de la batería de pruebas**, no la corrección de un fallo. No cambia ninguna funcionalidad de cara al usuario: la aplicación se comporta exactamente igual antes y después.

### Por qué ahora

Hay otro cambio pendiente (el 00261) que reorganiza internamente el fichero de arranque, moviendo a otros sitios la secuencia de recuperación del estado, la siembra de contenido de ejemplo y la construcción del bloque de nombre y versión. Ese cambio es de puro mantenimiento y no debe alterar ningún comportamiento, pero hoy no hay red automática que lo confirme: si al mover ese código se colara un cambio de orden o de comportamiento, nada lo detectaría hasta que un usuario lo sufriera.

Este cambio construye esa red **antes** de tocar el fichero de arranque. Una vez estas pruebas estén en verde, el cambio 00261 se puede acometer con la seguridad de que, si algo se rompe, las pruebas lo señalan.

### Qué debe quedar cubierto

Pruebas que ejerciten el arranque real y que fallarían si el comportamiento cambiara. En concreto, los cuatro escenarios de arranque y sus invariantes:

1. **Sesión totalmente nueva** — sin nada guardado en el navegador y sin contenido de arranque embebido: se añaden a la galería los dos recursos de ejemplo (una imagen y una tipografía) **con su nombre en el idioma activo**, y la sesión queda marcada como "recursos de ejemplo ya sembrados".
2. **Estado guardado válido** — se recupera todo (piezas, recursos, etiquetas, agrupaciones, título, texto de la mesa, preferencias de los paneles) sin ningún aviso, y **no** se añaden recursos de ejemplo, aunque el guardado no traiga la marca de "ya sembrados".
3. **Estado guardado no recuperable** — ilegible, sin piezas, o de otra versión de la aplicación: aparece el **aviso breve** (una notificación pasajera, no un cuadro de diálogo que haya que cerrar) y la aplicación arranca desde el contenido embebido o desde los valores por defecto.
4. **Contenido de arranque embebido presente** — y sin estado guardado en el navegador: se recupera a partir de ese contenido embebido y **no** se añaden recursos de ejemplo.
5. **Invariante de orden crítico** — al arrancar, la marca de "recursos de ejemplo ya sembrados" debe quedar establecida **antes** de que se carguen las piezas y los recursos. Cargar piezas y recursos dispara un guardado automático inmediato; si la marca aún no estuviera establecida en ese momento, ese guardado escribiría "no sembrado" sobre el guardado del usuario y, en el siguiente arranque, la galería recibiría recursos de ejemplo que no debería. Una de las pruebas debe detectar una regresión de este orden.
6. **Reconstrucción de agrupaciones** — un guardado antiguo que no incluye el registro de agrupaciones pero cuyas piezas ya referencian agrupaciones: al arrancar se reconstruye una entrada de agrupación por cada referencia presente en las piezas.
7. **Bloque de nombre y versión** — al arrancar se construye correctamente en pantalla: el nombre con su número de versión, el enlace al repositorio que abre en una pestaña nueva, y —solo si el usuario ha configurado un texto libre para la mesa— ese texto por encima de las dos líneas fijas, separado por una línea fina y mostrado siempre como texto plano.

### Alcance y límites

- **Este cambio no modifica ningún módulo de código de producción de la aplicación** (ni el fichero de arranque ni ningún módulo bajo la carpeta de código de la app). Solo añade pruebas y toca la **maquinaria de la batería de pruebas**: se decidió (confirmado con el usuario al planificar) que para poder ejercitar el arranque real de extremo a extremo es válido y necesario ampliar el entorno de pruebas — en concreto, permitir que un fichero de prueba se ejecute en una página de arranque propia que sí carga el fichero de arranque de la aplicación. Esa maquinaria (el lanzador de la batería y las páginas contenedoras de prueba) no forma parte del producto entregable ni entra en el fichero final.
- Con esa vía, **todos los escenarios (1 a 7) se cubren en este cambio**, incluido el escenario 1 (nombre de los recursos de ejemplo traducido al idioma activo) y el escenario 5 (invariante de orden de hidratación), que solo son verificables ejecutando el arranque real.
- **Orden de ejecución previsto:** este cambio se implementa y se cierra **antes** que el 00261.
- **Relación:** este cambio es la red de seguridad previa del cambio 00261. Ambos quedan relacionados entre sí.
- **Regla de cobertura del proyecto:** toda prueba nueva se vincula a la funcionalidad que valida y lleva su código de caso. Las funcionalidades ya existentes a las que pueden vincularse estas pruebas son "Contenido de ejemplo al arrancar una partida nueva", "Autoguardado en el navegador" e "Indicador de versión y enlace al repositorio". El reparto exacto de cada prueba por fichero y por funcionalidad (y si alguna encaja mejor como vínculo secundario) se decide al planificar la solución.
- El cambio no se considera completo hasta que la batería de pruebas pasa entera y su informe de trazabilidad se regenera sin anomalías.

## Technical notes

- **Objetivo**: reducir el factor "cobertura de pruebas" del análisis de riesgo del cambio **00261** (hoy 8/10; mediana global 4/10). Causa raíz: el motor de pruebas nunca carga `src/main.js` (`test.decision.no-main-js` en `previo-sdd/design/docs/architecture/011-functional-test-framework.md`), así que la secuencia de arranque real (`loadState` → rama corrupto + `showToast` → hidratación en orden de ~10 sub-estados → `deriveMissingGroups` → `seedDefaultResources` → `syncFontFaces` inicial) no tiene red automática.

- **Estado actual de la cobertura cercana** (a no duplicar, sí a extender):
  - `src/test/functional/fresh-boot.test.js` (feature 036, nivel estado): helper local `seedDefaultResources()` que siembra `DEFAULT_RESOURCES` **sin** traducir el nombre (`createResource({ ...data })`, sin `name`). Cubre siembra, ids fijos, edición/borrado, y la guarda `getResourcesSeeded()`.
  - `src/test/functional/autosave.test.js` (feature 029, nivel estado): helper local `persist()` que replica el `saveState(...)` de `main.js`; casos de `loadState()` válido / no restaurable (`{ error: 'corrupt' }` para JSON ilegible, sin `components`, y versión distinta) / inexistente (`null`); guardado sin `panelState`/`tags` no invalida.
  - `src/test/functional/version-indicator.test.js` (feature 037, state + 1 ui): helper local `renderAppVersionInto(el)` que replica el DOM de `main.js#renderAppVersion` (no exportada). Cubre `.app-version__name`/`.app-version__repo a` (`target=_blank`/`rel=noopener`), y `.app-version__table-text` + `.app-version__separator` por encima solo con texto libre no vacío, como texto plano.

- **Vía de implementación decidida (confirmada con el usuario)**: ampliar la maquinaria de la batería de pruebas para poder cargar `src/main.js` en un contenedor de prueba propio. `test.decision.no-main-js` ya lo contempla: *"A boot/persistence case that genuinely needs the full main.js sequence would load it in its own runner-page (Playwright reloads per file, so it would not contaminate other files) — not needed by the current batch."* Este cambio hace que sí sea necesario.
  - **Restricción firme**: NO se toca ningún módulo bajo `src/` que forme parte de la app (ni `main.js`, ni `core/*`, `ui/*`, `modes/*`, `data/*`). Solo `src/test/*` (lanzador, contenedores de prueba, helpers, ficheros de test).
  - `src/test/run.js` (l.128) navega hoy SIEMPRE a `runner-page.html?file=functional/<file>`, hardcodeado. Hay que darle una vía para que un fichero de test pida un contenedor alternativo. Opciones para `pv-how` a concretar en el plan: (a) convención de nombre — un `*.boot.test.js` se sirve con `runner-page-boot.html`; (b) un mapa/lista explícita en `run.js`; (c) un fichero de test que haga `import('../main.js')` dinámico él mismo tras preparar `localStorage`/`#initial-state`, reutilizando `runner-page.html` tal cual (evita tocar `run.js`, pero el import dinámico de `main.js` desde `src/test/functional/` necesita ruta `../../main.js` y que el servidor estático lo sirva — lo sirve, `run.js` sirve todo `src/`). La opción (c) es la de menor superficie; evaluar si el orden de efectos de `main.js` (splash/i18n/listeners al importar) es controlable con `import()` dinámico tras preparar el entorno.
  - `src/test/runner-page.html` ya replica los 5 contenedores de `index.html` + `<script type="application/json" id="initial-state">` vacío. Un `runner-page-boot.html` sería ese mismo HTML + la carga de `main.js`; si se va por la opción (c), no hace falta HTML nuevo.
  - `main.js` NO es idempotente (monta splash, registra ~18 listeners del eventBus, el autoguardado — todo como efecto de su ejecución). Por el aislamiento por navegación (una página por fichero de test, `test.decision.page-reload-isolation`) eso no contamina otros ficheros, pero dentro del propio fichero de arranque solo debe ejecutarse `main.js` una vez; los distintos escenarios (1–7) que necesiten `main.js` real deben ir en ficheros de test separados, uno por escenario, o preparar el entorno y hacer el `import()` una sola vez por fichero con varios `expect` sobre el resultado.

- **Preparación de `localStorage` / semilla por escenario**:
  - Escenario 1 (sesión nueva): `resetState()` ya deja `bgfactory:state` y `bgfactory:lang` fuera y `resourcesSeeded=false`; `#initial-state` vacío.
  - Escenario 2 (guardado válido): `localStorage.setItem('bgfactory:state', JSON.stringify({ version: CURRENT_VERSION, components:[...], resources:[...], tags:[...], componentGroups:[...], appTitle, tableText, panelState, resourcePanelState, tagPanelState /* sin resourcesSeeded, o false */ }))`.
  - Escenario 3 (no recuperable): `bgfactory:state` = `'{ no es json'`, o `{ version: 999999, components: [] }`, o `{ version: CURRENT_VERSION }` (sin `components`).
  - Escenario 4 (semilla embebida): `#initial-state`.textContent = un estado válido en formato guardado; `bgfactory:state` ausente.
  - Escenario 6 (backfill grupos): `bgfactory:state` con `components` que traen `groupId` y **sin** `componentGroups`; comprobar que tras arrancar `getGroups()` tiene una entrada por cada `groupId` distinto (`deriveMissingGroups`, `core/group.js`).

- **Aviso de estado no recuperable**: `showToast(t('toast.stateRecoverFailedCorrupt'))` (`ui/toast.js`), NO `showErrorModal` (`ui/errorModal.js`). Gotcha en `007-persistence-build.md`: *"startup never calls showErrorModal"*. Comprobar presencia de `.toast` en escenario 3 y ausencia en escenarios 1/2/4 (patrón de `error-modal.test.js`, que asevera "no `.toast`").

- **Módulos de producción implicados** (solo lectura para diseñar las pruebas; ninguno se modifica): `core/persistence.js` (`loadState`/`readSeedState`/`parseState`), `core/state.js` (todos los `load*`/`get*`/`markResourcesSeeded`), `core/group.js` (`deriveMissingGroups`), `ui/fontFaceRegistry.js` (`syncFontFaces`), `ui/toast.js` (`showToast`), `data/defaultResources.js` (`DEFAULT_RESOURCES`), `data/version.js` (`CURRENT_VERSION`).

- **Aislamiento**: una navegación de página por fichero de test (`test.decision.page-reload-isolation`); el grafo de módulos se reinstancia por fichero, así que un fichero que cargue `main.js` no contamina a los demás. `beforeEach` = `resetState()` + limpieza de `localStorage`. Ojo con estado de módulo que `resetState()` NO limpia (documentado por fichero en `011-functional-test-framework.md`): `editMode.js#selectedComponentIds`, `table.js` cámara, filtros de paneles — poco relevante para arranque, pero tenerlo presente si algún escenario monta un modo.

- **Motor de pruebas** (`src/test/harness.js`, dentro de la página headless, sin Node): `describe`/`it` (nombre con prefijo `FT-<NNN>-<nn>`), `beforeEach`/`afterEach` (async permitido), `expect` con `toBe`/`toEqual`/`toBeTruthy`/`toBeFalsy`/`toBeNull`/`toContain`/`toHaveLength`/`toBeGreaterThan`/`toThrow`, `registerFeature({ primary, secondary })` una vez por fichero.

- **Trazabilidad**: `npm test` regenera `src/test/TRACEABILITY.md`; un `NNN` de `registerFeature` sin entrada en `previo-sdd/design/docs/features/INDEX.md` es anomalía y hace fallar el lote (`exit 1`). Las 3 features candidatas (036, 029, 037) existen en el índice.

- No se detectó ninguna inconsistencia entre documentación y código durante el análisis.

- Seguridad: `pv-internal-tech-security` no reporta ninguna categoría aplicable (código de prueba; sin entrada de usuario nueva, secretos, transporte ni API).
