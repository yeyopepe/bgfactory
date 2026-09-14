- **Creation date**: 2026-09-14

## (a) Functional notes

**Out of scope:**
- No se toca ningún comportamiento observable. Refactor puro de organización de código.
- No se centraliza el literal de URL del repositorio (`https://github.com/yeyopepe/bgfactory`), hoy triplicado en `ui/settingsModal.js`, `ui/splashScreen.js` y el `renderAppVersion` que se extrae. Solo se traslada la 3ª copia a `ui/appVersion.js` tal cual.
- No se agrupan las suscripciones `on(...)` de `main.js` en una función `wireEventBus()`: se dejan como están (cambio cosmético opcional que no aporta y añade ruido al diff).
- No se renombran símbolos existentes de `core/state.js` ni de ningún otro módulo.
- El comentario de cabecera de `src/test/functional/fresh-boot.test.js` ("Reproduce main.js#seedDefaultResources()") queda desactualizado tras la Etapa 2 (la función real ya no vive en `main.js`) — se actualiza como parte de esa etapa (no se toca la lógica del test, que sigue con su copia local intencionalmente, ver test.decision.no-main-js en 011).
- El comentario de cabecera de `src/test/functional/version-indicator.test.js` ("main.js#renderAppVersion NO está exportada...") queda desactualizado tras la Etapa 1 — se actualiza como parte de esa etapa, igual sin tocar la lógica del test (sigue con su réplica local `renderAppVersionInto`, es deliberado a nivel "state").

**Doubts resolved with the user:**
- *¿Dónde ubicar el módulo de arranque de estado, si usa `showToast()` y `syncFontFaces()` de la capa `ui/` y "main.js is the only point that knows and wires all layers" (001-overview.md)?* → Se crea una **capa nueva `src/app/`** con `src/app/bootState.js`, por encima de todas las capas, autorizada a importar de `core/` y `ui/`. `main.js` deja de ser el único punto que cablea capas: ahora son `main.js` y `app/`. Se documenta la capa nueva en `001-overview.md` (Etapa 3).
- *¿Por qué descomponer en 3 etapas en vez de un único `plan.md` de una pieza?* → Petición explícita del usuario: reducir el riesgo final añadiendo tests de fijación (pinning) antes de cada extracción y partiendo el cambio en pasos independientes de riesgo 0-1, implementables en orden. Las 3 etapas son intencionalmente independientes entre sí (cada una mueve una pieza aislada de `main.js` a un fichero nuevo, sin que una dependa del resultado de otra) y se implementan en el orden en que aparecen en la sección (b).

## (b) Technical solution

Cada etapa sigue el mismo patrón de dos tiempos: **(1) añadir un test de fijación que ya pasa contra el código actual** (documenta el comportamiento exacto antes de tocar nada, sirve de red de seguridad inmediata e independiente de la suite `.boot.test.js`), **(2) mover el código y adaptar los imports/tests para que sigan en verde**. Las tres etapas son independientes entre sí — no hace falta completarlas todas para que `main.js` quede correcto en un estado intermedio.

### Etapa 1 — Extraer `renderAppVersion` a `src/ui/appVersion.js`

- [ ] **`src/test/functional/version-indicator.test.js` — pin previo.** Antes de mover nada: añadir un caso `FT-037-07` que importe `renderAppVersion` desde `../../ui/appVersion.js` — el fichero aún no existe, así que este caso debe fallar (import error) hasta que la extracción se haga; **no ejecutar `npm test` con este caso ya escrito y `appVersion.js` inexistente como paso intermedio del PR** — se añade este caso y se completa la Etapa 1 en el mismo tramo de trabajo. (Alternativa más segura si se prefiere no tener un test rojo ni un instante: escribir primero el fichero `appVersion.js` vacío/estructura mínima como parte de este mismo ítem, ver siguiente tarea.)
- [ ] **`src/ui/appVersion.js` (nuevo) — crear con `renderAppVersion`.** Mismo patrón que `src/ui/appTitle.js` (módulo `ui/` que importa de `core/`). Mover íntegra la función `renderAppVersion(el)` de `main.js` (l.42-76), exportándola: `export function renderAppVersion(el) { ... }`. Imports en cabecera:
  - `import { CURRENT_VERSION } from '../data/version.js';`
  - `import { t } from '../core/i18n.js';`
  - `import { getTableText } from '../core/state.js';`
  Cabecera de comentario breve al estilo del proyecto: `// Bloque de nombre/versión de #app-version: nombre + versión, enlace al repo y, si el usuario lo configuró, su texto libre encima.` Mantener literal el string `` `BG Factory ${CURRENT_VERSION}` ``, la URL `https://github.com/yeyopepe/bgfactory`, las clases BEM `app-version__name` / `app-version__repo` / `app-version__table-text` / `app-version__separator`, y el comentario interno sobre `textContent` vs `innerHTML` / `white-space: pre-line`.
- [ ] **`src/test/functional/version-indicator.test.js` — actualizar el caso FT-037-07 y la cabecera.** El caso ahora importa `renderAppVersion` real de `ui/appVersion.js` y lo ejecuta sobre `#app-version` (mismas aserciones que el resto del fichero: nombre+versión, enlace, comportamiento con/sin texto libre). Actualizar el comentario de cabecera del fichero (l.1-6): ya no aplica "main.js#renderAppVersion NO está exportada" — anotar que ahora existe la función real exportada además de la réplica local `renderAppVersionInto` (que se mantiene sin tocar, es una réplica deliberada a nivel "state", no una necesidad).
- [ ] **`src/main.js` — usar la versión importada.** Quitar la definición local de `renderAppVersion` (l.42-76) y el import ahora innecesario de `CURRENT_VERSION` (`./data/version.js`) si no se usa en ningún otro sitio del fichero (confirmar con búsqueda textual antes de quitarlo). Añadir `import { renderAppVersion } from './ui/appVersion.js';`. `renderAll()` sigue llamando `renderAppVersion(versionEl)` exactamente igual, sin cambios en esa línea.
- [ ] **`src/test/functional/boot-app-version.boot.test.js` — actualizar el comentario, sin tocar la lógica.** Su comentario dice "Exercises the non-exported main.js#renderAppVersion for real" (011-functional-test-framework.md l.185 y cabecera del propio fichero si la tiene) — pasa a ser la función exportada de `ui/appVersion.js`, sigue probándose end-to-end vía el boot real de `main.js` (no cambia qué hace el test, solo la referencia en el comentario).

### Etapa 2 — Extraer `seedDefaultResources` a `src/data/defaultResources.js`

- [ ] **Verificación de ciclo de imports (previa, no genera fichero).** Confirmar que `core/state.js`, `core/resource.js` y `core/i18n.js` no importan de `data/defaultResources.js` (con `pv-internal-tech-analysis` ya confirmado: no hay ciclo — `core/resource.js`→`core/i18n.js`→`data/i18n.*.js`, sin retorno a `defaultResources.js`).
- [ ] **`src/test/functional/fresh-boot.test.js` — pin previo.** Añadir un caso nuevo (siguiente `FT-036-nn` libre) que importe `seedDefaultResources` desde `../../data/defaultResources.js` y verifique, a nivel "state" (sin boot real): tras `resetState()` + llamar a la función, `getResourcesSeeded()` es `true` y `getResources()` contiene `example-image` y `example-font` con el nombre traducido (`t(DEFAULT_RESOURCE_NAME_KEY[id])`). Este caso falla hasta que la función exista en `defaultResources.js` — completar en el mismo tramo de trabajo que el resto de la etapa.
- [ ] **`src/data/defaultResources.js` — absorber `DEFAULT_RESOURCE_NAME_KEY` + `seedDefaultResources`.** Añadir al final del fichero (tras `DEFAULT_RESOURCES`):
  - El mapa `DEFAULT_RESOURCE_NAME_KEY` (l.125-128 de `main.js`) con su comentario ("El nombre de cada recurso semilla se traduce en el momento de sembrarlo...").
  - `export function seedDefaultResources() { ... }` con el cuerpo actual (l.130-138), incluido el comentario del gotcha "Flag a true antes de añadir: cada `addResource()` dispara autoguardado síncrono."
  Imports nuevos en cabecera:
  - `import { addResource, markResourcesSeeded } from '../core/state.js';`
  - `import { createResource } from '../core/resource.js';`
  - `import { t } from '../core/i18n.js';`
  Corregir el comentario de cabecera del fichero (l.1-6): ya no es correcto decir "Vive en data/ porque no depende de ninguna otra capa (igual que data/version.js)" — pasa a depender de `core/`. Nuevo texto sugerido: "Datos de la galería por defecto y su siembra en sesión nueva; la siembra usa `core/` para traducir el nombre y registrar cada recurso."
- [ ] **`src/main.js` — usar la versión importada.** Quitar `DEFAULT_RESOURCE_NAME_KEY` + `seedDefaultResources` (l.123-138) y el import ahora innecesario de `DEFAULT_RESOURCES` (`./data/defaultResources.js`) y de `createResource` (`./core/resource.js`) si ya no se usan en el fichero tras quitar esta función (confirmar uno a uno). Añadir `import { seedDefaultResources } from './data/defaultResources.js';`. `bootFromSeedOrDefaults()` sigue llamando a `seedDefaultResources()` exactamente igual.
- [ ] **`src/test/functional/fresh-boot.test.js` — actualizar el comentario de cabecera.** Ya no aplica "Reproduce main.js#seedDefaultResources()" tal cual — anotar que la función real ya vive en `data/defaultResources.js` (importada por el nuevo caso de este mismo fichero) y que el resto de casos existentes sigue con su copia local deliberada a nivel "state" (no se toca su lógica).

### Etapa 3 — Extraer el arranque de estado a `src/app/bootState.js`

- [ ] **`src/test/functional/boot-seed-order.boot.test.js`, `boot-fresh-session.boot.test.js`, `boot-valid-save.boot.test.js`, `boot-corrupt-save.boot.test.js`, `boot-embedded-seed.boot.test.js`, `boot-group-backfill.boot.test.js` — confirmar que ya cubren el pin necesario.** Estos 6 ficheros ya ejercitan end-to-end, contra el `main.js` real, exactamente los 5 escenarios de arranque y el invariante de orden de hidratación que esta etapa mueve (ver `011-functional-test-framework.md`). Al ser tests `.boot.test.js` (cargan `main.js` real vía `runner-page-boot.html`), no se puede añadir un test "state" previo que importe la función nueva antes de crearla sin boot real — la única forma de pinnearla a nivel unitario sería replicar su lógica en un test local (como hace `version-indicator.test.js`), lo cual no aporta protección adicional real sobre lo que ya cubren estos 6 ficheros. **Decisión: no se añade un test nuevo en esta etapa** — se confirma antes de tocar código que los 6 ficheros pasan en verde (`npm test`) como línea base, y se relanzan tras la extracción como criterio de aceptación (ver sección (e)).
- [ ] **`src/app/bootState.js` (nuevo) — extraer el arranque de estado.** Crear la carpeta `src/app/` y el fichero. Exporta `export function hydrateStateOnStartup() { ... }` (sin valor de retorno). Contiene, en este orden exacto:
  1. La función local `bootFromSeedOrDefaults()` (l.143-156 de `main.js`), íntegra, con su comentario.
  2. El cuerpo de arranque de l.165-193: `const saved = loadState();` + la cadena `if (saved?.error === 'corrupt') { bootFromSeedOrDefaults(); showToast(t('toast.stateRecoverFailedCorrupt')); } else if (saved) { ...hidratación de panelState/resourcePanelState/tagPanelState/appTitle/tableText/resourcesSeeded/components/resources/tags + loadGroups(deriveMissingGroups(...)) } else { bootFromSeedOrDefaults(); }` — tal cual, sin reordenar.
  3. Como última sentencia de la función: `syncFontFaces(getResources());` (l.195).
  Preservar íntegro el bloque de comentario l.158-163 (gotcha de hidratar `resourcesSeeded` ANTES de `loadComponents()`/`loadResources()`) justo antes de `const saved = ...`, y el comentario del backfill de grupos (l.187-189).
  Imports en cabecera:
  - `import { loadState, readSeedState } from '../core/persistence.js';`
  - `import { loadComponents, getComponents, loadPanelState, loadResources, getResources, loadResourcePanelState, loadResourcesSeeded, loadTags, loadTagPanelState, loadAppTitle, loadGroups, loadTableText } from '../core/state.js';`
  - `import { deriveMissingGroups } from '../core/group.js';`
  - `import { syncFontFaces } from '../ui/fontFaceRegistry.js';`
  - `import { showToast } from '../ui/toast.js';`
  - `import { t } from '../core/i18n.js';`
  - `import { seedDefaultResources } from '../data/defaultResources.js';` (ya extraída en la Etapa 2 — si esta etapa se implementa antes de la 2 por cualquier motivo, importar desde `main.js` temporalmente no aplica: el orden de implementación de esta plan es 1→2→3 precisamente para que esto no ocurra).
  Cabecera de comentario: `// Arranque del estado: recupera lo guardado (o semilla/valores por defecto), hidrata cada sub-estado en orden y sincroniza tipografías. Capa app/: por encima de core/ y ui/, ver 001-overview.md.`
- [ ] **`src/main.js` — reducir a cableado.** Tras esta extracción (con las Etapas 1 y 2 ya aplicadas), dejar el fichero así:
  - Quitar del cuerpo: `bootFromSeedOrDefaults` (l.143-156) y todo el bloque `const saved = loadState(); if (...) {...}` (l.165-193) y el `syncFontFaces(getResources());` final (l.195).
  - Quitar imports ya no usados tras esta extracción (revisar uno a uno contra lo que quede en el fichero): `loadState`/`readSeedState` (`core/persistence.js`), `deriveMissingGroups` (`core/group.js`), `showToast` (`ui/toast.js`), `syncFontFaces` (`ui/fontFaceRegistry.js`), y de `core/state.js`: `loadComponents`, `loadPanelState`, `loadResources`, `loadResourcePanelState`, `loadResourcesSeeded`, `loadTags`, `loadTagPanelState`, `loadAppTitle`, `loadGroups`, `loadTableText`. **Mantener** `getResourcesSeeded` (la usa `persistState`) y el resto de getters (`getComponents`, `getPanelState`, `getResources`, `getResourcePanelState`, `getTags`, `getTagPanelState`, `getAppTitle`, `getGroups`, `getTableText`, `MODES`, `getState`). Revisar el import de `t` de `core/i18n.js`: si tras esta extracción `main.js` ya no llama a `t()` en ningún sitio, quitarlo; `initI18n` se mantiene siempre.
  - Añadir `import { hydrateStateOnStartup } from './app/bootState.js';`
  - Sustituir todo el bloque de arranque de estado eliminado por una única llamada `hydrateStateOnStartup();`, colocada **en el mismo punto del flujo** en que hoy empieza `const saved = loadState()` — es decir, después de `initGlobalShortcuts({...})` (l.117-121), respetando que las suscripciones `on(...)` ya están registradas antes de hidratar (se registran en l.98-115, la hidratación empezaba en l.165).
  - **Orden final de `main.js`**: `showSplashScreen()` → `initI18n()` → captura de los 5 elementos del DOM → definición de `renderActiveMode`/`renderAll`/`persistState` → suscripciones `on(...)` → `initGlobalShortcuts({...})` → `hydrateStateOnStartup()`. **Verificar en la implementación** que no se pierde ningún `renderAll` inicial (hoy ocurre implícitamente por los eventos `*:changed` que emiten los `load*` durante la hidratación, y las suscripciones ya están registradas antes de `hydrateStateOnStartup()` — si algún caso de la sección (e) revela una pantalla en blanco al arrancar, añadir un `renderAll()` explícito tras la llamada).
- [ ] **`src/index.html` — sin cambios.** Sigue cargando `main.js` como `<script type="module" src="main.js">`. `build.py` recorre el grafo de imports desde `main.js`, así que `ui/appVersion.js`, `data/defaultResources.js` (ya existente) y `app/bootState.js` entran solos en el bundle. No hay que registrar nada.
- [ ] **Comprobación de grafo de build.** Tras los cambios, verificar que `src/scripts/build.py` sigue resolviendo todos los imports desde `main.js` sin error (nuevo directorio `src/app/` incluido) — ejecutar el build una vez y confirmar que genera `src/_output/versions/index-v{NNNN}.html` sin fallos.

## (c) Architecture changes

Afecta a la organización de capas descrita en la arquitectura (Etapa 3 principalmente; Etapas 1 y 2 son movimientos dentro de capas ya existentes — `ui/` y `data/` — y no requieren cambios de arquitectura, solo las referencias puntuales de (c) más abajo). Ficheros de `design/docs/architecture/` a actualizar:

- **`001-overview.md`** — sección "Layered architecture" (Etapa 3):
  - Añadir la capa `app/` al diagrama de capas: `app/ → bootstrap del arranque de estado; junto con main.js, los dos puntos que conocen y cablean varias capas`.
  - Actualizar el bloque de dependencias: añadir `app/* ──▶ core/*, ui/*, data/*` y matizar `main.js is the only point that knows and wires all layers` → ahora `main.js` y `app/bootState.js` son los puntos que cablean capas (`main.js`: splash/i18n, elementos del DOM, render, eventBus, shortcuts; `app/bootState.js`: recuperación e hidratación del estado al arrancar).
  - En el resumen de capas, `main.js` pasa a describirse como "bootstrap: monta splash/i18n, localiza los contenedores, orquesta el repintado, registra suscripciones y atajos, y delega el arranque de estado en `app/bootState.js`".

- **`007-persistence-build.md`** (Etapas 2 y 3):
  - Sección "Startup (main.js)" (l.28 y siguientes): el pseudocódigo de `bootFromSeedOrDefaults()` pasa a `app/bootState.js` (`hydrateStateOnStartup()`); `bootFromSeedOrDefaults() [local to main.js]` (l.38) deja de ser "local to main.js" y pasa a ser función interna de `app/bootState.js`.
  - Sección "Default resources (`data/defaultResources.js`, `main.js`)" (l.103): `seedDefaultResources()` deja de estar en `main.js` — actualizar el encabezado de la sección a solo `data/defaultResources.js`.
  - Cualquier referencia al `showToast` del caso corrupto: ahora ocurre dentro de `hydrateStateOnStartup()` (`app/bootState.js`).
  - Mencionar en la nota de "Build" (l.8) que `build.py` recorre imports desde `main.js` e incluye `app/` igual que `core/ui/modes/data`.

- **`006-ui-layer.md`** (Etapa 1):
  - Referencias a `main.js#renderAppVersion` pasan a `ui/appVersion.js` → `renderAppVersion(el)`.

- **`011-functional-test-framework.md`** (Etapas 1 y 2, tabla "Test files"):
  - Fila de `boot-app-version.boot.test.js`: "Exercises the non-exported main.js#renderAppVersion" → pasa a ser la función exportada de `ui/appVersion.js`.
  - Fila de `version-indicator.test.js`: el gotcha "main.js#renderAppVersion is not exported..." deja de aplicarse literal — la función ya existe exportada en `ui/appVersion.js` (el fichero mantiene su réplica local deliberada, anotar por qué se conserva).

- **`008-code-conventions.md`** — opcional: si la lista de capas/carpetas de `src/` se enumera en algún punto, añadir `app/`.

## (e) Verification

- [ ] **Tras la Etapa 1.** `npm test` pasa en su totalidad; `version-indicator.test.js` y `boot-app-version.boot.test.js` en verde. En pantalla se ve "BG Factory" con el número de versión y el enlace al repositorio (abre en pestaña nueva). Con texto libre configurado en Ajustes → "Texto en la mesa": aparece encima, separado por una línea fina, y se actualiza en vivo al editarlo sin recargar.
- [ ] **Tras la Etapa 2.** `npm test` pasa en su totalidad; `fresh-boot.test.js` y `boot-fresh-session.boot.test.js` en verde. Con `localStorage` limpio y sin semilla embebida: al cargar, la galería de recursos muestra los 2 recursos de ejemplo (una imagen y una tipografía) con su nombre en el idioma activo, sin ningún aviso; recargar no los duplica.
- [ ] **Tras la Etapa 3 (verificación completa de arranque).** `npm test` pasa en su totalidad, incluidos los 6 `.boot.test.js` de arranque (`boot-seed-order`, `boot-fresh-session`, `boot-valid-save`, `boot-corrupt-save`, `boot-embedded-seed`, `boot-group-backfill`):
  - **Estado guardado válido**: se recupera todo (piezas, recursos, etiquetas, agrupaciones, título, texto de la mesa, estado de los paneles) sin ningún aviso, y no se siembran recursos de ejemplo aunque el guardado no tuviera la marca `resourcesSeeded`.
  - **Estado guardado no recuperable** (ilegible, sin piezas, o de otra versión): aparece el aviso breve "no se ha podido recuperar el estado guardado" y la app arranca desde la semilla embebida o los valores por defecto.
  - **Semilla embebida presente**: se recupera desde ella sin sembrar recursos de ejemplo.
  - **Guardados antiguos sin registro de agrupaciones**: se reconstruye una entrada de agrupación por cada `groupId` presente.
  - **Repintado general al arrancar**: la aplicación muestra el modo activo (juego o edición) correctamente renderizado, el título de cabecera y la barra de modo — sin quedarse en blanco.
  - **Atajos de teclado**: en modo edición, ESC/ENTER/DEL sobre modales y DEL/flechas sobre la selección de piezas siguen funcionando.
  - **Guardado automático**: tras cualquier cambio (mover una pieza, editar el título, cambiar de idioma) el estado se persiste; recargar lo mantiene.
- [ ] **`src/test/TRACEABILITY.md`** se regenera sin anomalías tras cada etapa.
- [ ] **Build final (tras la Etapa 3).** `python src/scripts/build.py` genera `src/_output/versions/index-v{NNNN}.html` sin errores y ese fichero, abierto directo (`file://`), arranca con el mismo comportamiento.
- [ ] **`src/main.js`** queda, al final de la Etapa 3, en ~55-65 líneas y sin lógica propia (sin construcción de DOM, sin siembra de recursos, sin hidratación de estado) — solo cableado.
